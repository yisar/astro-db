import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { green } from "kleur/colors";
import ora from "ora";
import { safeFetch } from "../runtime/utils.js";
import { MISSING_PROJECT_ID_ERROR, MISSING_SESSION_ID_ERROR } from "./errors.js";
import { getAstroStudioEnv, getAstroStudioUrl } from "./utils.js";
const SESSION_LOGIN_FILE = pathToFileURL(join(homedir(), ".astro", "session-token"));
const PROJECT_ID_FILE = pathToFileURL(join(process.cwd(), ".astro", "link"));
class ManagedLocalAppToken {
  token;
  constructor(token) {
    this.token = token;
  }
  async renew() {
  }
  async destroy() {
  }
}
class ManagedRemoteAppToken {
  token;
  session;
  projectId;
  ttl;
  expires;
  renewTimer;
  static async create(sessionToken, projectId) {
    const { token: shortLivedAppToken, ttl } = await this.createToken(sessionToken, projectId);
    return new ManagedRemoteAppToken({
      token: shortLivedAppToken,
      session: sessionToken,
      projectId,
      ttl
    });
  }
  static async createToken(sessionToken, projectId) {
    const spinner = ora("Connecting to remote database...").start();
    const response = await safeFetch(
      new URL(`${getAstroStudioUrl()}/auth/cli/token-create`),
      {
        method: "POST",
        headers: new Headers({
          Authorization: `Bearer ${sessionToken}`
        }),
        body: JSON.stringify({ projectId })
      },
      (res) => {
        throw new Error(`Failed to create token: ${res.status} ${res.statusText}`);
      }
    );
    spinner.succeed(green("Connected to remote database."));
    const { token, ttl } = await response.json();
    return { token, ttl };
  }
  constructor(options) {
    this.token = options.token;
    this.session = options.session;
    this.projectId = options.projectId;
    this.ttl = options.ttl;
    this.renewTimer = setTimeout(() => this.renew(), 1e3 * 60 * 5 / 2);
    this.expires = getExpiresFromTtl(this.ttl);
  }
  async fetch(url, body) {
    return safeFetch(
      `${getAstroStudioUrl()}${url}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.session}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      },
      () => {
        throw new Error(`Failed to fetch ${url}.`);
      }
    );
  }
  tokenIsValid() {
    return /* @__PURE__ */ new Date() > this.expires;
  }
  createRenewTimer() {
    return setTimeout(() => this.renew(), 1e3 * 60 * this.ttl / 2);
  }
  async renew() {
    clearTimeout(this.renewTimer);
    delete this.renewTimer;
    if (this.tokenIsValid()) {
      const response = await this.fetch("/auth/cli/token-renew", {
        token: this.token,
        projectId: this.projectId
      });
      if (response.status === 200) {
        this.expires = getExpiresFromTtl(this.ttl);
        this.renewTimer = this.createRenewTimer();
      } else {
        throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
      }
    } else {
      try {
        const { token, ttl } = await ManagedRemoteAppToken.createToken(
          this.session,
          this.projectId
        );
        this.token = token;
        this.ttl = ttl;
        this.expires = getExpiresFromTtl(ttl);
        this.renewTimer = this.createRenewTimer();
      } catch {
        throw new Error(
          `Token has expired and attempts to renew it have failed, please try again.`
        );
      }
    }
  }
  async destroy() {
    try {
      const response = await this.fetch("/auth/cli/token-delete", {
        token: this.token,
        projectId: this.projectId
      });
      if (response.status !== 200) {
        throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to delete token.", error?.message);
    }
  }
}
async function getProjectIdFromFile() {
  try {
    return await readFile(PROJECT_ID_FILE, "utf-8");
  } catch (error) {
    return void 0;
  }
}
async function getSessionIdFromFile() {
  try {
    return await readFile(SESSION_LOGIN_FILE, "utf-8");
  } catch (error) {
    return void 0;
  }
}
async function getManagedAppTokenOrExit(token) {
  if (token) {
    return new ManagedLocalAppToken(token);
  }
  if (process.env.ASTRO_INTERNAL_TEST_REMOTE) {
    return new ManagedLocalAppToken(
      "fake"
      /* token ignored in test */
    );
  }
  const { ASTRO_STUDIO_APP_TOKEN } = getAstroStudioEnv();
  if (ASTRO_STUDIO_APP_TOKEN) {
    return new ManagedLocalAppToken(ASTRO_STUDIO_APP_TOKEN);
  }
  const sessionToken = await getSessionIdFromFile();
  if (!sessionToken) {
    console.error(MISSING_SESSION_ID_ERROR);
    process.exit(1);
  }
  const projectId = await getProjectIdFromFile();
  if (!sessionToken || !projectId) {
    console.error(MISSING_PROJECT_ID_ERROR);
    process.exit(1);
  }
  return ManagedRemoteAppToken.create(sessionToken, projectId);
}
function getExpiresFromTtl(ttl) {
  return new Date(Date.now() + ttl * 60 * 1e3);
}
export {
  PROJECT_ID_FILE,
  SESSION_LOGIN_FILE,
  getManagedAppTokenOrExit,
  getProjectIdFromFile,
  getSessionIdFromFile
};

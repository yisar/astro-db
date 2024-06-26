import { existsSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { mkdir, writeFile } from "fs/promises";
import { blue, yellow } from "kleur/colors";
import { loadEnv } from "vite";
import parseArgs from "yargs-parser";
import { SEED_DEV_FILE_NAME } from "../../runtime/queries.js";
import { AstroDbError } from "../../runtime/utils.js";
import { CONFIG_FILE_NAMES, DB_PATH } from "../consts.js";
import { resolveDbConfig } from "../load-file.js";
import { getManagedAppTokenOrExit } from "../tokens.js";
import { getDbDirectoryUrl } from "../utils.js";
import { fileURLIntegration } from "./file-url.js";
import { typegenInternal } from "./typegen.js";
import { resolved, vitePluginDb } from "./vite-plugin-db.js";
import { vitePluginInjectEnvTs } from "./vite-plugin-inject-env-ts.js";
function astroDBIntegration() {
  let connectToStudio = false;
  let configFileDependencies = [];
  let root;
  let appToken;
  let tables = {
    get() {
      throw new Error("[astro:db] INTERNAL Tables not loaded yet");
    }
  };
  let seedFiles = {
    get() {
      throw new Error("[astro:db] INTERNAL Seed files not loaded yet");
    }
  };
  let command;
  let output = "server";
  return {
    name: "astro:db",
    hooks: {
      "astro:config:setup": async ({ updateConfig, config, command: _command, logger }) => {
        command = _command;
        root = config.root;
        output = config.output;
        if (command === "preview")
          return;
        let dbPlugin = void 0;
        const args = parseArgs(process.argv.slice(3));
        connectToStudio = process.env.ASTRO_INTERNAL_TEST_REMOTE || args["remote"];
        if (connectToStudio) {
          appToken = await getManagedAppTokenOrExit();
          dbPlugin = vitePluginDb({
            connectToStudio,
            appToken: appToken.token,
            tables,
            root: config.root,
            srcDir: config.srcDir,
            output: config.output
          });
        } else {
          dbPlugin = vitePluginDb({
            connectToStudio: false,
            tables,
            seedFiles,
            root: config.root,
            srcDir: config.srcDir,
            output: config.output
          });
        }
        updateConfig({
          vite: {
            assetsInclude: [DB_PATH],
            plugins: [dbPlugin, vitePluginInjectEnvTs(config, logger)]
          }
        });
      },
      "astro:config:done": async ({ config }) => {
        if (command === "preview")
          return;
        const { dbConfig, dependencies, integrationSeedPaths } = await resolveDbConfig(config);
        tables.get = () => dbConfig.tables;
        seedFiles.get = () => integrationSeedPaths;
        configFileDependencies = dependencies;
        const localDbUrl = new URL(DB_PATH, config.root);
        if (!connectToStudio && !existsSync(localDbUrl)) {
          await mkdir(dirname(fileURLToPath(localDbUrl)), { recursive: true });
          await writeFile(localDbUrl, "");
        }
        await typegenInternal({ tables: tables.get() ?? {}, root: config.root });
      },
      "astro:server:setup": async ({ server, logger }) => {
        const filesToWatch = [
          ...CONFIG_FILE_NAMES.map((c) => new URL(c, getDbDirectoryUrl(root))),
          ...configFileDependencies.map((c) => new URL(c, root))
        ];
        server.watcher.on("all", (event, relativeEntry) => {
          const entry = new URL(relativeEntry, root);
          if (filesToWatch.some((f) => entry.href === f.href)) {
            server.restart();
          }
        });
        setTimeout(() => {
          logger.info(
            connectToStudio ? "Connected to remote database." : "New local database created."
          );
          if (connectToStudio)
            return;
          const localSeedPaths = SEED_DEV_FILE_NAME.map(
            (name) => new URL(name, getDbDirectoryUrl(root))
          );
          let seedInFlight = false;
          if (seedFiles.get().length || localSeedPaths.find((path) => existsSync(path))) {
            loadSeedModule();
          }
          const eagerReloadIntegrationSeedPaths = seedFiles.get().map((s) => typeof s === "string" && s.startsWith(".") ? new URL(s, root) : s).filter((s) => s instanceof URL);
          const eagerReloadSeedPaths = [...eagerReloadIntegrationSeedPaths, ...localSeedPaths];
          server.watcher.on("all", (event, relativeEntry) => {
            if (event === "unlink" || event === "unlinkDir")
              return;
            const entry = new URL(relativeEntry, root);
            if (eagerReloadSeedPaths.find((path) => entry.href === path.href)) {
              loadSeedModule();
            }
          });
          function loadSeedModule() {
            if (seedInFlight)
              return;
            seedInFlight = true;
            const mod = server.moduleGraph.getModuleById(resolved.seedVirtual);
            if (mod)
              server.moduleGraph.invalidateModule(mod);
            server.ssrLoadModule(resolved.seedVirtual).then(() => {
              logger.info("Seeded database.");
            }).catch((e) => {
              logger.error(e instanceof Error ? e.message : String(e));
            }).finally(() => {
              seedInFlight = false;
            });
          }
        }, 100);
      },
      "astro:build:start": async ({ logger }) => {
        if (!connectToStudio && !databaseFileEnvDefined() && (output === "server" || output === "hybrid")) {
          const message = `Attempting to build without the --remote flag or the ASTRO_DATABASE_FILE environment variable defined. You probably want to pass --remote to astro build.`;
          const hint = "Learn more connecting to Studio: https://docs.astro.build/en/guides/astro-db/#connect-to-astro-studio";
          throw new AstroDbError(message, hint);
        }
        logger.info("database: " + (connectToStudio ? yellow("remote") : blue("local database.")));
      },
      "astro:build:done": async ({}) => {
        await appToken?.destroy();
      }
    }
  };
}
function databaseFileEnvDefined() {
  const env = loadEnv("", process.cwd());
  return env.ASTRO_DATABASE_FILE != null || process.env.ASTRO_DATABASE_FILE != null;
}
function integration() {
  return [astroDBIntegration(), fileURLIntegration()];
}
export {
  integration
};

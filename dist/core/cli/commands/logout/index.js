import { unlink } from "node:fs/promises";
import { SESSION_LOGIN_FILE } from "../../../tokens.js";
async function cmd() {
  await unlink(SESSION_LOGIN_FILE);
  console.log("Successfully logged out of Astro Studio.");
}
export {
  cmd
};

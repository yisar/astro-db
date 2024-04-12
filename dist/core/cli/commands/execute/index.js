import { existsSync } from "node:fs";
import { LibsqlError } from "@libsql/client";
import { green } from "kleur/colors";
import {
  EXEC_DEFAULT_EXPORT_ERROR,
  EXEC_ERROR,
  FILE_NOT_FOUND_ERROR,
  MISSING_EXECUTE_PATH_ERROR
} from "../../../errors.js";
import {
  getLocalVirtualModContents,
  getStudioVirtualModContents
} from "../../../integration/vite-plugin-db.js";
import { bundleFile, importBundledFile } from "../../../load-file.js";
import { getManagedAppTokenOrExit } from "../../../tokens.js";
import {} from "../../../types.js";
async function cmd({
  astroConfig,
  dbConfig,
  flags
}) {
  const filePath = flags._[4];
  if (typeof filePath !== "string") {
    console.error(MISSING_EXECUTE_PATH_ERROR);
    process.exit(1);
  }
  const fileUrl = new URL(filePath, astroConfig.root);
  if (!existsSync(fileUrl)) {
    console.error(FILE_NOT_FOUND_ERROR(filePath));
    process.exit(1);
  }
  let virtualModContents;
  if (flags.remote) {
    const appToken = await getManagedAppTokenOrExit(flags.token);
    virtualModContents = getStudioVirtualModContents({
      tables: dbConfig.tables ?? {},
      appToken: appToken.token,
      isBuild: false,
      output: "server"
    });
  } else {
    virtualModContents = getLocalVirtualModContents({
      tables: dbConfig.tables ?? {},
      root: astroConfig.root,
      shouldSeed: false,
      seedFiles: []
    });
  }
  const { code } = await bundleFile({ virtualModContents, root: astroConfig.root, fileUrl });
  const mod = await importBundledFile({ code, root: astroConfig.root });
  if (typeof mod.default !== "function") {
    console.error(EXEC_DEFAULT_EXPORT_ERROR(filePath));
    process.exit(1);
  }
  try {
    await mod.default();
    console.info(`${green("\u2714")} File run successfully.`);
  } catch (e) {
    if (e instanceof LibsqlError) {
      throw new Error(EXEC_ERROR(e.message));
    }
    throw e;
  }
}
export {
  cmd
};
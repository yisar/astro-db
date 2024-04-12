import { fileURLToPath } from "node:url";
import { normalizePath } from "vite";
import { SEED_DEV_FILE_NAME } from "../../runtime/queries.js";
import { DB_PATH, RUNTIME_CONFIG_IMPORT, RUNTIME_IMPORT, VIRTUAL_MODULE_ID } from "../consts.js";
import { getDbDirectoryUrl, getRemoteDatabaseUrl } from "../utils.js";
const WITH_SEED_VIRTUAL_MODULE_ID = "astro:db:seed";
const resolved = {
  virtual: "\0" + VIRTUAL_MODULE_ID,
  seedVirtual: "\0" + WITH_SEED_VIRTUAL_MODULE_ID
};
function vitePluginDb(params) {
  const srcDirPath = normalizePath(fileURLToPath(params.srcDir));
  let command = "build";
  return {
    name: "astro:db",
    enforce: "pre",
    configResolved(resolvedConfig) {
      command = resolvedConfig.command;
    },
    async resolveId(id, rawImporter) {
      if (id !== VIRTUAL_MODULE_ID)
        return;
      if (params.connectToStudio)
        return resolved.virtual;
      const importer = rawImporter ? await this.resolve(rawImporter) : null;
      if (!importer)
        return resolved.virtual;
      if (importer.id.startsWith(srcDirPath)) {
        return resolved.seedVirtual;
      }
      return resolved.virtual;
    },
    async load(id) {
      if (id !== resolved.virtual && id !== resolved.seedVirtual)
        return;
      if (params.connectToStudio) {
        return getStudioVirtualModContents({
          appToken: params.appToken,
          tables: params.tables.get(),
          isBuild: command === "build",
          output: params.output
        });
      }
      return getLocalVirtualModContents({
        root: params.root,
        tables: params.tables.get(),
        seedFiles: params.seedFiles.get(),
        shouldSeed: id === resolved.seedVirtual
      });
    }
  };
}
function getConfigVirtualModContents() {
  return `export * from ${RUNTIME_CONFIG_IMPORT}`;
}
function getLocalVirtualModContents({
  tables,
  root,
  seedFiles,
  shouldSeed
}) {
  const userSeedFilePaths = SEED_DEV_FILE_NAME.map(
    // Format as /db/[name].ts
    // for Vite import.meta.glob
    (name) => new URL(name, getDbDirectoryUrl("file:///")).pathname
  );
  const resolveId = (id) => id.startsWith(".") ? normalizePath(fileURLToPath(new URL(id, root))) : id;
  const integrationSeedImportStatements = [];
  const integrationSeedImportNames = [];
  seedFiles.forEach((pathOrUrl, index) => {
    const path = typeof pathOrUrl === "string" ? resolveId(pathOrUrl) : pathOrUrl.pathname;
    const importName = "integration_seed_" + index;
    integrationSeedImportStatements.push(`import ${importName} from ${JSON.stringify(path)};`);
    integrationSeedImportNames.push(importName);
  });
  const dbUrl = new URL(DB_PATH, root);
  return `
import { asDrizzleTable, createLocalDatabaseClient, normalizeDatabaseUrl } from ${RUNTIME_IMPORT};
${shouldSeed ? `import { seedLocal } from ${RUNTIME_IMPORT};` : ""}
${shouldSeed ? integrationSeedImportStatements.join("\n") : ""}

const dbUrl = normalizeDatabaseUrl(import.meta.env.ASTRO_DATABASE_FILE, ${JSON.stringify(dbUrl)});
export const db = createLocalDatabaseClient({ dbUrl });

${shouldSeed ? `await seedLocal({
	db,
	tables: ${JSON.stringify(tables)},
	userSeedGlob: import.meta.glob(${JSON.stringify(userSeedFilePaths)}, { eager: true }),
	integrationSeedFunctions: [${integrationSeedImportNames.join(",")}],
});` : ""}

export * from ${RUNTIME_CONFIG_IMPORT};

${getStringifiedTableExports(tables)}`;
}
function getStudioVirtualModContents({
  tables,
  appToken,
  isBuild,
  output
}) {
  function appTokenArg() {
    if (isBuild) {
      if (output === "server") {
        return "process.env.ASTRO_STUDIO_APP_TOKEN";
      } else {
        return `process.env.ASTRO_STUDIO_APP_TOKEN ?? ${JSON.stringify(appToken)}`;
      }
    } else {
      return JSON.stringify(appToken);
    }
  }
  function dbUrlArg() {
    const dbStr = JSON.stringify(getRemoteDatabaseUrl());
    return `import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL ?? ${dbStr}`;
  }
  return `
import {asDrizzleTable, createRemoteDatabaseClient} from ${RUNTIME_IMPORT};

export const db = await createRemoteDatabaseClient(${appTokenArg()}, ${dbUrlArg()});

export * from ${RUNTIME_CONFIG_IMPORT};

${getStringifiedTableExports(tables)}
	`;
}
function getStringifiedTableExports(tables) {
  return Object.entries(tables).map(
    ([name, table]) => `export const ${name} = asDrizzleTable(${JSON.stringify(name)}, ${JSON.stringify(
      table
    )}, false)`
  ).join("\n");
}
export {
  getConfigVirtualModContents,
  getLocalVirtualModContents,
  getStudioVirtualModContents,
  resolved,
  vitePluginDb
};

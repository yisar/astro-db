import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { DB_TYPES_FILE, RUNTIME_IMPORT } from "../consts.js";
import { resolveDbConfig } from "../load-file.js";
async function typegen(astroConfig) {
  const { dbConfig } = await resolveDbConfig(astroConfig);
  await typegenInternal({ tables: dbConfig.tables, root: astroConfig.root });
}
async function typegenInternal({ tables, root }) {
  const content = `// This file is generated by Astro DB
declare module 'astro:db' {
${Object.entries(tables).map(([name, table]) => generateTableType(name, table)).join("\n")}
}
`;
  const dotAstroDir = new URL(".astro/", root);
  if (!existsSync(dotAstroDir)) {
    await mkdir(dotAstroDir);
  }
  await writeFile(new URL(DB_TYPES_FILE, dotAstroDir), content);
}
function generateTableType(name, table) {
  const sanitizedColumnsList = Object.entries(table.columns).filter(([, val]) => !val.schema.deprecated);
  const sanitizedColumns = Object.fromEntries(sanitizedColumnsList);
  let tableType = `	export const ${name}: import(${RUNTIME_IMPORT}).Table<
		${JSON.stringify(name)},
		${JSON.stringify(sanitizedColumns)}
	>;`;
  return tableType;
}
export {
  typegen,
  typegenInternal
};

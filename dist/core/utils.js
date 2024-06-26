import { loadEnv } from "vite";
function getAstroStudioEnv(envMode = "") {
  const env = loadEnv(envMode, process.cwd(), "ASTRO_STUDIO_");
  return env;
}
function getRemoteDatabaseUrl() {
  const env = getAstroStudioEnv();
  return env.ASTRO_STUDIO_REMOTE_DB_URL || "https://db.services.astro.build";
}
function getAstroStudioUrl() {
  const env = getAstroStudioEnv();
  return env.ASTRO_STUDIO_URL || "https://studio.astro.build";
}
function getDbDirectoryUrl(root) {
  return new URL("db/", root);
}
function defineDbIntegration(integration) {
  return integration;
}
function mapObject(item, callback) {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key, callback(key, value)])
  );
}
export {
  defineDbIntegration,
  getAstroStudioEnv,
  getAstroStudioUrl,
  getDbDirectoryUrl,
  getRemoteDatabaseUrl,
  mapObject
};

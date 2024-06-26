import { safeFetch } from "../../../../runtime/utils.js";
import { MIGRATION_VERSION } from "../../../consts.js";
import { getManagedAppTokenOrExit } from "../../../tokens.js";
import {} from "../../../types.js";
import { getRemoteDatabaseUrl } from "../../../utils.js";
import {
  createCurrentSnapshot,
  createEmptySnapshot,
  formatDataLossMessage,
  getMigrationQueries,
  getProductionCurrentSnapshot
} from "../../migration-queries.js";
async function cmd({
  dbConfig,
  flags
}) {
  const isDryRun = flags.dryRun;
  const isForceReset = flags.forceReset;
  const appToken = await getManagedAppTokenOrExit(flags.token);
  const productionSnapshot = await getProductionCurrentSnapshot({ appToken: appToken.token });
  const currentSnapshot = createCurrentSnapshot(dbConfig);
  const isFromScratch = !productionSnapshot;
  const { queries: migrationQueries, confirmations } = await getMigrationQueries({
    oldSnapshot: isFromScratch ? createEmptySnapshot() : productionSnapshot,
    newSnapshot: currentSnapshot,
    reset: isForceReset
  });
  if (migrationQueries.length === 0) {
    console.log("Database schema is up to date.");
  } else {
    console.log(`Database schema is out of date.`);
  }
  if (isForceReset) {
    console.log(`Force-pushing to the database. All existing data will be erased.`);
  } else if (confirmations.length > 0) {
    console.log("\n" + formatDataLossMessage(confirmations) + "\n");
    throw new Error("Exiting.");
  }
  if (isDryRun) {
    console.log("Statements:", JSON.stringify(migrationQueries, void 0, 2));
  } else {
    console.log(`Pushing database schema updates...`);
    await pushSchema({
      statements: migrationQueries,
      appToken: appToken.token,
      isDryRun,
      currentSnapshot
    });
  }
  await appToken.destroy();
  console.info("Push complete!");
}
async function pushSchema({
  statements,
  appToken,
  isDryRun,
  currentSnapshot
}) {
  const requestBody = {
    snapshot: currentSnapshot,
    sql: statements,
    version: MIGRATION_VERSION
  };
  if (isDryRun) {
    console.info("[DRY RUN] Batch query:", JSON.stringify(requestBody, null, 2));
    return new Response(null, { status: 200 });
  }
  const url = new URL("/db/push", getRemoteDatabaseUrl());
  const response = await safeFetch(
    url,
    {
      method: "POST",
      headers: new Headers({
        Authorization: `Bearer ${appToken}`
      }),
      body: JSON.stringify(requestBody)
    },
    async (res) => {
      console.error(`${url.toString()} failed: ${res.status} ${res.statusText}`);
      console.error(await res.text());
      throw new Error(`/db/push fetch failed: ${res.status} ${res.statusText}`);
    }
  );
  const result = await response.json();
  if (!result.success) {
    console.error(`${url.toString()} unsuccessful`);
    console.error(await response.text());
    throw new Error(`/db/push fetch unsuccessful`);
  }
}
export {
  cmd
};

import path from "path";
import dotenv from "dotenv";
import { checkHealth, closePool, initSchema, migrateFromJsonFile } from "../server/db/postgres";

dotenv.config();

const sourcePath = path.resolve(process.argv[2] || "db.json");

async function main(): Promise<void> {
  if (!process.env.PGPASSWORD) {
    throw new Error("PGPASSWORD is required. PostgreSQL migration cannot run in fallback mode.");
  }

  await initSchema();
  const health = await checkHealth();
  if (!health.ok) throw new Error(`PostgreSQL is unavailable: ${health.error || "health check failed"}`);

  const migrated = await migrateFromJsonFile(sourcePath);
  if (!migrated) throw new Error(`No records were migrated from ${sourcePath}.`);
  console.log(`[PG Migration] Verified PostgreSQL after importing ${sourcePath} (${health.latencyMs}ms health latency).`);
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    console.error(`[PG Migration] ${error.message}`);
    await closePool();
    process.exitCode = 1;
  });

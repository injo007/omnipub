import path from "path";
import dotenv from "dotenv";
import { checkHealth, closePool, getPool, initSchema, migrateFromJsonFile } from "../server/db/postgres";

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

  const pool = getPool();
  if (!pool) throw new Error("PostgreSQL pool became unavailable while recording the migration.");
  await pool.query(
    `INSERT INTO deployment_migrations (id, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    ["legacy-json-v1", JSON.stringify({ source: path.basename(sourcePath), importedAt: new Date().toISOString() })]
  );
  console.log(`[PG Migration] Verified PostgreSQL after importing ${sourcePath} (${health.latencyMs}ms health latency).`);
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    console.error(`[PG Migration] ${error.message}`);
    await closePool();
    process.exitCode = 1;
  });

import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { checkHealth, closePool, getPool, initSchema, migrateFromJsonFile } from "../server/db/postgres";

dotenv.config();

const command = process.argv[2] || "db.json";
const initializeOnly = command === "--init-only";
const sourcePath = initializeOnly ? "" : path.resolve(command);

function connectionDiagnostics(): string {
  const password = process.env.PGPASSWORD || "";
  const diagnosticSalt = process.env.PG_DIAGNOSTIC_SALT || "";
  const fingerprint = diagnosticSalt
    ? crypto.createHash("sha256").update(`${diagnosticSalt}:${password}`).digest("hex").slice(0, 12)
    : "not-requested";
  return [
    `host=${process.env.PGHOST || "localhost"}`,
    `port=${process.env.PGPORT || "5432"}`,
    `database=${process.env.PGDATABASE || "editorial_db"}`,
    `user=${process.env.PGUSER || "postgres"}`,
    `password_bytes=${Buffer.byteLength(password)}`,
    `password_fingerprint=${fingerprint}`,
  ].join(" ");
}

async function main(): Promise<void> {
  if (!process.env.PGPASSWORD) {
    throw new Error("PGPASSWORD is required. PostgreSQL migration cannot run in fallback mode.");
  }

  console.log(`[PG Migration] Connection configuration: ${connectionDiagnostics()}`);

  await initSchema();
  const health = await checkHealth();
  if (!health.ok) throw new Error(`PostgreSQL is unavailable: ${health.error || "health check failed"}`);

  if (initializeOnly) {
    console.log(`[PG Bootstrap] Schema initialized and PostgreSQL connectivity verified (${health.latencyMs}ms health latency).`);
    return;
  }

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
    console.error(`[PG Migration] Failed connection configuration: ${connectionDiagnostics()}`);
    await closePool();
    process.exitCode = 1;
  });

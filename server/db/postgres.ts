import pg from "pg";
import fs from "fs";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function getPgPool(): pg.Pool | null {
  if (pool) return pool;

  const host = process.env.PGHOST || (fs.existsSync("/.dockerenv") ? "db" : "localhost");
  const port = parseInt(process.env.PGPORT || "5432", 10);
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE || "editorial_db";

  if (!password) {
    console.warn("⚠️ PGPASSWORD environment variable is not defined. Skipping PostgreSQL client initialization. Running in local cache mode.");
    return null;
  }

  pool = new Pool({
    host,
    port,
    user,
    password,
    database,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
}

export async function initPostgresSchema() {
  const pgPool = getPgPool();
  if (!pgPool) return;

  const client = await pgPool.connect();
  try {
    const tables = [
      "niches",
      "writers",
      "feeds",
      "articles",
      "suggested_sources",
      "candidates",
      "skills",
      "custom_discovered_feeds",
      "deleted_discovery_urls",
      "users",
      "usage_logs",
      "audit_logs",
      "settings",
      "notifications"
    ];

    for (const table of tables) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
    console.log("✅ PostgreSQL tables initialized successfully.");
  } catch (err: any) {
    console.error("❌ Failed to initialize PostgreSQL tables:", err.message);
  } finally {
    client.release();
  }
}

export async function persistToPostgres(col: string, docId: string, data: any) {
  const pgPool = getPgPool();
  if (!pgPool) return;

  const pgTable = toSnakeCase(col);
  try {
    const serializedData = JSON.stringify(data);
    await pgPool.query(`
      INSERT INTO ${pgTable} (id, data, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (id)
      DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP;
    `, [docId, serializedData]);
    console.log(`[PostgreSQL Sync] Saved ${pgTable}/${docId} successfully`);
  } catch (err: any) {
    console.error(`[PostgreSQL Error] Failed to write to ${pgTable}/${docId}:`, err.message);
  }
}

export async function removeFromPostgres(col: string, docId: string) {
  const pgPool = getPgPool();
  if (!pgPool) return;

  const pgTable = toSnakeCase(col);
  try {
    await pgPool.query(`
      DELETE FROM ${pgTable} WHERE id = $1;
    `, [docId]);
    console.log(`[PostgreSQL Sync] Deleted ${pgTable}/${docId} successfully`);
  } catch (err: any) {
    console.error(`[PostgreSQL Error] Failed to delete from ${pgTable}/${docId}:`, err.message);
  }
}

/**
 * PostgreSQL Database Layer
 * Primary data store for the Editorial Intelligence Platform.
 * Replaces db.json as the source of truth.
 */

import pg from "pg";
import fs from "fs";
import path from "path";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isInitialized = false;
let missingPasswordWarningShown = false;

const ALLOWED_TABLES = new Set([
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
  "notifications",
  "phase_d_packages",
  "publishing_queue",
  "phase_d_audits",
  "deployment_migrations",
]);

function assertAllowedTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Unsupported PostgreSQL table: ${table}`);
  }
}

// ─── Connection Management ───────────────────────────────────────────────────

export function getPool(): pg.Pool | null {
  if (pool) return pool;

  const host = process.env.PGHOST || (fs.existsSync("/.dockerenv") ? "db" : "localhost");
  const port = parseInt(process.env.PGPORT || "5432", 10);
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE || "editorial_db";

  if (!password) {
    if (!missingPasswordWarningShown) {
      console.warn("[PG] PGPASSWORD not set. PostgreSQL disabled. Running in local-file mode.");
      missingPasswordWarningShown = true;
    }
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

  pool.on("error", (err) => {
    console.error("[PG] Unexpected pool error:", err.message);
  });

  return pool;
}

/** @deprecated Use getPool() instead */
export const getPgPool = getPool;

export async function checkHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const p = getPool();
  if (!p) return { ok: false, latencyMs: 0, error: "PostgreSQL not configured" };
  const start = Date.now();
  try {
    await p.query("SELECT 1");
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    isInitialized = false;
  }
}

// ─── Schema Initialization ───────────────────────────────────────────────────

export async function initSchema(): Promise<void> {
  if (isInitialized) return;
  const p = getPool();
  if (!p) return;

  const client = await p.connect();
  try {
    await client.query("BEGIN");

    // Niches
    await client.query(`
      CREATE TABLE IF NOT EXISTS niches (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Writers
    await client.query(`
      CREATE TABLE IF NOT EXISTS writers (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Feeds
    await client.query(`
      CREATE TABLE IF NOT EXISTS feeds (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Articles (complex nested object — stored as JSONB)
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles (created_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_niche ON articles ((data->>'niche'))
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_status ON articles ((data->>'status'))
    `);

    // Suggested Sources
    await client.query(`
      CREATE TABLE IF NOT EXISTS suggested_sources (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Candidates
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Skills
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Custom Discovered Feeds
    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_discovered_feeds (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Deleted Discovery URLs (simple string list)
    await client.query(`
      CREATE TABLE IF NOT EXISTS deleted_discovery_urls (
        id VARCHAR(512) PRIMARY KEY,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Usage Logs (single row storing the entire usage object)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'global',
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Audit Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC)
    `);

    // Settings (single row storing the entire SaaS config)
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'saas',
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Transactional editorial packages, queue jobs, and immutable audit events.
    for (const table of ["phase_d_packages", "publishing_queue", "phase_d_audits"]) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    }
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_publishing_queue_status_next_run
      ON publishing_queue ((data->>'status'), (data->>'nextRunAt'))
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_phase_d_packages_idempotency
      ON phase_d_packages ((data->>'idempotencyKey'))
      WHERE data ? 'idempotencyKey'
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deployment_migrations (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Upgrade databases created by earlier PostgreSQL previews.
    await client.query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);

    await client.query("COMMIT")
    isInitialized = true;
    console.log("[PG] Schema initialized successfully.");
  } catch (err: any) {
    await client.query("ROLLBACK")
    console.error("[PG] Schema initialization failed:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

/** @deprecated Use initSchema() instead */
export const initPostgresSchema = initSchema;

// ─── Generic CRUD Operations ─────────────────────────────────────────────────

export async function upsertRow(table: string, id: string, data: any): Promise<void> {
  assertAllowedTable(table);
  const p = getPool();
  if (!p) return;
  try {
    await p.query(
      `INSERT INTO ${table} (id, data, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
      [id, JSON.stringify(data)]
    );
  } catch (err: any) {
    console.error(`[PG] Failed to upsert ${table}/${id}:`, err.message);
    throw err;
  }
}

export async function upsertArticle(id: string, data: any, createdAt?: string): Promise<void> {
  const p = getPool();
  if (!p) return;
  try {
    const ts = createdAt || new Date().toISOString();
    await p.query(
      `INSERT INTO articles (id, data, created_at, updated_at) VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
      [id, JSON.stringify(data), ts]
    );
  } catch (err: any) {
    console.error(`[PG] Failed to upsert article ${id}:`, err.message);
    throw err;
  }
}

export async function deleteRow(table: string, id: string): Promise<void> {
  assertAllowedTable(table);
  const p = getPool();
  if (!p) return;
  try {
    await p.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  } catch (err: any) {
    console.error(`[PG] Failed to delete ${table}/${id}:`, err.message);
    throw err;
  }
}

export async function selectAll(table: string): Promise<any[]> {
  assertAllowedTable(table);
  const p = getPool();
  if (!p) return [];
  try {
    if (table === "deleted_discovery_urls") {
      const result = await p.query(`SELECT id FROM deleted_discovery_urls ORDER BY updated_at DESC`);
      return result.rows;
    }
    const result = await p.query(`SELECT id, data FROM ${table} ORDER BY updated_at DESC`);
    return result.rows.map((row) => {
      const parsed = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      parsed.id = parsed.id || row.id;
      return parsed;
    });
  } catch (err: any) {
    console.error(`[PG] Failed to select all from ${table}:`, err.message);
    throw err;
  }
}

export async function selectAllArticles(): Promise<any[]> {
  const p = getPool();
  if (!p) return [];
  try {
    const result = await p.query(`SELECT id, data, created_at FROM articles ORDER BY created_at DESC`);
    return result.rows.map((row) => {
      const parsed = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      parsed.id = parsed.id || row.id;
      return parsed;
    });
  } catch (err: any) {
    console.error("[PG] Failed to select all articles:", err.message);
    throw err;
  }
}

export async function selectOne(table: string, id: string): Promise<any | null> {
  assertAllowedTable(table);
  const p = getPool();
  if (!p) return null;
  try {
    const result = await p.query(`SELECT data FROM ${table} WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    const parsed = typeof result.rows[0].data === "string"
      ? JSON.parse(result.rows[0].data)
      : result.rows[0].data;
    parsed.id = parsed.id || id;
    return parsed;
  } catch (err: any) {
    console.error(`[PG] Failed to select ${table}/${id}:`, err.message);
    throw err;
  }
}

export async function countRows(table: string): Promise<number> {
  assertAllowedTable(table);
  const p = getPool();
  if (!p) return 0;
  try {
    const result = await p.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
    return result.rows[0]?.count || 0;
  } catch (err: any) {
    console.error(`[PG] Failed to count ${table}:`, err.message);
    throw err;
  }
}

export async function deleteAll(table: string): Promise<void> {
  assertAllowedTable(table);
  const p = getPool();
  if (!p) return;
  try {
    await p.query(`DELETE FROM ${table}`);
  } catch (err: any) {
    console.error(`[PG] Failed to delete all from ${table}:`, err.message);
    throw err;
  }
}

// ─── Bulk Upsert (for migration & sync) ─────────────────────────────────────

export async function bulkUpsert(table: string, items: Array<{ id: string; data: any }>): Promise<number> {
  assertAllowedTable(table);
  const p = getPool();
  if (!p) return 0;
  if (items.length === 0) return 0;

  const client = await p.connect();
  let count = 0;
  try {
    await client.query("BEGIN");
    for (const item of items) {
      const isArticle = table === "articles";
      if (isArticle) {
        const ts = item.data.createdAt || new Date().toISOString();
        await client.query(
          `INSERT INTO articles (id, data, created_at, updated_at) VALUES ($1, $2, $3, NOW())
           ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
          [item.id, JSON.stringify(item.data), ts]
        );
      } else {
        await client.query(
          `INSERT INTO ${table} (id, data, updated_at) VALUES ($1, $2, NOW())
           ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
          [item.id, JSON.stringify(item.data)]
        );
      }
      count++;
    }
    await client.query("COMMIT");
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(`[PG] Bulk upsert failed for ${table}:`, err.message);
    throw err;
  } finally {
    client.release();
  }
  return count;
}

// ─── Legacy Compatibility Wrappers ───────────────────────────────────────────

/** @deprecated Use upsertRow() instead */
export async function persistToPostgres(col: string, docId: string, data: any) {
  const table = col === "articles" ? "articles" : col.replace(/([A-Z])/g, "_$1").toLowerCase();
  if (col === "articles") {
    await upsertArticle(docId, data, data?.createdAt);
  } else {
    await upsertRow(table, docId, data);
  }
}

/** @deprecated Use deleteRow() instead */
export async function removeFromPostgres(col: string, docId: string) {
  const table = col.replace(/([A-Z])/g, "_$1").toLowerCase();
  await deleteRow(table, docId);
}

// ─── Migration from db.json ──────────────────────────────────────────────────

export async function migrateFromJsonFile(jsonPath: string): Promise<boolean> {
  const p = getPool();
  if (!p) return false;

  if (!fs.existsSync(jsonPath)) {
    console.log("[PG Migration] No db.json found. Skipping migration.");
    return false;
  }

  try {
    const content = fs.readFileSync(jsonPath, "utf-8");
    const db = JSON.parse(content);

    const totalCount =
      (db.niches?.length || 0) +
      (db.writers?.length || 0) +
      (db.feeds?.length || 0) +
      (db.articles?.length || 0) +
      (db.suggestedSources?.length || 0) +
      (db.candidates?.length || 0) +
      (db.skills?.length || 0) +
      (db.customDiscoveredFeeds?.length || 0) +
      (db.users?.length || 0) +
      (db.auditLogs?.length || 0) +
      (db.notifications?.length || 0);

    if (totalCount === 0 && !db.settings) {
      console.log("[PG Migration] db.json is empty. Skipping migration.");
      return false;
    }

    console.log(`[PG Migration] Starting migration from db.json (${totalCount} items)...`);

    let migrated = 0;

    if (db.niches?.length) {
      migrated += await bulkUpsert("niches", db.niches.map((n: any) => ({ id: n.id, data: n })));
    }
    if (db.writers?.length) {
      migrated += await bulkUpsert("writers", db.writers.map((w: any) => ({ id: w.id, data: w })));
    }
    if (db.feeds?.length) {
      migrated += await bulkUpsert("feeds", db.feeds.map((f: any) => ({ id: f.id, data: f })));
    }
    if (db.articles?.length) {
      migrated += await bulkUpsert("articles", db.articles.map((a: any) => ({ id: a.id, data: a })));
    }
    if (db.suggestedSources?.length) {
      migrated += await bulkUpsert("suggested_sources", db.suggestedSources.map((s: any) => ({ id: s.id || `src-${Date.now()}`, data: s })));
    }
    if (db.candidates?.length) {
      migrated += await bulkUpsert("candidates", db.candidates.map((c: any) => ({ id: c.id, data: c })));
    }
    if (db.skills?.length) {
      migrated += await bulkUpsert("skills", db.skills.map((s: any) => ({ id: s.id, data: s })));
    }
    if (db.customDiscoveredFeeds?.length) {
      migrated += await bulkUpsert("custom_discovered_feeds", db.customDiscoveredFeeds.map((f: any) => ({ id: f.id, data: f })));
    }
    if (db.deletedDiscoveryUrls?.length) {
      const client = await p.connect();
      try {
        await client.query("BEGIN");
        for (const url of db.deletedDiscoveryUrls) {
          await client.query(
            `INSERT INTO deleted_discovery_urls (id, updated_at) VALUES ($1, NOW()) ON CONFLICT (id) DO NOTHING`,
            [url]
          );
          migrated++;
        }
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    }
    if (db.users?.length) {
      migrated += await bulkUpsert("users", db.users.map((u: any) => ({ id: u.id, data: u })));
    }
    if (db.settings) {
      await upsertRow("settings", "saas", db.settings);
      migrated++;
    }
    if (db.usageLogs) {
      await upsertRow("usage_logs", "global", db.usageLogs);
      migrated++;
    }
    if (db.auditLogs?.length) {
      migrated += await bulkUpsert("audit_logs", db.auditLogs.map((l: any) => ({ id: l.id || `audit-${Date.now()}`, data: l })));
    }
    if (db.notifications?.length) {
      migrated += await bulkUpsert("notifications", db.notifications.map((n: any) => ({ id: n.id, data: n })));
    }

    console.log(`[PG Migration] Completed. ${migrated} records migrated from db.json.`);
    return true;
  } catch (err: any) {
    console.error("[PG Migration] Failed:", err.message);
    return false;
  }
}

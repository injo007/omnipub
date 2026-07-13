/**
 * DatabaseService — Primary data access layer.
 *
 * PostgreSQL is the source of truth when configured.
 * Falls back to local db.json when PostgreSQL is unavailable.
 *
 * All routes should use `db.read()` and `db.write()` instead of
 * the legacy readDB()/writeDB() functions.
 */

import fs from "fs";
import path from "path";
import pg from "pg";
import {
  getPool,
  initSchema,
  selectAll,
  selectAllArticles,
  selectOne,
  upsertRow,
  upsertArticle,
  deleteRow,
  deleteAll,
  bulkUpsert,
  countRows,
  migrateFromJsonFile,
  checkHealth,
  closePool,
} from "./postgres";

// ─── LocalDB Shape (matches server.ts interface) ────────────────────────────

export interface LocalDB {
  writers: any[];
  feeds: any[];
  articles: any[];
  settings?: any;
  suggestedSources?: any[];
  notifications?: any[];
  candidates?: any[];
  skills?: any[];
  customDiscoveredFeeds?: any[];
  deletedDiscoveryUrls?: string[];
  niches?: any[];
  users?: any[];
  usageLogs?: any;
  auditLogs?: any[];
}

// ─── Table Name Mapping ──────────────────────────────────────────────────────

const COLLECTION_TABLE_MAP: Record<string, string> = {
  niches: "niches",
  writers: "writers",
  feeds: "feeds",
  articles: "articles",
  suggestedSources: "suggested_sources",
  candidates: "candidates",
  skills: "skills",
  customDiscoveredFeeds: "custom_discovered_feeds",
  deletedDiscoveryUrls: "deleted_discovery_urls",
  users: "users",
  usageLogs: "usage_logs",
  auditLogs: "audit_logs",
  settings: "settings",
  notifications: "notifications",
};

// ─── DatabaseService Class ───────────────────────────────────────────────────

class DatabaseService {
  private cache: LocalDB = {
    writers: [],
    feeds: [],
    articles: [],
    settings: undefined,
    suggestedSources: [],
    notifications: [],
    candidates: [],
    skills: [],
    customDiscoveredFeeds: [],
    deletedDiscoveryUrls: [],
    niches: [],
    users: [],
    usageLogs: {},
    auditLogs: [],
  };

  private pgAvailable = false;
  private initialized = false;
  private jsonFallbackPath: string;
  private pendingPersistence: Promise<void> = Promise.resolve();

  constructor() {
    this.jsonFallbackPath = path.join(process.cwd(), "db.json");
  }

  /** Check if PostgreSQL is the active backend */
  isPgAvailable(): boolean {
    return this.pgAvailable;
  }

  /** Get health status */
  async health(): Promise<{ backend: string; pg?: any; cacheSize?: number }> {
    if (this.pgAvailable) {
      const pgHealth = await checkHealth();
      return { backend: "postgresql", pg: pgHealth, cacheSize: this.estimateCacheSize() };
    }
    return { backend: "json-file", cacheSize: this.estimateCacheSize() };
  }

  private estimateCacheSize(): number {
    return (
      this.cache.writers.length +
      this.cache.feeds.length +
      this.cache.articles.length +
      (this.cache.suggestedSources?.length || 0) +
      (this.cache.candidates?.length || 0) +
      (this.cache.skills?.length || 0) +
      (this.cache.niches?.length || 0) +
      (this.cache.notifications?.length || 0) +
      (this.cache.auditLogs?.length || 0)
    );
  }

  // ─── Initialization ──────────────────────────────────────────────────────

  async initialize(defaultData?: {
    writers?: any[];
    feeds?: any[];
    articles?: any[];
    settings?: any;
    skills?: any[];
    niches?: any[];
    suggestedSources?: any[];
  }): Promise<void> {
    if (this.initialized) return;

    const pool = getPool();
    this.pgAvailable = !!pool;

    if (this.pgAvailable) {
      console.log("[DB] PostgreSQL detected. Initializing schema...");
      await initSchema();

      // Check if PG has data
      const articleCount = await countRows("articles");
      const writerCount = await countRows("writers");

      if (articleCount === 0 && writerCount === 0) {
        console.log("[DB] PostgreSQL is empty. Checking for db.json to migrate...");
        const migrated = await migrateFromJsonFile(this.jsonFallbackPath);
        if (!migrated && defaultData) {
          console.log("[DB] Seeding PostgreSQL with defaults...");
          await this.seedDefaults(defaultData);
        }
      }

      // Load everything from PG into cache
      await this.loadFromPg();
      console.log(`[DB] Loaded from PostgreSQL. Cache: ${this.estimateCacheSize()} records.`);
    } else {
      console.log("[DB] PostgreSQL not available. Using local db.json fallback.");
      this.loadFromJsonFile();
    }

    this.initialized = true;
  }

  private async seedDefaults(defaults: {
    writers?: any[];
    feeds?: any[];
    articles?: any[];
    settings?: any;
    skills?: any[];
    niches?: any[];
    suggestedSources?: any[];
  }): Promise<void> {
    if (defaults.writers?.length) {
      await bulkUpsert("writers", defaults.writers.map((w) => ({ id: w.id, data: w })));
    }
    if (defaults.feeds?.length) {
      await bulkUpsert("feeds", defaults.feeds.map((f) => ({ id: f.id, data: f })));
    }
    if (defaults.articles?.length) {
      await bulkUpsert("articles", defaults.articles.map((a) => ({ id: a.id, data: a })));
    }
    if (defaults.settings) {
      await upsertRow("settings", "saas", defaults.settings);
    }
    if (defaults.skills?.length) {
      await bulkUpsert("skills", defaults.skills.map((s) => ({ id: s.id, data: s })));
    }
    if (defaults.niches?.length) {
      await bulkUpsert("niches", defaults.niches.map((n) => ({ id: n.id, data: n })));
    }
    if (defaults.suggestedSources?.length) {
      await bulkUpsert(
        "suggested_sources",
        defaults.suggestedSources.map((s, i) => ({
          id: s.id || `src-${Date.now()}-${i}`,
          data: s,
        }))
      );
    }
  }

  // ─── Read Operations ────────────────────────────────────────────────────

  /** Full database read (matches legacy readDB() interface) */
  read(): LocalDB {
    return this.cache;
  }

  /** Get a single collection */
  getCollection<K extends keyof LocalDB>(name: K): NonNullable<LocalDB[K]> {
    return (this.cache[name] || []) as any;
  }

  /** Get settings */
  getSettings(): any {
    return this.cache.settings;
  }

  /** Find an item by ID in a collection */
  findById(collection: keyof LocalDB, id: string): any | null {
    const items = this.cache[collection] as any[];
    if (!Array.isArray(items)) return null;
    return items.find((item: any) => item.id === id) || null;
  }

  // ─── Write Operations ──────────────────────────────────────────────────

  /** Full database write. persistedDb may contain encrypted-at-rest values. */
  write(db: LocalDB, persistedDb: LocalDB = db): void {
    this.cache = db;
    if (this.pgAvailable) {
      const snapshot = JSON.parse(JSON.stringify(persistedDb));
      this.pendingPersistence = this.pendingPersistence
        .catch(() => undefined)
        .then(() => this.persistToPg(snapshot));
    }
    this.writeJsonBackup(persistedDb);
  }

  /** Update a single collection and persist */
  async updateCollection<K extends keyof LocalDB>(
    name: K,
    items: NonNullable<LocalDB[K]>
  ): Promise<void> {
    (this.cache as any)[name] = items;

    if (this.pgAvailable) {
      const table = COLLECTION_TABLE_MAP[name as string];
      if (!table) return;

      if (name === "articles") {
        const articleItems = items as any[];
        await bulkUpsert(
          "articles",
          articleItems.map((a) => ({ id: a.id, data: a }))
        );
      } else if (name === "deletedDiscoveryUrls") {
        // Special handling: array of strings
        // We don't bulk-sync the full URL list — it's managed inline
      } else if (name === "usageLogs" || name === "settings") {
        // Single-row collections
        await upsertRow(table, name === "settings" ? "saas" : "global", items);
      } else {
        const arr = items as any[];
        if (Array.isArray(arr)) {
          await bulkUpsert(
            table,
            arr.map((item: any) => ({
              id: item.id || `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              data: item,
            }))
          );
        }
      }
    }

    this.writeJsonBackup(this.cache);
  }

  /** Upsert a single item into a collection */
  async upsert(collection: keyof LocalDB, item: any, persistedItem: any = item): Promise<void> {
    if (!item || !item.id) return;

    if (collection === "settings") {
      this.cache.settings = { ...item };
      delete this.cache.settings.id;
    } else if (collection === "usageLogs") {
      this.cache.usageLogs = { ...item };
      delete this.cache.usageLogs.id;
    } else if (collection === "deletedDiscoveryUrls") {
      const urls = this.cache.deletedDiscoveryUrls || (this.cache.deletedDiscoveryUrls = []);
      const url = item.url || item.id;
      if (!urls.includes(url)) urls.push(url);
    } else {
      const items = this.cache[collection] as any[];
      if (!Array.isArray(items)) return;
      const idx = items.findIndex((i: any) => i.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.push(item);
    }

    if (this.pgAvailable) {
      const table = COLLECTION_TABLE_MAP[collection as string];
      if (table) {
        if (collection === "articles") {
          await upsertArticle(item.id, persistedItem, persistedItem.createdAt);
        } else if (collection === "settings") {
          const storedSettings = { ...persistedItem };
          delete storedSettings.id;
          await upsertRow(table, "saas", storedSettings);
        } else if (collection === "usageLogs") {
          const storedUsage = { ...persistedItem };
          delete storedUsage.id;
          await upsertRow(table, "global", storedUsage);
        } else if (collection === "deletedDiscoveryUrls") {
          const pool = getPool();
          await pool?.query(
            `INSERT INTO deleted_discovery_urls (id, updated_at) VALUES ($1, NOW()) ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
            [item.url || item.id]
          );
        } else {
          await upsertRow(table, item.id, persistedItem);
        }
      }
    }
  }

  /** Delete a single item from a collection */
  async remove(collection: keyof LocalDB, id: string): Promise<void> {
    if (collection === "settings") {
      this.cache.settings = undefined;
    } else if (collection === "usageLogs") {
      this.cache.usageLogs = {};
    } else if (collection === "deletedDiscoveryUrls") {
      this.cache.deletedDiscoveryUrls = (this.cache.deletedDiscoveryUrls || []).filter((url) => url !== id);
    } else {
      const items = this.cache[collection] as any[];
      const idx = items.findIndex((i: any) => i.id === id);
      if (idx >= 0) items.splice(idx, 1);
    }

    if (this.pgAvailable) {
      const table = COLLECTION_TABLE_MAP[collection as string];
      if (table) {
        await deleteRow(table, id);
      }
    }
  }

  /** Delete all items from a collection */
  async clearCollection(collection: keyof LocalDB): Promise<void> {
    (this.cache as any)[collection] = Array.isArray(this.cache[collection]) ? [] : {};

    if (this.pgAvailable) {
      const table = COLLECTION_TABLE_MAP[collection as string];
      if (table) {
        await deleteAll(table);
      }
    }
  }

  /** Append to a collection (for logs, audit entries, etc.) */
  append(collection: keyof LocalDB, item: any): void {
    const items = this.cache[collection] as any[];
    if (Array.isArray(items)) {
      items.unshift(item);
      // Cap at reasonable limits
      if (collection === "auditLogs" && items.length > 500) {
        items.length = 500;
      }
      if (collection === "notifications" && items.length > 200) {
        items.length = 200;
      }
    }

    if (this.pgAvailable) {
      const table = COLLECTION_TABLE_MAP[collection as string];
      if (table) {
        upsertRow(table, item.id || `${collection}-${Date.now()}`, item).catch(() => {});
      }
    }
  }

  // ─── PostgreSQL Load/Dump ───────────────────────────────────────────────

  private async loadFromPg(): Promise<void> {
    this.cache.niches = await selectAll("niches");
    this.cache.writers = await selectAll("writers");
    this.cache.feeds = await selectAll("feeds");
    this.cache.articles = await selectAllArticles();
    this.cache.suggestedSources = await selectAll("suggested_sources");
    this.cache.candidates = await selectAll("candidates");
    this.cache.skills = await selectAll("skills");
    this.cache.customDiscoveredFeeds = await selectAll("custom_discovered_feeds");

    const deletedUrls = await selectAll("deleted_discovery_urls");
    this.cache.deletedDiscoveryUrls = deletedUrls.map((d: any) => d.id || d.url || d);

    this.cache.users = await selectAll("users");
    this.cache.notifications = await selectAll("notifications");
    this.cache.auditLogs = await selectAll("audit_logs");

    const settingsRows = await selectAll("settings");
    this.cache.settings = settingsRows.length > 0 ? settingsRows[0] : undefined;

    const usageRows = await selectAll("usage_logs");
    this.cache.usageLogs = usageRows.length > 0 ? usageRows[0] : {};
  }

  private async persistToPg(db: LocalDB): Promise<void> {
    if (!this.pgAvailable) return;
    try {
        if (db.niches?.length) {
          await bulkUpsert("niches", db.niches.map((n) => ({ id: n.id, data: n })));
        }
        if (db.writers?.length) {
          await bulkUpsert("writers", db.writers.map((w) => ({ id: w.id, data: w })));
        }
        if (db.feeds?.length) {
          await bulkUpsert("feeds", db.feeds.map((f) => ({ id: f.id, data: f })));
        }
        if (db.articles?.length) {
          await bulkUpsert("articles", db.articles.map((a) => ({ id: a.id, data: a })));
        }
        if (db.suggestedSources?.length) {
          await bulkUpsert(
            "suggested_sources",
            db.suggestedSources.map((s, i) => ({
              id: s.id || `src-${i}`,
              data: s,
            }))
          );
        }
        if (db.candidates?.length) {
          await bulkUpsert("candidates", db.candidates.map((c) => ({ id: c.id, data: c })));
        }
        if (db.skills?.length) {
          await bulkUpsert("skills", db.skills.map((s) => ({ id: s.id, data: s })));
        }
        if (db.customDiscoveredFeeds?.length) {
          await bulkUpsert(
            "custom_discovered_feeds",
            db.customDiscoveredFeeds.map((f) => ({ id: f.id, data: f }))
          );
        }
        if (db.users?.length) {
          await bulkUpsert("users", db.users.map((u) => ({ id: u.id, data: u })));
        }
        if (db.settings) {
          await upsertRow("settings", "saas", db.settings);
        }
        if (db.usageLogs) {
          await upsertRow("usage_logs", "global", db.usageLogs);
        }
        if (db.auditLogs?.length) {
          await bulkUpsert(
            "audit_logs",
            db.auditLogs.map((l) => ({ id: l.id || `audit-${Date.now()}`, data: l }))
          );
        }
        if (db.notifications?.length) {
          await bulkUpsert(
            "notifications",
            db.notifications.map((n) => ({ id: n.id, data: n }))
          );
        }
    } catch (err: any) {
      console.error("[DB] PostgreSQL persistence error:", err.message);
      throw err;
    }
  }

  // ─── JSON File Fallback ─────────────────────────────────────────────────

  private loadFromJsonFile(): void {
    try {
      if (!fs.existsSync(this.jsonFallbackPath)) {
        console.log("[DB] No db.json found. Starting with empty state.");
        return;
      }
      const content = fs.readFileSync(this.jsonFallbackPath, "utf-8");
      const parsed = JSON.parse(content);
      this.cache = {
        writers: parsed.writers || [],
        feeds: parsed.feeds || [],
        articles: parsed.articles || [],
        settings: parsed.settings,
        suggestedSources: parsed.suggestedSources || [],
        notifications: parsed.notifications || [],
        candidates: parsed.candidates || [],
        skills: parsed.skills || [],
        customDiscoveredFeeds: parsed.customDiscoveredFeeds || [],
        deletedDiscoveryUrls: parsed.deletedDiscoveryUrls || [],
        niches: parsed.niches || [],
        users: parsed.users || [],
        usageLogs: parsed.usageLogs || {},
        auditLogs: parsed.auditLogs || [],
      };
    } catch (err: any) {
      console.error("[DB] Failed to load db.json:", err.message);
    }
  }

  private writeJsonBackup(db: LocalDB): void {
    if (this.pgAvailable && process.env.ENABLE_JSON_BACKUP !== "true") return;
    try {
      const content = JSON.stringify(db, null, 2);
      const tempPath = this.jsonFallbackPath + ".tmp";
      fs.writeFileSync(tempPath, content, "utf-8");
      fs.renameSync(tempPath, this.jsonFallbackPath);
    } catch (err: any) {
      console.error("[DB] Failed to write json backup:", err.message);
    }
  }

  // ─── Refresh from PG (for external mutations) ──────────────────────────

  async refresh(): Promise<void> {
    if (this.pgAvailable) {
      await this.loadFromPg();
    } else {
      this.loadFromJsonFile();
    }
  }

  async shutdown(): Promise<void> {
    await this.pendingPersistence;
    await closePool();
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

export const db = new DatabaseService();

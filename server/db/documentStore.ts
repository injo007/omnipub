import { randomUUID } from "crypto";
import type pg from "pg";
import { getPool } from "./postgres";

const COLLECTION_TABLES = {
  niches: "niches",
  writers: "writers",
  feeds: "feeds",
  articles: "articles",
  suggestedSources: "suggested_sources",
  candidates: "candidates",
  skills: "skills",
  customDiscoveredFeeds: "custom_discovered_feeds",
  users: "users",
  usageLogs: "usage_logs",
  auditLogs: "audit_logs",
  settings: "settings",
  notifications: "notifications",
  phase_d_packages: "phase_d_packages",
  phase_d_audits: "phase_d_audits",
  publishing_queue: "publishing_queue",
} as const;

type CollectionName = keyof typeof COLLECTION_TABLES;
type QueryOperator = "==" | "in";

function tableFor(collection: string): string {
  const table = COLLECTION_TABLES[collection as CollectionName];
  if (!table) throw new Error(`Unsupported database collection: ${collection}`);
  return table;
}

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function setNested(target: any, dottedKey: string, value: any): void {
  const parts = dottedKey.split(".");
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i++) {
    cursor[parts[i]] = cursor[parts[i]] && typeof cursor[parts[i]] === "object"
      ? cursor[parts[i]]
      : {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
}

export class DocumentSnapshot<T = any> {
  constructor(public readonly id: string, private readonly value: T | null) {}
  get exists(): boolean { return this.value !== null; }
  data(): T | undefined { return this.value === null ? undefined : clone(this.value); }
}

export class QuerySnapshot<T = any> {
  constructor(public readonly docs: DocumentSnapshot<T>[]) {}
  get empty(): boolean { return this.docs.length === 0; }
  forEach(callback: (doc: DocumentSnapshot<T>) => void): void { this.docs.forEach(callback); }
}

type QueryFilter = { field: string; operator: QueryOperator; value: any };

interface StoreBackend {
  get(collection: string, id: string, client?: pg.PoolClient): Promise<any | null>;
  list(collection: string, client?: pg.PoolClient): Promise<Array<{ id: string; data: any }>>;
  set(collection: string, id: string, data: any, client?: pg.PoolClient): Promise<void>;
  update(collection: string, id: string, fields: Record<string, any>, client?: pg.PoolClient): Promise<void>;
  delete(collection: string, id: string, client?: pg.PoolClient): Promise<void>;
}

class PostgresBackend implements StoreBackend {
  constructor(private readonly pool: pg.Pool) {}

  private executor(client?: pg.PoolClient): pg.Pool | pg.PoolClient { return client || this.pool; }

  async get(collection: string, id: string, client?: pg.PoolClient): Promise<any | null> {
    const lock = client ? " FOR UPDATE" : "";
    const result = await this.executor(client).query(
      `SELECT data FROM ${tableFor(collection)} WHERE id = $1${lock}`,
      [id]
    );
    return result.rows[0]?.data ?? null;
  }

  async list(collection: string, client?: pg.PoolClient): Promise<Array<{ id: string; data: any }>> {
    const result = await this.executor(client).query(
      `SELECT id, data FROM ${tableFor(collection)}`
    );
    return result.rows;
  }

  async set(collection: string, id: string, data: any, client?: pg.PoolClient): Promise<void> {
    await this.executor(client).query(
      `INSERT INTO ${tableFor(collection)} (id, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [id, JSON.stringify(data)]
    );
  }

  async update(collection: string, id: string, fields: Record<string, any>, client?: pg.PoolClient): Promise<void> {
    const current = await this.get(collection, id, client);
    if (!current) throw new Error(`${collection}/${id} not found`);
    const next = clone(current);
    for (const [key, value] of Object.entries(fields)) setNested(next, key, value);
    await this.set(collection, id, next, client);
  }

  async delete(collection: string, id: string, client?: pg.PoolClient): Promise<void> {
    await this.executor(client).query(`DELETE FROM ${tableFor(collection)} WHERE id = $1`, [id]);
  }
}

class MemoryBackend implements StoreBackend {
  private readonly collections = new Map<string, Map<string, any>>();

  reset(): void { this.collections.clear(); }
  private collection(name: string): Map<string, any> {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    return this.collections.get(name)!;
  }
  async get(collection: string, id: string): Promise<any | null> {
    return this.collection(collection).has(id) ? clone(this.collection(collection).get(id)) : null;
  }
  async list(collection: string): Promise<Array<{ id: string; data: any }>> {
    return [...this.collection(collection)].map(([id, data]) => ({ id, data: clone(data) }));
  }
  async set(collection: string, id: string, data: any): Promise<void> { this.collection(collection).set(id, clone(data)); }
  async update(collection: string, id: string, fields: Record<string, any>): Promise<void> {
    const current = await this.get(collection, id);
    if (!current) throw new Error(`${collection}/${id} not found`);
    for (const [key, value] of Object.entries(fields)) setNested(current, key, value);
    await this.set(collection, id, current);
  }
  async delete(collection: string, id: string): Promise<void> { this.collection(collection).delete(id); }
}

const memoryBackend = new MemoryBackend();

export class DocumentReference<T = any> {
  constructor(
    private readonly backend: StoreBackend,
    public readonly collectionName: string,
    public readonly id: string,
    private readonly client?: pg.PoolClient
  ) {}
  get path(): string { return `${this.collectionName}/${this.id}`; }
  async get(): Promise<DocumentSnapshot<T>> {
    return new DocumentSnapshot(this.id, await this.backend.get(this.collectionName, this.id, this.client));
  }
  async set(data: T): Promise<void> { await this.backend.set(this.collectionName, this.id, data, this.client); }
  async update(fields: Partial<T> | Record<string, any>): Promise<void> {
    await this.backend.update(this.collectionName, this.id, fields as Record<string, any>, this.client);
  }
  async delete(): Promise<void> { await this.backend.delete(this.collectionName, this.id, this.client); }
}

class Query<T = any> {
  constructor(
    private readonly backend: StoreBackend,
    private readonly collectionName: string,
    private readonly filters: QueryFilter[] = [],
    private readonly order?: { field: string; direction: "asc" | "desc" },
    private readonly maxRows?: number
  ) {}
  where(field: string, operator: QueryOperator, value: any): Query<T> {
    return new Query(this.backend, this.collectionName, [...this.filters, { field, operator, value }], this.order, this.maxRows);
  }
  orderBy(field: string, direction: "asc" | "desc" = "asc"): Query<T> {
    return new Query(this.backend, this.collectionName, this.filters, { field, direction }, this.maxRows);
  }
  limit(maxRows: number): Query<T> {
    return new Query(this.backend, this.collectionName, this.filters, this.order, maxRows);
  }
  async get(): Promise<QuerySnapshot<T>> {
    let rows = await this.backend.list(this.collectionName);
    rows = rows.filter(({ data }) => this.filters.every(({ field, operator, value }) => {
      const actual = field.split(".").reduce((cursor, part) => cursor?.[part], data);
      return operator === "in" ? Array.isArray(value) && value.includes(actual) : actual === value;
    }));
    if (this.order) {
      const { field, direction } = this.order;
      rows.sort((a, b) => {
        const av = field.split(".").reduce((cursor, part) => cursor?.[part], a.data);
        const bv = field.split(".").reduce((cursor, part) => cursor?.[part], b.data);
        const result = String(av ?? "").localeCompare(String(bv ?? ""));
        return direction === "desc" ? -result : result;
      });
    }
    if (this.maxRows !== undefined) rows = rows.slice(0, this.maxRows);
    return new QuerySnapshot(rows.map(({ id, data }) => new DocumentSnapshot<T>(id, data)));
  }
}

export class CollectionReference<T = any> extends Query<T> {
  constructor(private readonly storeBackend: StoreBackend, public readonly name: string, private readonly client?: pg.PoolClient) {
    super(storeBackend, name);
  }
  doc(id: string = randomUUID()): DocumentReference<T> { return new DocumentReference(this.storeBackend, this.name, id, this.client); }
  async add(data: T): Promise<DocumentReference<T>> {
    const ref = this.doc();
    await ref.set(data);
    return ref;
  }
}

export interface DocumentTransaction {
  get<T>(ref: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
  set<T>(ref: DocumentReference<T>, data: T): Promise<void>;
  update<T>(ref: DocumentReference<T>, fields: Partial<T> | Record<string, any>): Promise<void>;
  delete<T>(ref: DocumentReference<T>): Promise<void>;
}

export class DocumentStore {
  constructor(private readonly backend: StoreBackend, private readonly pool?: pg.Pool) {}
  collection<T = any>(name: string): CollectionReference<T> {
    tableFor(name);
    return new CollectionReference<T>(this.backend, name);
  }
  async runTransaction<T>(callback: (transaction: DocumentTransaction) => Promise<T>): Promise<T> {
    if (!this.pool) {
      const transaction: DocumentTransaction = {
        get: (ref) => ref.get(), set: (ref, data) => ref.set(data),
        update: (ref, fields) => ref.update(fields), delete: (ref) => ref.delete()
      };
      return callback(transaction);
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const txBackend = new PostgresBackend(this.pool);
      const transaction: DocumentTransaction = {
        get: (ref) => new DocumentReference(txBackend, ref.collectionName, ref.id, client).get(),
        set: (ref, data) => new DocumentReference(txBackend, ref.collectionName, ref.id, client).set(data),
        update: (ref, fields) => new DocumentReference(txBackend, ref.collectionName, ref.id, client).update(fields),
        delete: (ref) => new DocumentReference(txBackend, ref.collectionName, ref.id, client).delete(),
      };
      const result = await callback(transaction);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

let store: DocumentStore | null = null;
let forceMemoryStore = false;

export function getDocumentStore(): DocumentStore {
  if (forceMemoryStore && store) return store;
  const pool = getPool();
  if (!store) store = pool ? new DocumentStore(new PostgresBackend(pool), pool) : new DocumentStore(memoryBackend);
  return store;
}

export function resetInMemoryDocumentStore(): void {
  memoryBackend.reset();
  store = new DocumentStore(memoryBackend);
  forceMemoryStore = true;
}

export async function seedDocument(collection: string, id: string, data: any): Promise<void> {
  await getDocumentStore().collection(collection).doc(id).set(data);
}

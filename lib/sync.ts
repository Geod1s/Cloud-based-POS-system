// lib/sync.ts
import { supabase } from '@/lib/supabase';
import { getLocalDb } from '@/lib/local-db';
import { isTauri } from '@/lib/runtime';
/** --- Types for local tables & queue --- */
type UUID = string;
type ISODate = string;

type ChangeOp = 'upsert' | 'delete';

interface QueuedChange {
  id: number;                 // AUTOINCREMENT PK in change_queue
  table_name: 'products' | 'customers' | 'sales' | 'sale_items';
  op: ChangeOp;
  row_json: string;           // serialized row
  updated_at: ISODate;
}

interface KVRow { key: string; value: string; }

/** Example row shapes (adjust to your schema if you have extra columns) */
interface ProductRow {
  id: UUID; name: string; sku: string | null; price_cents: number;
  deleted: 0 | 1; updated_at: ISODate; device_id?: string | null;
}

interface CustomerRow {
  id: UUID; name: string; phone?: string | null; email?: string | null;
  deleted: 0 | 1; updated_at: ISODate; device_id?: string | null;
}

interface SaleRow {
  id: UUID; customer_id: UUID | null; total_cents: number; paid_cents: number;
  status: string; deleted: 0 | 1; updated_at: ISODate; device_id?: string | null;
}

interface SaleItemRow {
  id: UUID; sale_id: UUID; product_id: UUID; qty: number; price_cents: number;
  deleted: 0 | 1; updated_at: ISODate; device_id?: string | null;
}

type TableName = 'products' | 'customers' | 'sales' | 'sale_items';
type TableRow = ProductRow | CustomerRow | SaleRow | SaleItemRow;

/** --- Small typed helpers around the SQL plugin --- */
async function selectAll<T>(sql: string, args: unknown[] = []): Promise<T[]> {
  const db = await getLocalDb();
  // plugin returns unknown - cast once, in our helper
  return (await db.select(sql, args)) as T[];
}

async function execute(sql: string, args: unknown[] = []): Promise<void> {
  const db = await getLocalDb();
  await db.execute(sql, args);
}

async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const rows = await selectAll<KVRow>(`SELECT key, value FROM kv WHERE key=?`, [key]);
  if (!rows.length) return null;
  try {
    return JSON.parse(rows[0].value) as T;
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  await execute(
    `INSERT INTO kv (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    [key, JSON.stringify(value)]
  );
}

/** Chunk helper with proper typing */
function chunk<T>(arr: T[], size = 500): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** --- PUSH: upload queued local changes to Supabase --- */
export async function pushChanges(): Promise<void> {
  if (!isTauri) return; // <-- added guard

  const queued = await selectAll<QueuedChange>(
    `SELECT id, table_name, op, row_json, updated_at
     FROM change_queue
     ORDER BY id
     LIMIT 2000`
  );
  if (queued.length === 0) return;

  // Group by table with explicit accumulator/element types
  const byTable = queued.reduce<Record<TableName, QueuedChange[]>>(
    (acc: Record<TableName, QueuedChange[]>, row: QueuedChange) => {
      const t = row.table_name;
      (acc[t] ||= []).push(row);
      return acc;
    },
    { products: [], customers: [], sales: [], sale_items: [] }
  );

  // Iterate with typed entries
  const entries = Object.entries(byTable) as [TableName, QueuedChange[]][];
  for (const [table, items] of entries) {
    const ups: TableRow[] = [];
    const dels: { id: UUID }[] = [];

    for (const i of items) {
      const parsed = JSON.parse(i.row_json) as TableRow | { id: UUID; deleted?: number; updated_at?: ISODate };
      if (i.op === 'upsert') ups.push(parsed as TableRow);
      else dels.push({ id: (parsed as { id: UUID }).id });
    }

    // Upsert in chunks
    for (const part of chunk<TableRow>(ups, 500)) {
      if (part.length) {
        const { error } = await supabase.from(table).upsert(part, { onConflict: 'id' });
        if (error) throw error;
      }
    }

    // Soft delete on server (set deleted = 1)
    if (dels.length) {
      const ids = dels.map((d: { id: UUID }) => d.id);
      const { error } = await supabase.from(table).update({ deleted: 1 }).in('id', ids);
      if (error) throw error;
    }

    // Clear processed rows from queue
    const qids = items.map((i: QueuedChange) => i.id);
    await execute(
      `DELETE FROM change_queue WHERE id IN (${qids.map(() => '?').join(',')})`,
      qids
    );
  }
}

/** --- PULL: download server changes since last watermark --- */
export async function pullChanges(): Promise<void> {
  if (!isTauri) return; // <-- added guard

  const lastPull = (await kvGet<string>('last_pull')) ?? '1970-01-01T00:00:00.000Z';
  const tables: TableName[] = ['products', 'customers', 'sales', 'sale_items'];

  for (const table of tables) {
    let from: ISODate = lastPull;
    let page = 0;

    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .gt('updated_at', from)
        .order('updated_at', { ascending: true })
        .range(page * 999, page * 999 + 999);

      if (error) throw error;
      const rows = (data ?? []) as TableRow[];
      if (rows.length === 0) break;

      await execute('BEGIN');
      try {
        for (const row of rows) {
          const cols = Object.keys(row);
          const qs = cols.map(() => '?').join(',');
          const upCols = cols.map((k) => `${k}=excluded.${k}`).join(',');
          await execute(
            `INSERT INTO ${table} (${cols.join(',')}) VALUES (${qs})
             ON CONFLICT(id) DO UPDATE SET ${upCols}`,
            Object.values(row)
          );
          // advance watermark
          from = (row as { updated_at: ISODate }).updated_at;
        }
        await execute('COMMIT');
      } catch (e) {
        await execute('ROLLBACK');
        throw e;
      }

      if (rows.length < 1000) break;
      page += 1;
    }
  }

  await kvSet('last_pull', new Date().toISOString());
}

/** Run a full sync: push first (so server has our latest), then pull */
export async function runSync(): Promise<void> {
  if (!isTauri) return; // <-- added guard
  await pushChanges();
  await pullChanges();
}

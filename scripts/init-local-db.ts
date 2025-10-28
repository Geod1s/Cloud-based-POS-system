// scripts/init-local-db.ts
import { getLocalDb } from '@/lib/local-db';
import { isTauri } from '@/lib/runtime';

export async function initLocalDb() {
  // ✅ No-op when running in the browser (Next dev/preview)
  if (!isTauri) return;

  const db = await getLocalDb();

  // Master-ish entities
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      price_cents INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      device_id TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      deleted INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      device_id TEXT
    );
  `);

  // Event-ish data (avoid conflicts by storing events, not a single "stock")
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      total_cents INTEGER NOT NULL,
      paid_cents INTEGER NOT NULL,
      status TEXT NOT NULL, -- e.g. 'completed' | 'void'
      deleted INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      device_id TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      price_cents INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      device_id TEXT
    );
  `);

  // Local mutation queue for offline writes
  await db.execute(`
    CREATE TABLE IF NOT EXISTS change_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL, -- 'products' | 'customers' | 'sales' | 'sale_items'
      op TEXT NOT NULL,         -- 'upsert' | 'delete'
      row_json TEXT NOT NULL,   -- serialized row
      updated_at TEXT NOT NULL  -- for ordering
    );
  `);

  // Tiny KV store for app metadata
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Optional: schema versioning if you’ll evolve tables
  await db.execute(`
    INSERT INTO kv (key, value) VALUES ('schema_version','1')
    ON CONFLICT(key) DO NOTHING;
  `);
}

// lib/repo/products.ts
import { getLocalDb } from '@/lib/local-db';
import { v4 as uuid } from 'uuid';

const nowIso = () => new Date().toISOString();

export async function upsertProductLocal(p: {
  id?: string; name: string; sku?: string | null; price_cents: number;
}) {
  const db = await getLocalDb();
  const id = p.id ?? uuid();
  const updated_at = nowIso();

  await db.execute(
    `INSERT INTO products (id, name, sku, price_cents, deleted, updated_at)
     VALUES (?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       sku=excluded.sku,
       price_cents=excluded.price_cents,
       updated_at=excluded.updated_at`,
    [id, p.name, p.sku ?? null, p.price_cents, updated_at]
  );

  await db.execute(
    `INSERT INTO change_queue (table_name, op, row_json, updated_at)
     VALUES ('products','upsert',?,?)`,
    [JSON.stringify({ id, ...p, updated_at, deleted: 0 }), updated_at]
  );

  return id;
}

export async function deleteProductLocal(id: string) {
  const db = await getLocalDb();
  const updated_at = nowIso();

  // soft delete
  await db.execute(`UPDATE products SET deleted=1, updated_at=? WHERE id=?`, [updated_at, id]);

  await db.execute(
    `INSERT INTO change_queue (table_name, op, row_json, updated_at)
     VALUES ('products','delete',?,?)`,
    [JSON.stringify({ id, updated_at, deleted: 1 }), updated_at]
  );
}

export async function listProductsLocal() {
  const db = await getLocalDb();
  return db.select(`SELECT * FROM products WHERE deleted=0 ORDER BY name`);
}

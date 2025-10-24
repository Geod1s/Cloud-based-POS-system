// lib/offline-products.ts
import { getDB } from "./local-db";

export async function upsertProductLocal(prod: {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  // ...etc
}) {
  const db = await getDB();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO products (
       id,name,description,price,stock_quantity,created_at,local_updated_at,is_deleted
     ) VALUES (?1,?2,?3,?4,?5,?6,?7,0)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       description=excluded.description,
       price=excluded.price,
       stock_quantity=excluded.stock_quantity,
       local_updated_at=excluded.local_updated_at;`,
    [
      prod.id,
      prod.name,
      prod.description ?? null,
      prod.price,
      prod.stock_quantity,
      now,
      now,
    ]
  );

  // Queue to outbox
  await db.execute(
    `INSERT INTO outbox (entity_type, op, entity_id, payload, created_at)
     VALUES ('product','upsert',?1,?2,?3)`,
    [prod.id, JSON.stringify(prod), now]
  );
}

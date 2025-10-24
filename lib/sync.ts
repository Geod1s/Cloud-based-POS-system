// lib/sync.ts
import { createBrowserClient } from "@/lib/client"; // your supabase-js setup
import { getLocalDb } from "./local-db";

// basic LWW conflict resolution: use timestamps
function isServerNewer(remoteUpdatedAt?: string | null, localUpdatedAt?: string | null) {
  if (!remoteUpdatedAt) return false;
  if (!localUpdatedAt) return true;
  return new Date(remoteUpdatedAt).getTime() > new Date(localUpdatedAt).getTime();
}

export async function syncNow() {
  if (!navigator.onLine) {
    return { ok: false, message: "Offline — cannot sync now" };
  }

  const db = await getLocalDb();
  const supabase = createBrowserClient();

  // 1) PUSH: send local changes in outbox
  const outbox = await db.select<{ id: number; entity_type: string; op: string; entity_id: string; payload: string }[]>(
    "SELECT id, entity_type, op, entity_id, payload FROM outbox ORDER BY id ASC"
  );

  for (const row of outbox) {
    const body = JSON.parse(row.payload);

    // Example push for products (adjust table/columns to your schema)
    if (row.entity_type === "product") {
      // Upsert into Supabase
      const { error } = await supabase.from("products").upsert(body);
      if (error) throw error;

      // Remove from outbox on success
      await db.execute("DELETE FROM outbox WHERE id = ?1", [row.id]);

      // Mark local remote_updated_at to now (so we know it's in sync)
      await db.execute(
        "UPDATE products SET remote_updated_at = ?1 WHERE id = ?2",
        [new Date().toISOString(), row.entity_id]
      );
    }

    // Repeat for categories/customers/etc.
  }

  // 2) PULL: fetch server state changed since last pull
  // A simple approach: pull all and LWW (last write wins) on the client.
  // Better: keep a server-side "updated_at" index and fetch only changed rows.
  const { data: remoteProducts, error: pullErr } = await supabase
    .from("products")
    .select("*");
  if (pullErr) throw pullErr;

  // Merge
  for (const rp of remoteProducts ?? []) {
    // compare timestamps
    const local = await db.select<any[]>(
      "SELECT id, local_updated_at, remote_updated_at FROM products WHERE id = ?1",
      [rp.id]
    );

    const localUpdated = local?.[0]?.local_updated_at ?? null;
    const remoteUpdated = rp.updated_at ?? rp.remote_updated_at ?? null; // adapt to your column names

    if (isServerNewer(remoteUpdated, localUpdated)) {
      // overwrite local with server
      await db.execute(
        `INSERT INTO products (id,name,description,price,stock_quantity,created_at,local_updated_at,remote_updated_at,is_deleted)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           description=excluded.description,
           price=excluded.price,
           stock_quantity=excluded.stock_quantity,
           local_updated_at=excluded.local_updated_at,
           remote_updated_at=excluded.remote_updated_at,
           is_deleted=excluded.is_deleted;`,
        [
          rp.id,
          rp.name,
          rp.description ?? null,
          rp.price,
          rp.stock_quantity ?? 0,
          rp.created_at ?? new Date().toISOString(),
          new Date().toISOString(), // we just changed local
          remoteUpdated ?? new Date().toISOString(),
          rp.is_deleted ? 1 : 0,
        ]
      );
    }
  }

  return { ok: true, message: "Synced" };
}

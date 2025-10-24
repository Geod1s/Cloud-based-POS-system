import { getLocalDb } from "@/lib/local-db";

export async function queueOp(userId: string, type: string, payload: unknown) {
  const db = await getLocalDb();
  await db.execute(
    `INSERT INTO pending_ops (id, user_id, op_type, payload, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), userId, type, JSON.stringify(payload), new Date().toISOString()]
  );
}

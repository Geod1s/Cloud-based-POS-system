// lib/local-db.ts
import Database from "@tauri-apps/plugin-sql";
import { LOCAL_SCHEMA } from "./local-schema";

let _db: Database | null = null;

export async function getLocalDb(): Promise<Database> {
  if (_db) return _db;

  // Optional guard so the browser build throws a clear message instead of crashing
  if (typeof window !== "undefined" && !(window as any).__TAURI__) {
    throw new Error("Local SQLite is only available in the Tauri app runtime.");
  }

  _db = await Database.load("sqlite:cloudpos.db");
  await ensureSchema(_db);
  return _db;
}

async function ensureSchema(db: Database): Promise<void> {
  const rows = (await db.select("PRAGMA user_version")) as Array<{ user_version: number }>;
  const current = rows?.[0]?.user_version ?? 0;

  if (current < 1) {
    await db.execute("BEGIN");
    for (const stmt of LOCAL_SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
      await db.execute(stmt);
    }
    await db.execute("PRAGMA user_version = 1");
    await db.execute("COMMIT");
  }
}

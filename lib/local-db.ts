// lib/local-db.ts
import Database from '@tauri-apps/plugin-sql';

// Minimal shape we need from the DB object
type DB = {
  select: (sql: string, args?: unknown[]) => Promise<unknown[]>;
  execute: (sql: string, args?: unknown[]) => Promise<void>;
};

let _db: DB | null = null;

export async function getLocalDb(): Promise<DB> {
  if (_db) return _db;

  // If we're NOT inside Tauri (i.e., running in web/Next dev), return a no-op DB.
  if (typeof window !== 'undefined' && !(window as any).__TAURI__) {
    _db = {
      async select() { return []; },          // no results in web mode
      async execute() { /* no-op in web */ }, // silently ignore writes in web mode
    };
    return _db;
  }

  // Tauri app runtime: open real SQLite
  _db = (await Database.load('sqlite:cloudpos.db')) as unknown as DB;
  return _db;
}

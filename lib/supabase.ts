// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const url = rawUrl.replace(/\/+$/, ''); // strip trailing slash

const isTauri = typeof window !== 'undefined' && '__TAURI__' in (window as any);

// Minimal runtime-safe type for the Tauri Store instance
type TauriStore = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<void>;
  save?: () => Promise<void>;
};

let storePromise: Promise<TauriStore> | null = null;
async function getStore(): Promise<TauriStore> {
  if (!isTauri) {
    // Browser fallback: use localStorage
    return {
      async get(k) { return typeof window !== 'undefined' ? window.localStorage.getItem(String(k)) : null; },
      async set(k, v) { if (typeof window !== 'undefined') window.localStorage.setItem(String(k), String(v)); },
      async delete(k) { if (typeof window !== 'undefined') window.localStorage.removeItem(String(k)); },
    };
  }
  if (!storePromise) {
    storePromise = (async () => {
      const mod: any = await import('@tauri-apps/plugin-store');
      const S: any = mod.Store;
      if (S?.open) return (await S.open('auth.bin')) as TauriStore; // v2
      if (S?.load) return (await S.load('auth.bin')) as TauriStore; // some v2 minors
      return new S('auth.bin') as TauriStore;                       // v1
    })();
  }
  return storePromise;
}

// Offline-aware fetch: if offline, short-circuit so the SDK won’t try requests
const offlineAwareFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    // Throw a predictable error so callers can catch/suppress it
    throw new TypeError('Offline: blocked network request');
  }
  return fetch(input as any, init);
};

const storage = {
  getItem: async (key: string) => {
    const store = await getStore();
    const v = await store.get(key);
    return v == null ? null : (typeof v === 'string' ? v : String(v));
  },
  setItem: async (key: string, value: string) => {
    const store = await getStore();
    await store.set(key, value);
    if (typeof store.save === 'function') await store.save();
  },
  removeItem: async (key: string) => {
    const store = await getStore();
    await store.delete(key);
    if (typeof store.save === 'function') await store.save();
  },
};

export const supabase = createClient(url, anon, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,      // we'll pause this while offline (below)
    detectSessionInUrl: false,
  },
  global: {
    fetch: offlineAwareFetch,    // 👈 important
  },
});

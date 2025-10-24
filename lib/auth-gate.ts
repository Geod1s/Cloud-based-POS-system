// lib/auth-gate.ts
import { createBrowserClient } from "@/lib/client";
import { unlockOffline } from "@/lib/offline-auth";
import { getLocalDb } from "@/lib/local-db"; // whatever you use to open SQLite

export type AuthGateState =
  | { status: "online"; user: any; profile: any }
  | { status: "offline"; user: any; profile: any }
  | { status: "unauthenticated" };

export async function resolveAuthGate(emailForOffline?: string, pinForOffline?: string): Promise<AuthGateState> {
  const supabase = createBrowserClient();

  // Try online session
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      // you can also fetch role/profile here and cache or read last-known from local DB
      return { status: "online", user: data.user, profile: null };
    }
  } catch {
    /* ignore */
  }

  // If we have offline creds (user entered), try offline unlock
  if (emailForOffline && pinForOffline) {
    const db = await getLocalDb();
    const offline = await unlockOffline(db, emailForOffline, pinForOffline);
    return { status: "offline", user: offline.user, profile: offline.profile };
  }

  return { status: "unauthenticated" };
}

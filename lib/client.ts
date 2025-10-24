import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,          // cache tokens in webview storage
        autoRefreshToken: false,       // don't heartbeat-refresh when offline
        detectSessionInUrl: false,
      },
    }
  );
}

// app/dashboard/layout.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/client";
import DashboardGuard from "./DashboardGuard";
import { DashboardNav } from "@/components/dashboard-nav";
import { SyncButton } from "@/components/sync-button";
import type { User } from "@supabase/supabase-js";

type NavProfile = { role: string; full_name: string | null } | null;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<NavProfile>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createBrowserClient();

      // Get current user
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        router.replace("/auth/login");
        return;
      }

      setUser(data.user);

      // Fetch only the fields DashboardNav expects
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .single();

        if (!cancelled) {
          setProfile(prof ? { role: prof.role ?? "", full_name: prof.full_name ?? null } : null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Ensure non-null user and a defined (nullable) profile before rendering nav
  if (!ready || !user) return <div style={{ padding: 16 }} />;

  return (
    <DashboardGuard>
      <div className="flex min-h-screen">
        <DashboardNav user={user} profile={profile} />
        <main className="flex-1 lg:ml-64 p-6 lg:p-8 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex-1" />
            <SyncButton />
          </div>
          {children}
        </main>
      </div>
    </DashboardGuard>
  );
}

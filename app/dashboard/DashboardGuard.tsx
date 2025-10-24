// app/dashboard/DashboardGuard.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/client";

export default function DashboardGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !data.user) {
        router.replace("/auth/login");
      } else {
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Minimal placeholder while checking auth (keeps static export happy)
  if (!ready) return <div style={{ padding: 16 }} />;

  return <>{children}</>;
}

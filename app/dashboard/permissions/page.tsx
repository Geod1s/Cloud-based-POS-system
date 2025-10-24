// app/dashboard/permissions/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/client";
import { PermissionsTable } from "@/components/permissions-table";

export default function PermissionsPage() {
  const router = useRouter();
  const [tags, setTags] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const supabase = createBrowserClient();

        // Auth check
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        if (!auth.user) {
          router.replace("/auth/login");
          return;
        }

        // Admin role check
        const { data: profile, error: roleErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", auth.user.id)
          .single();
        if (roleErr) throw roleErr;

        if (profile?.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        // Fetch all permission tags
        const { data, error } = await supabase
          .from("permission_tags")
          .select("*")
          .order("name", { ascending: true });
        if (error) throw error;

        if (!cancelled) setTags(data ?? []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load permission tags.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
          Permission Tags
        </h1>
        <p className="text-muted-foreground mt-2">
          Create and manage permission tags to control access to system features
        </p>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && !loading && <div className="text-sm text-red-600">Error: {err}</div>}

      {!loading && !err && <PermissionsTable tags={tags} />}
    </div>
  );
}

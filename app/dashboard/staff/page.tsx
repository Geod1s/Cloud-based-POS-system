// app/dashboard/staff/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/client";
import { StaffTable } from "@/components/staff-table";

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = React.useState<any[]>([]);
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

        // Session check
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        if (!auth.user) {
          router.replace("/auth/login");
          return;
        }

        // Role check (must be admin)
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

        // Load staff + tags in parallel
        const [
          { data: staffRows, error: staffErr },
          { data: tagRows, error: tagsErr },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(`
              *,
              user_tags (
                permission_tags (
                  id,
                  name
                )
              )
            `)
            .order("created_at", { ascending: false }),
          supabase.from("permission_tags").select("*").order("name", { ascending: true }),
        ]);

        if (staffErr) throw staffErr;
        if (tagsErr) throw tagsErr;

        if (!cancelled) {
          setStaff(staffRows ?? []);
          setTags(tagRows ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load staff data.");
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
          Staff Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage staff users, assign permission tags, and control access
        </p>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && !loading && <div className="text-sm text-red-600">Error: {err}</div>}

      {!loading && !err && <StaffTable staff={staff} tags={tags} />}
    </div>
  );
}

// app/dashboard/categories/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/client";
import { CategoriesTable } from "@/components/categories-table";
import { AddCategoryDialog } from "@/components/add-category-dialog";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<any[]>([]);
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

        // Role check (admin only)
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

        // Fetch categories + product ids (we'll shape to match `products (count)` structure)
        const { data, error } = await supabase
          .from("categories")
          .select(
            `
            *,
            products ( id )
          `
          )
          .order("name", { ascending: true });

        if (error) throw error;

        // Shape to mimic `products (count)` so existing table logic remains unchanged
        const shaped = (data ?? []).map((c: any) => ({
          ...c,
          products: Array.isArray(c.products)
            ? [{ count: c.products.length }]
            : [{ count: 0 }],
        }));

        if (!cancelled) setCategories(shaped);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load categories.");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        <AddCategoryDialog />
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && !loading && <div className="text-sm text-red-600">Error: {err}</div>}

      {!loading && !err && <CategoriesTable categories={categories} />}
    </div>
  );
}

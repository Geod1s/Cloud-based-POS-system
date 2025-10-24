// app/dashboard/products/new/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/client";
import { ProductForm } from "@/components/product-form";

export default function NewProductPage() {
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

        // Fetch categories
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });
        if (error) throw error;

        if (!cancelled) setCategories(data ?? []);
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground">Create a new product in your inventory</p>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && !loading && <div className="text-sm text-red-600">Error: {err}</div>}

      {!loading && !err && <ProductForm categories={categories || []} />}
    </div>
  );
}

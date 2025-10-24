// app/dashboard/products/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/client";
import { ProductsTable } from "@/components/products-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = React.useState<any[]>([]);
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

        // Fetch products with categories
        const { data, error } = await supabase
          .from("products")
          .select(
            `
            *,
            categories (
              id,
              name
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!cancelled) setProducts(data ?? []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load products.");
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
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && !loading && <div className="text-sm text-red-600">Error: {err}</div>}

      {!loading && !err && <ProductsTable products={products} />}
    </div>
  );
}

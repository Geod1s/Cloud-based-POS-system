// app/dashboard/pos/page.tsx
"use client";

import * as React from "react";
import { createBrowserClient } from "@/lib/client";
import { POSInterface } from "@/components/pos-interface";

// ✅ added: local-first helpers
import { getLocalProducts, getLocalCustomers } from "@/lib/local-queries";
import { getLocalDb } from "@/lib/local-db";

export default function POSPage() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) Always try local first (works offline)
        const [localProd, localCust] = await Promise.all([
          getLocalProducts().catch(() => []),
          getLocalCustomers().catch(() => []),
        ]);

        // Map local shapes -> existing POSInterface props shape (categories: {id,name}|null)
        const mappedLocalProd = (localProd || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          stock_quantity: Number(p.stock_quantity),
          categories: p.category_id ? { id: p.category_id, name: p.category_name ?? "" } : null,
        }));

        const mappedLocalCust = (localCust || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
        }));

        if (!cancelled) {
          setProducts(mappedLocalProd);
          setCustomers(mappedLocalCust);
        }

        // If we already have local data (either list non-empty), we're good—no network needed.
        const hasSomeLocal =
          (mappedLocalProd && mappedLocalProd.length > 0) ||
          (mappedLocalCust && mappedLocalCust.length > 0);

        // 2) If local is empty AND we’re online, fall back to your existing Supabase fetch
        if (!hasSomeLocal && typeof navigator !== "undefined" && navigator.onLine) {
          const supabase = createBrowserClient();

          const [{ data: prod, error: pErr }, { data: cust, error: cErr }] = await Promise.all([
            supabase
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
              .order("name", { ascending: true }),
            supabase.from("customers").select("*").order("name", { ascending: true }),
          ]);

          if (pErr) throw pErr;
          if (cErr) throw cErr;

          if (!cancelled) {
            setProducts(prod ?? []);
            setCustomers(cust ?? []);
          }

          // 3) Best-effort cache remote into local so next run is offline-ready
          try {
            const db = await getLocalDb();
            if (prod && prod.length) {
              await db.execute("BEGIN");
              for (const p of prod) {
                await db.execute(
                  `INSERT INTO products
                   (id, name, description, price, stock_quantity, category_id, created_at, local_updated_at, remote_updated_at, is_deleted)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                   ON CONFLICT(id) DO UPDATE SET
                     name=excluded.name,
                     description=excluded.description,
                     price=excluded.price,
                     stock_quantity=excluded.stock_quantity,
                     category_id=excluded.category_id,
                     local_updated_at=excluded.local_updated_at,
                     remote_updated_at=excluded.remote_updated_at,
                     is_deleted=excluded.is_deleted`,
                  [
                    p.id,
                    p.name ?? "",
                    p.description ?? null,
                    Number(p.price ?? 0),
                    Number(p.stock_quantity ?? 0),
                    p.category_id ?? (p.categories?.id ?? null),
                    new Date().toISOString(),
                    new Date().toISOString(),
                    new Date().toISOString(),
                  ]
                );
              }
              await db.execute("COMMIT");
            }

            if (cust && cust.length) {
              await db.execute("BEGIN");
              for (const c of cust) {
                await db.execute(
                  `INSERT INTO customers
                   (id, name, phone, email, address, total_debt, created_at, local_updated_at, remote_updated_at, is_deleted)
                   VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 0)
                   ON CONFLICT(id) DO UPDATE SET
                     name=excluded.name,
                     phone=excluded.phone,
                     email=excluded.email,
                     address=excluded.address,
                     local_updated_at=excluded.local_updated_at,
                     remote_updated_at=excluded.remote_updated_at,
                     is_deleted=excluded.is_deleted`,
                  [
                    c.id,
                    c.name ?? "",
                    c.phone ?? "",
                    c.email ?? null,
                    c.address ?? null,
                    new Date().toISOString(),
                    new Date().toISOString(),
                    new Date().toISOString(),
                  ]
                );
              }
              await db.execute("COMMIT");
            }
          } catch {
            // Caching is best-effort; ignore failures.
          }
        }

        // 4) If offline AND no local data, keep your error surface
        if (!hasSomeLocal && !(typeof navigator !== "undefined" && navigator.onLine)) {
          if (!cancelled) setErr("Offline and no local cache available.");
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load POS data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <p className="text-muted-foreground">Process sales and manage transactions</p>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {/* Keep functional behavior: always render POSInterface with the arrays */}
      <POSInterface products={products} customers={customers} />
    </div>
  );
}

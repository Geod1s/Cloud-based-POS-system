// components/pos-loader.tsx
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/client";
import { getLocalProducts, getLocalCustomers } from "@/lib/local-queries";
import { getLocalDb } from "@/lib/local-db";
import { POSInterface } from "@/components/pos-interface";

// ✅ Use local-only types to avoid clashing with POSInterface's internal types
type LoaderProduct = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  // POSInterface expects an object or null, not an array
  categories: { id: string; name: string } | null;

  // extra fields you may have locally
  category_id?: string | null;
  description?: string | null;
};

type LoaderCustomer = {
  id: string;
  name: string;
  phone: string;
  // optional fields used locally
  email?: string | null;
  address?: string | null;
};

export default function PosLoader() {
  const [products, setProducts] = useState<LoaderProduct[] | null>(null);
  const [customers, setCustomers] = useState<LoaderCustomer[] | null>(null);

  // Local-first load
  useEffect(() => {
    (async () => {
      const localProducts = await getLocalProducts();
      const localCustomers = await getLocalCustomers();

      // map local product shape to the POSInterface-friendly shape
      const prod: LoaderProduct[] = (localProducts ?? []).map((p: any) => ({
        id: String(p.id),
        name: String(p.name),
        price: Number(p.price ?? 0),
        stock_quantity: Number(p.stock_quantity ?? 0),
        categories: p?.category_id
          ? { id: String(p.category_id), name: String(p.category_name ?? "") }
          : null,
        category_id: p?.category_id ?? null,
        description: p?.description ?? null,
      }));

      const cust: LoaderCustomer[] = (localCustomers ?? []).map((c: any) => ({
        id: String(c.id),
        name: String(c.name),
        phone: String(c.phone ?? ""),
        email: c?.email ?? null,
        address: c?.address ?? null,
      }));

      setProducts(prod);
      setCustomers(cust);

      // If local cache is empty and we are online, fetch remote and cache
      if (
        (prod.length === 0 || cust.length === 0) &&
        typeof navigator !== "undefined" &&
        navigator.onLine
      ) {
        try {
          const supabase = createBrowserClient();

          const { data: remoteProducts } = await supabase
            .from("products")
            .select("id,name,price,stock_quantity,category_id,categories(id,name),description")
            .eq("is_deleted", 0)
            .order("name");

          const { data: remoteCustomers } = await supabase
            .from("customers")
            .select("id,name,phone,email,address")
            .eq("is_deleted", 0)
            .order("name");

          // Update UI
          if (remoteProducts) {
            setProducts(
              remoteProducts.map((p: any): LoaderProduct => ({
                id: String(p.id),
                name: String(p.name),
                price: Number(p.price ?? 0),
                stock_quantity: Number(p.stock_quantity ?? 0),
                categories: p?.categories
                  ? { id: String(p.categories.id), name: String(p.categories.name) }
                  : null,
                category_id: p?.category_id ?? null,
                description: p?.description ?? null,
              }))
            );
          }
          if (remoteCustomers) {
            setCustomers(
              remoteCustomers.map((c: any): LoaderCustomer => ({
                id: String(c.id),
                name: String(c.name),
                phone: String(c.phone ?? ""),
                email: c?.email ?? null,
                address: c?.address ?? null,
              }))
            );
          }

          // Cache to local DB (best-effort)
          const db = await getLocalDb();
          if (remoteProducts && remoteProducts.length) {
            await db.execute("BEGIN");
            for (const p of remoteProducts) {
              await db.execute(
                `INSERT INTO products (
                   id, name, description, price, stock_quantity, category_id,
                   created_at, local_updated_at, remote_updated_at, is_deleted
                 )
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
                  p.category_id ?? null,
                  new Date().toISOString(),
                  new Date().toISOString(),
                  new Date().toISOString(),
                ]
              );
            }
            await db.execute("COMMIT");
          }

          if (remoteCustomers && remoteCustomers.length) {
            await db.execute("BEGIN");
            for (const c of remoteCustomers) {
              await db.execute(
                `INSERT INTO customers (
                   id, name, phone, email, address, total_debt,
                   created_at, local_updated_at, remote_updated_at, is_deleted
                 )
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
          // stay quiet offline/any error
          console.info("Remote fetch skipped or failed; staying with local data.");
        }
      }
    })();
  }, []);

  if (!products || !customers) {
    return <div className="p-6 text-sm text-muted-foreground">Loading POS data…</div>;
  }

  // ✅ Pass exactly what POSInterface expects
  return (
    <POSInterface
      products={(products ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock_quantity: p.stock_quantity,
        categories: p.categories, // object or null
      }))}
      customers={(customers ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
      }))}
    />
  );
}

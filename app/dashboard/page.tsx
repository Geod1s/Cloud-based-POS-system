// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, Receipt } from "lucide-react";

export default function DashboardPage() {
  const [productsCount, setProductsCount] = useState<number>(0);
  const [salesCount, setSalesCount] = useState<number>(0);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const supabase = createBrowserClient();

        // (Optional) If you want to guard here too; layout already does this.
        // const { data } = await supabase.auth.getUser();
        // if (!data.user) return;

        // Fetch counts in parallel
        const [
          { count: pCount, error: pErr },
          { count: sCount, error: sErr },
          { count: cCount, error: cErr },
          { data: debts, error: dErr },
        ] = await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("sales").select("*", { count: "exact", head: true }),
          supabase.from("customers").select("*", { count: "exact", head: true }),
          supabase.from("debts").select("remaining_amount").eq("status", "pending"),
        ]);

        if (pErr || sErr || cErr || dErr) {
          throw pErr || sErr || cErr || dErr;
        }

        if (!cancelled) {
          setProductsCount(pCount ?? 0);
          setSalesCount(sCount ?? 0);
          setCustomersCount(cCount ?? 0);

          const debtSum =
            (debts ?? []).reduce(
              (sum: number, d: any) => sum + Number(d?.remaining_amount ?? 0),
              0,
            ) || 0;
          setTotalDebt(debtSum);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load dashboard stats.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        title: "Total Products",
        value: productsCount,
        icon: Package,
        description: "Products in inventory",
      },
      {
        title: "Total Sales",
        value: salesCount,
        icon: ShoppingCart,
        description: "Completed transactions",
      },
      {
        title: "Total Customers",
        value: customersCount,
        icon: Users,
        description: "Registered customers",
      },
      {
        title: "Outstanding Debts",
        value: `$${totalDebt.toFixed(2)}`,
        icon: Receipt,
        description: "Pending payments",
      },
    ],
    [productsCount, salesCount, customersCount, totalDebt],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your Cloud POS System</p>
      </div>

      {err && (
        <p className="text-sm text-red-600">
          {err}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "…" : stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

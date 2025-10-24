// app/dashboard/debts/page.tsx
"use client";

import * as React from "react";
import { createBrowserClient } from "@/lib/client";
import { DebtsTable } from "@/components/debts-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DebtsPage() {
  const [debts, setDebts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const supabase = createBrowserClient();

        // Fetch all debts with customer and sale information
        const { data, error } = await supabase
          .from("debts")
          .select(
            `
            *,
            customers (
              id,
              name,
              phone
            ),
            sales (
              id,
              sale_number
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!cancelled) setDebts(data ?? []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load debts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingDebts = React.useMemo(
    () => (debts ?? []).filter((d: any) => d.status === "pending"),
    [debts]
  );
  const partialDebts = React.useMemo(
    () => (debts ?? []).filter((d: any) => d.status === "partial"),
    [debts]
  );
  const paidDebts = React.useMemo(
    () => (debts ?? []).filter((d: any) => d.status === "paid"),
    [debts]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debts Management</h1>
        <p className="text-muted-foreground">Track and manage customer debts</p>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && !loading && <div className="text-sm text-red-600">Error: {err}</div>}

      {!loading && !err && (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingDebts.length})</TabsTrigger>
            <TabsTrigger value="partial">Partial ({partialDebts.length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({paidDebts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <DebtsTable debts={pendingDebts} />
          </TabsContent>

          <TabsContent value="partial">
            <DebtsTable debts={partialDebts} />
          </TabsContent>

          <TabsContent value="paid">
            <DebtsTable debts={paidDebts} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

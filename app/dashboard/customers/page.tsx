// app/dashboard/customers/page.tsx
"use client";

import * as React from "react";
import { createBrowserClient } from "@/lib/client";
import { CustomersTable } from "@/components/customers-table";
import { AddCustomerDialog } from "@/components/add-customer-dialog";

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        if (!cancelled) setCustomers(data ?? []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load customers.");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage customer information</p>
        </div>
        <AddCustomerDialog />
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {err && !loading && <div className="text-sm text-red-600">Error: {err}</div>}

      {!loading && !err && <CustomersTable customers={customers} />}
    </div>
  );
}

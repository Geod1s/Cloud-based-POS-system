"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

// Minimal client-side controls (print/download)
export default function SalesClient() {
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleDownload = () => {
    if (typeof document === "undefined") return;
    const html = document.getElementById("receipt-root")?.innerHTML ?? "No receipt.";
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipt.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      <Button onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
}

// Keep prop names/types loose so it won’t break your current server query
type Sale = any;
type SaleItem = any;

export function ReceiptWrapper({
  sale,
  saleItems,
}: {
  sale: Sale;
  saleItems: SaleItem[];
}) {
  return (
    <div id="receipt-root" className="rounded-md border bg-card p-6">
      <h2 className="mb-2 text-lg font-semibold">Receipt</h2>

      <div className="space-y-1 text-sm">
        <div>
          <span className="font-medium">Sale ID:</span> {sale?.id ?? "-"}
        </div>
        {sale?.customers?.name && (
          <div>
            <span className="font-medium">Customer:</span> {sale.customers.name}
          </div>
        )}

        <div className="mt-4 font-medium">Items</div>
        <ul className="list-disc pl-5">
          {(saleItems ?? []).map((it: any, i: number) => (
            <li key={i}>
              {it.product_id ?? "product"} × {it.quantity ?? 0} @{" "}
              {it.unit_price ?? 0} = {it.subtotal ?? 0}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

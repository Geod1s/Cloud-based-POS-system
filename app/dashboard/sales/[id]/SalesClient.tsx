"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Receipt } from "@/components/receipt";

export default function SalesClient() {
  return (
    <Button onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      Print Receipt
    </Button>
  );
}

export function ReceiptWrapper({
  sale,
  saleItems,
}: {
  sale: any;
  saleItems: any[];
}) {
  return <Receipt sale={sale} saleItems={saleItems} />;
}

// Server Component (no "use client")
import { createClient } from "@/lib/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SalesClient, { ReceiptWrapper } from "./SalesClient"; // client child

export default async function SalePage({ params }: { params: { id: string } }) {
  const { id } = params;

  const supabase = await createClient();

  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .select(`
      *,
      customers (
        id,
        name,
        phone,
        email,
        address
      ),
      profiles:user_id (
        full_name,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (saleErr || !sale) notFound();

  const { data: saleItems } = await supabase
    .from("sale_items")
    .select("*")
    .eq("sale_id", id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/dashboard/pos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to POS
          </Link>
        </Button>
        <SalesClient />
      </div>

      <ReceiptWrapper sale={sale} saleItems={saleItems ?? []} />
    </div>
  );
}

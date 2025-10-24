import { createClient } from "@/lib/server"
import { POSInterface } from "@/components/pos-interface"

export default async function POSPage() {
  const supabase = await createClient()

  // Fetch all products
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (
        id,
        name
      )
    `,
    )
    .order("name")

  // Fetch all customers
  const { data: customers } = await supabase.from("customers").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <p className="text-muted-foreground">Process sales and manage transactions</p>
      </div>

      <POSInterface products={products || []} customers={customers || []} />
    </div>
  )
}

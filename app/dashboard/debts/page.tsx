import { createClient } from "@/lib/server"
import { DebtsTable } from "@/components/debts-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function DebtsPage() {
  const supabase = await createClient()

  // Fetch all debts with customer and sale information
  const { data: debts } = await supabase
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
    `,
    )
    .order("created_at", { ascending: false })

  const pendingDebts = debts?.filter((debt) => debt.status === "pending") || []
  const partialDebts = debts?.filter((debt) => debt.status === "partial") || []
  const paidDebts = debts?.filter((debt) => debt.status === "paid") || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debts Management</h1>
        <p className="text-muted-foreground">Track and manage customer debts</p>
      </div>

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
    </div>
  )
}

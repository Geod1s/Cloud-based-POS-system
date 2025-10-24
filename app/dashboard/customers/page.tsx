import { createClient } from "@/lib/server"
import { CustomersTable } from "@/components/customers-table"
import { AddCustomerDialog } from "@/components/add-customer-dialog"

export default async function CustomersPage() {
  const supabase = await createClient()

  // Fetch customers
  const { data: customers } = await supabase.from("customers").select("*").order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage customer information</p>
        </div>
        <AddCustomerDialog />
      </div>

      <CustomersTable customers={customers || []} />
    </div>
  )
}

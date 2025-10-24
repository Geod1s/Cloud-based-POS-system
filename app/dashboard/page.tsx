import { createClient } from "@/lib/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, Receipt } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get statistics
  const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true })

  const { count: salesCount } = await supabase.from("sales").select("*", { count: "exact", head: true })

  const { count: customersCount } = await supabase.from("customers").select("*", { count: "exact", head: true })

  const { data: debtsData } = await supabase.from("debts").select("remaining_amount").eq("status", "pending")

  const totalDebt = debtsData?.reduce((sum, debt) => sum + Number(debt.remaining_amount), 0) || 0

  const stats = [
    {
      title: "Total Products",
      value: productsCount || 0,
      icon: Package,
      description: "Products in inventory",
    },
    {
      title: "Total Sales",
      value: salesCount || 0,
      icon: ShoppingCart,
      description: "Completed transactions",
    },
    {
      title: "Total Customers",
      value: customersCount || 0,
      icon: Users,
      description: "Registered customers",
    },
    {
      title: "Outstanding Debts",
      value: `$${totalDebt.toFixed(2)}`,
      icon: Receipt,
      description: "Pending payments",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your Cloud POS System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

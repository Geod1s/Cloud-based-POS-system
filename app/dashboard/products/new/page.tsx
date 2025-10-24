import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/product-form"

export default async function NewProductPage() {
  const supabase = await createClient()

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground">Create a new product in your inventory</p>
      </div>

      <ProductForm categories={categories || []} />
    </div>
  )
}

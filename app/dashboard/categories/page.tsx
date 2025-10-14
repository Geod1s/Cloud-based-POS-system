import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { CategoriesTable } from "@/components/categories-table"
import { AddCategoryDialog } from "@/components/add-category-dialog"

export default async function CategoriesPage() {
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

  // Fetch categories with product count
  const { data: categories } = await supabase
    .from("categories")
    .select(`
      *,
      products (count)
    `)
    .order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        <AddCategoryDialog />
      </div>

      <CategoriesTable categories={categories || []} />
    </div>
  )
}

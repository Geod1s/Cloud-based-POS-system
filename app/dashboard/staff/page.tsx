import { createServerClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { StaffTable } from "@/components/staff-table"

export default async function StaffPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all staff users with their tags
  const { data: staff } = await supabase
    .from("profiles")
    .select(`
      *,
      user_tags (
        permission_tags (
          id,
          name
        )
      )
    `)
    .order("created_at", { ascending: false })

  // Fetch all available tags
  const { data: tags } = await supabase.from("permission_tags").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
          Staff Management
        </h1>
        <p className="text-muted-foreground mt-2">Manage staff users, assign permission tags, and control access</p>
      </div>

      <StaffTable staff={staff || []} tags={tags || []} />
    </div>
  )
}

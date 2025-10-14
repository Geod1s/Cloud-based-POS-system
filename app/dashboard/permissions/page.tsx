import { createServerClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { PermissionsTable } from "@/components/permissions-table"

export default async function PermissionsPage() {
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

  // Fetch all permission tags
  const { data: tags } = await supabase.from("permission_tags").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
          Permission Tags
        </h1>
        <p className="text-muted-foreground mt-2">
          Create and manage permission tags to control access to system features
        </p>
      </div>

      <PermissionsTable tags={tags || []} />
    </div>
  )
}

import type React from "react"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { SyncButton } from "@/components/sync-button"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="flex min-h-screen">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1" />
          <SyncButton />
        </div>
        {children}
      </main>
    </div>
  )
}

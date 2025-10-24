"use client"

import { createBrowserClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Receipt,
  FolderTree,
  LogOut,
  Menu,
  X,
  UserCog,
  Shield,
} from "lucide-react"
import { useState } from "react"
import type { User } from "@supabase/supabase-js"

interface DashboardNavProps {
  user: User
  profile: {
    role: string
    full_name: string | null
  } | null
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/pos", label: "Point of Sale", icon: ShoppingCart },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/categories", label: "Categories", icon: FolderTree },
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    { href: "/dashboard/debts", label: "Debts", icon: Receipt },
  ]

  const adminNavItems = [
    { href: "/dashboard/staff", label: "Staff Management", icon: UserCog },
    { href: "/dashboard/permissions", label: "Permission Tags", icon: Shield },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b bg-gradient-to-br from-blue-600/10 to-teal-600/10 p-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Cloud POS
            </h2>
            <p className="text-sm text-muted-foreground mt-2">{profile?.full_name || user.email}</p>
            <p className="text-xs text-muted-foreground capitalize mt-1 inline-flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", profile?.role === "admin" ? "bg-blue-600" : "bg-teal-600")} />
              {profile?.role || "user"}
            </p>
          </div>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    // removed 'nav-item-swing', limit to color transitions only
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}

            {profile?.role === "admin" && (
              <>
                <div className="pt-4 pb-2">
                  <div className="border-t" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 px-4">
                    Administration
                  </p>
                </div>
                {adminNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        // removed 'nav-item-swing' here as well
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg shadow-blue-600/20"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                      )}
                >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { createBrowserClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Tag {
  id: string
  name: string
  description: string | null
  permissions: string[]
}

interface EditPermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag: Tag
}

const AVAILABLE_PERMISSIONS = [
  "login",
  "process_sales",
  "search_products",
  "apply_discounts",
  "view_customers",
  "add_customers",
  "end_of_day_reconciliation",
  "adjust_stock",
  "receive_stock",
  "view_suppliers",
  "run_inventory_reports",
  "view_products",
  "add_products",
  "edit_products",
  "delete_products",
  "view_reports",
  "manage_users",
]

export function EditPermissionDialog({ open, onOpenChange, tag }: EditPermissionDialogProps) {
  const [name, setName] = useState(tag.name)
  const [description, setDescription] = useState(tag.description || "")
  const [permissions, setPermissions] = useState<string[]>(tag.permissions)
  const [customPermission, setCustomPermission] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    setName(tag.name)
    setDescription(tag.description || "")
    setPermissions(tag.permissions)
  }, [tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("permission_tags")
        .update({
          name,
          description,
          permissions,
        })
        .eq("id", tag.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Permission tag updated successfully",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permission tag",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePermission = (perm: string) => {
    setPermissions((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]))
  }

  const addCustomPermission = () => {
    if (customPermission && !permissions.includes(customPermission)) {
      setPermissions([...permissions, customPermission])
      setCustomPermission("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Permission Tag</DialogTitle>
          <DialogDescription>Update the permission tag and its access rights</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tag Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cashier, Manager"
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this tag allows users to do"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <Badge
                      key={perm}
                      variant={permissions.includes(perm) ? "default" : "outline"}
                      className={
                        permissions.includes(perm)
                          ? "bg-gradient-to-r from-blue-600 to-teal-600 cursor-pointer"
                          : "cursor-pointer"
                      }
                      onClick={() => togglePermission(perm)}
                    >
                      {perm}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customPermission}
                    onChange={(e) => setCustomPermission(e.target.value)}
                    placeholder="Add custom permission"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCustomPermission()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addCustomPermission}>
                    Add
                  </Button>
                </div>
                {permissions.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Selected Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map((perm) => (
                        <Badge key={perm} className="bg-gradient-to-r from-blue-600 to-teal-600">
                          {perm}
                          <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => togglePermission(perm)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || permissions.length === 0}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Tag
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Edit, Power, PowerOff } from "lucide-react"
import { AddStaffDialog } from "@/components/add-staff-dialog"
import { EditStaffDialog } from "@/components/edit-staff-dialog"
import { createBrowserClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Staff {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
  user_tags: Array<{
    permission_tags: {
      id: string
      name: string
    }
  }>
}

interface Tag {
  id: string
  name: string
  description: string | null
  permissions: string[]
}

interface StaffTableProps {
  staff: Staff[]
  tags: Tag[]
}

export function StaffTable({ staff, tags }: StaffTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const toggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: !currentStatus }).eq("id", staffId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: `Staff ${!currentStatus ? "activated" : "deactivated"} successfully`,
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff User
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permission Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.full_name || "N/A"}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={member.role === "admin" ? "default" : "secondary"}
                    className={member.role === "admin" ? "bg-gradient-to-r from-blue-600 to-teal-600" : ""}
                  >
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {member.user_tags?.map((ut) => (
                      <Badge key={ut.permission_tags.id} variant="outline">
                        {ut.permission_tags.name}
                      </Badge>
                    ))}
                    {(!member.user_tags || member.user_tags.length === 0) && (
                      <span className="text-sm text-muted-foreground">No tags</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={member.is_active ? "default" : "secondary"}
                    className={member.is_active ? "bg-green-600 hover:bg-green-700" : "bg-gray-500"}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingStaff(member)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleStaffStatus(member.id, member.is_active)}>
                      {member.is_active ? (
                        <PowerOff className="h-4 w-4 text-red-600" />
                      ) : (
                        <Power className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddStaffDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} tags={tags} />

      {editingStaff && (
        <EditStaffDialog
          open={!!editingStaff}
          onOpenChange={(open) => !open && setEditingStaff(null)}
          staff={editingStaff}
          tags={tags}
        />
      )}
    </div>
  )
}

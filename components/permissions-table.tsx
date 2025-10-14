"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
import { AddPermissionDialog } from "@/components/add-permission-dialog"
import { EditPermissionDialog } from "@/components/edit-permission-dialog"
import { createBrowserClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Tag {
  id: string
  name: string
  description: string | null
  permissions: string[]
}

interface PermissionsTableProps {
  tags: Tag[]
}

export function PermissionsTable({ tags }: PermissionsTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const handleDelete = async () => {
    if (!deletingTag) return

    const { error } = await supabase.from("permission_tags").delete().eq("id", deletingTag.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete permission tag",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: "Permission tag deleted successfully",
    })
    setDeletingTag(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Permission Tag
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell>{tag.description || "N/A"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {tag.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingTag(tag)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingTag(tag)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddPermissionDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      {editingTag && (
        <EditPermissionDialog
          open={!!editingTag}
          onOpenChange={(open) => !open && setEditingTag(null)}
          tag={editingTag}
        />
      )}

      <AlertDialog open={!!deletingTag} onOpenChange={(open) => !open && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permission Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{deletingTag?.name}" permission tag? This will remove it from all
              users who have it assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

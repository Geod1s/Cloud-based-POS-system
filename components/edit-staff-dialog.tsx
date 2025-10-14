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
import { Checkbox } from "@/components/ui/checkbox"
import { createBrowserClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Staff {
  id: string
  email: string
  full_name: string | null
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
}

interface EditStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: Staff
  tags: Tag[]
}

export function EditStaffDialog({ open, onOpenChange, staff, tags }: EditStaffDialogProps) {
  const [fullName, setFullName] = useState(staff.full_name || "")
  const [newPassword, setNewPassword] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    setFullName(staff.full_name || "")
    setSelectedTags(staff.user_tags?.map((ut) => ut.permission_tags.id) || [])
  }, [staff])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Update profile
      const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", staff.id)

      if (profileError) throw profileError

      // Update password if provided
      if (newPassword) {
        // Note: Password reset requires admin privileges or special setup
        // This is a simplified version
        toast({
          title: "Note",
          description: "Password reset requires additional setup",
          variant: "default",
        })
      }

      // Update tags - remove old ones and add new ones
      const { error: deleteError } = await supabase.from("user_tags").delete().eq("user_id", staff.id)

      if (deleteError) throw deleteError

      if (selectedTags.length > 0) {
        const userTags = selectedTags.map((tagId) => ({
          user_id: staff.id,
          tag_id: tagId,
        }))

        const { error: insertError } = await supabase.from("user_tags").insert(userTags)

        if (insertError) throw insertError
      }

      toast({
        title: "Success",
        description: "Staff user updated successfully",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Staff User</DialogTitle>
          <DialogDescription>Update staff details and permission tags</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={staff.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password (optional)</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Permission Tags</Label>
              <div className="space-y-2 border rounded-lg p-4">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={tag.id}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={tag.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {tag.name}
                      </label>
                      {tag.description && <p className="text-sm text-muted-foreground">{tag.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Staff User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

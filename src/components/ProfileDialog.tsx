"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"
import { useProfile } from "@/context/profile-context"

interface ProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
  const { profile, updateProfile } = useProfile()
  const [formData, setFormData] = React.useState(profile)
  const [isLoading, setIsLoading] = React.useState(false)

  // Sync internal form data when profile changes or dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData(profile)
    }
  }, [isOpen, profile])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      updateProfile(formData)
      setIsLoading(false)
      onClose()
    }, 800)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={formData.avatar} alt={formData.name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {formData.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <button 
                type="button"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all opacity-0 group-hover:opacity-100"
              >
                <Camera size={14} />
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-muted/30 border-none px-4 py-2 h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-muted/30 border-none px-4 py-2 h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Current Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="bg-muted/30 border-none px-4 py-2 h-11"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? "Saving changes..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

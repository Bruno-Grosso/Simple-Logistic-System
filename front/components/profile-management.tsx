"use client"

import { useEffect, useState } from "react"
import {
  Shield,
  UserCheck,
  MapPin,
  Mail,
  Key,
  Clock,
  Edit,
  Save,
  CheckCircle2,
  RefreshCw,
  UserIcon,
  Briefcase,
  Layers,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import type { User } from "@/types"

interface ProfileManagementProps {
  initialUser: User
  initialOnlineSession?: any
  allMockUsers: User[]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function ProfileManagement({
  initialUser,
  initialOnlineSession,
  allMockUsers,
}: ProfileManagementProps) {
  const [currentUser, setCurrentUser] = useState<User>(initialUser)
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUser.id)
  const [sessions, setSessions] = useState<any[]>(
    initialOnlineSession ? [initialOnlineSession] : [],
  )
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Edit dialog state
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editName, setEditName] = useState(currentUser.name)
  const [editAddress, setEditAddress] = useState(currentUser.address || "")
  const [editPassword, setEditPassword] = useState("")

  // Sync state when user changes
  useEffect(() => {
    setEditName(currentUser.name)
    setEditAddress(currentUser.address || "")
    setEditPassword("")
  }, [currentUser])

  // Switch user profile view
  async function handleUserSwitch(userId: string) {
    setSelectedUserId(userId)
    setIsRefreshing(true)
    try {
      const u = await api.users.getById(userId)
      if (u) {
        setCurrentUser(u)
      }
      const s = await api.users.getOnlineSessions(userId)
      setSessions(s)
      toast.info(`Switched profile view to ${u?.name || userId}`)
    } catch {
      toast.error("Failed to load user profile from backend")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Refresh profile details from backend
  async function reloadProfile() {
    setIsRefreshing(true)
    try {
      const u = await api.users.getById(selectedUserId)
      if (u) {
        setCurrentUser(u)
      }
      const s = await api.users.getOnlineSessions(selectedUserId)
      setSessions(s)
      toast.success("Profile reloaded from PostgreSQL backend")
    } catch {
      toast.error("Failed to sync profile from backend")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Save updated profile to backend database
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) {
      toast.error("Full name cannot be empty")
      return
    }

    setIsSaving(true)
    try {
      const res = await api.users.update(currentUser.id, {
        name: editName.trim(),
        address: editAddress.trim(),
        password: editPassword || undefined,
      })

      if (res.success && res.user) {
        setCurrentUser(res.user)
        setIsOpen(false)
        toast.success(`Profile updated successfully for ${res.user.name}!`, {
          description: "Changes persisted directly to PostgreSQL users table.",
        })
      } else {
        toast.error("Backend error updating profile record")
      }
    } catch {
      toast.error("Failed to save profile changes")
    } finally {
      setIsSaving(false)
    }
  }

  const roleLabel = currentUser.rawRole || currentUser.role

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <PageHeader crumbs={[{ label: "User Profile" }]} />
        <div className="flex items-center gap-2">
          {/* User selector */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
            <UserIcon className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Select Profile:</span>
            <select
              value={selectedUserId}
              onChange={(e) => handleUserSwitch(e.target.value)}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
            >
              {allMockUsers.map((u, index) => (
                <option key={`${u.id}-${u.email ?? "user"}-${index}`} value={u.id} className="bg-card text-foreground">
                  {u.id} - {u.name} ({u.rawRole || u.role})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={reloadProfile}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Avatar & Quick Info */}
        <div className="flex flex-col gap-6 md:col-span-1">
          <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-xs">
            <Avatar className="size-24 border-2 border-primary/20 ring-4 ring-primary/5">
              <AvatarFallback className="bg-primary/10 text-2xl font-bold font-mono text-primary">
                {initials(currentUser.name)}
              </AvatarFallback>
            </Avatar>

            <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
              {currentUser.name}
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{currentUser.id}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="capitalize text-xs px-2.5 py-0.5">
                <Shield className="mr-1 size-3 text-primary" />
                {roleLabel.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5">
                <CheckCircle2 className="mr-1 size-3" />
                Verified User
              </Badge>
            </div>

            <div className="mt-6 w-full divide-y divide-border rounded-lg border border-border bg-muted/30 text-left text-xs">
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-muted-foreground">System ID</span>
                <span className="font-mono font-medium text-foreground">{currentUser.id}</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-muted-foreground">Access Level</span>
                <span className="capitalize font-medium text-foreground">{currentUser.role}</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-muted-foreground">Position</span>
                <span className="capitalize font-medium text-foreground">
                  {currentUser.work_position || roleLabel.replace("_", " ")}
                </span>
              </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger render={<Button className="mt-6 w-full gap-2" variant="default" size="sm" />}>
                <Edit className="size-3.5" />
                Edit Profile Information
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSaveProfile}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserCheck className="size-5 text-primary" />
                      Edit User Profile ({currentUser.id})
                    </DialogTitle>
                    <DialogDescription>
                      Update account details. Changes will be saved to the PostgreSQL database.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-medium text-foreground">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Alice Admin"
                        required
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className="text-xs font-medium text-foreground">Physical Address</label>
                      <textarea
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="min-h-[70px] rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Rua do Imperador, Centro, Petrópolis - RJ"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className="text-xs font-medium text-foreground">
                        New Password (optional)
                      </label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Leave empty to keep current password"
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving} className="gap-1.5">
                      <Save className="size-3.5" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Right Column: Detailed Cards */}
        <div className="flex flex-col gap-6 md:col-span-2">
          {/* Main Account Info */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              Account Details & Backend Attributes
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border/80 bg-background/50 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <Mail className="size-3.5 text-primary" />
                  Primary Email / Login ID
                </div>
                <p className="font-mono text-sm font-medium text-foreground">
                  {currentUser.email || `${currentUser.name.split(" ")[0].toLowerCase()}@logisys.com`}
                </p>
              </div>

              <div className="rounded-lg border border-border/80 bg-background/50 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <Briefcase className="size-3.5 text-primary" />
                  System Role / Category
                </div>
                <p className="capitalize text-sm font-medium text-foreground">
                  {roleLabel.replace("_", " ")}
                </p>
              </div>

              <div className="rounded-lg border border-border/80 bg-background/50 p-3.5 sm:col-span-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <MapPin className="size-3.5 text-primary" />
                  Registered Physical Address
                </div>
                <p className="text-sm text-foreground font-medium">
                  {currentUser.address || "No physical address registered."}
                </p>
              </div>
            </div>
          </div>

          {/* Active Backend Sessions Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Active Backend Sessions (online_users)
            </h3>

            {sessions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No active online sessions found in database for user ID {currentUser.id}.
              </div>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border bg-background/50">
                {sessions.map((sess, index) => (
                  <div
                    key={`${sess.session_id ?? selectedUserId}-${sess.login_time ?? "session"}-${index}`}
                    className="flex items-center justify-between p-3.5 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Key className="size-3.5 text-primary" />
                        <span className="font-mono font-medium text-foreground">{sess.session_id}</span>
                        <Badge variant="secondary" className="text-[10px] py-0">
                          Active Session
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Login: <span className="font-mono text-foreground">{sess.login_time}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Last activity</p>
                      <p className="font-mono text-foreground">{sess.last_activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

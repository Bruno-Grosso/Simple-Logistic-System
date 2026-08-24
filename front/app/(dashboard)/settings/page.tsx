import Link from "next/link"
import { Shield, Truck, UserCheck, ExternalLink } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { SignOutButton } from "@/components/sign-out"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getCurrentUserProfile } from "@/lib/auth/get-user"

export const dynamic = "force-dynamic"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
        {children}
      </div>
    </section>
  )
}

export default async function SettingsPage() {
  const { user, onlineSession } = await getCurrentUserProfile()

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center p-6">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <PageHeader crumbs={[{ label: "Settings" }]} />

        {/* Account Profile Integration */}
        <Section title="Account Profile">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback className="bg-primary/10 font-mono text-sm font-semibold text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{user.name}</p>
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    <Shield className="mr-1 size-2.5" />
                    {(user.rawRole || user.role).replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {user.email || `${user.id.toLowerCase()}@logisys.com`}
                </p>
                {user.address && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-xs">
                    {user.address}
                  </p>
                )}
              </div>
            </div>

            <Button nativeButton={false} variant="outline" size="sm" render={<Link href="/profile" />} className="gap-1.5 shrink-0">
              <UserCheck className="size-3.5" />
              Manage Profile
              <ExternalLink className="size-3" />
            </Button>
          </div>
        </Section>

        {/* System & Session Information */}
        <Section title="Active Session">
          <SettingRow
            label="Session Token"
            description={onlineSession?.session_id || "Active cookie session verified"}
          >
            <Badge variant="outline" className="font-mono text-[10px]">
              {onlineSession?.session_id ? "Online DB Logged" : "Active Cookie"}
            </Badge>
          </SettingRow>
          <SettingRow
            label="User ID"
            description="PostgreSQL Primary Key"
          >
            <span className="font-mono text-xs font-semibold text-foreground">
              {user.id}
            </span>
          </SettingRow>
        </Section>

        {/* About */}
        <Section title="About">
          <SettingRow label="Application">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Truck className="size-3.5" />
              LogiSys Platform
            </div>
          </SettingRow>
          <SettingRow label="Backend API Status">
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Connected (http://localhost:8080)
            </span>
          </SettingRow>
          <SettingRow label="Environment">
            <Badge variant="outline" className="font-mono text-[10px]">
              development
            </Badge>
          </SettingRow>
        </Section>

        {/* Session */}
        <section>
          <h2 className="mb-1 font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Session Management
          </h2>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4">
            <div className="flex items-center justify-between gap-6 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Sign out</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  You will be returned to the login screen
                </p>
              </div>
              <SignOutButton variant="destructive" size="sm" />
            </div>
          </div>
        </section>

        <Separator />
        <p className="pb-2 text-center text-xs text-muted-foreground">
          LogiSys — Simple Logistics Platform (PostgreSQL Backend Integrated)
        </p>
      </div>
    </div>
  )
}

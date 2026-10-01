import { redirect } from "next/navigation"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getCurrentUserProfile } from "@/lib/auth/get-user"
import { getSession } from "@/lib/auth/get-session"

import { TimedLogoutWatcher } from "@/components/timed-logout-watcher"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.sub) redirect("/login")

  let user
  try {
    ({ user } = await getCurrentUserProfile())
  } catch {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:p-3 focus:bg-card focus:text-foreground focus:ring-2 focus:ring-primary focus:rounded-md focus:shadow-lg text-sm font-medium"
      >
        Skip to main content
      </a>
      <TimedLogoutWatcher />
      <AppSidebar user={user} />
      <SidebarInset id="main-content" tabIndex={-1}>{children}</SidebarInset>
    </SidebarProvider>
  )
}

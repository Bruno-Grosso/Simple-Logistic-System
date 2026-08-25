import { redirect } from "next/navigation"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getCurrentUserProfile } from "@/lib/auth/get-user"
import { getSession } from "@/lib/auth/get-session"

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
      <AppSidebar user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

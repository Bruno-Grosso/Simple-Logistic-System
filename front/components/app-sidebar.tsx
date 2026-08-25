"use client"

import type { ComponentProps } from "react"
import {
  LayoutDashboard,
  Package,
  Truck,
  Warehouse,
  Box,
  Boxes,
  Users,
  Factory,
  BarChart3,
  UserCircle,
} from "lucide-react"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import type { User } from "@/types"

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/orders", icon: Package },
  { title: "Fleet", url: "/fleet", icon: Truck },
  { title: "Deposits", url: "/deposits", icon: Warehouse },
  { title: "Products", url: "/products", icon: Box },
  { title: "Stock", url: "/stock", icon: Boxes },
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Suppliers", url: "/suppliers", icon: Factory },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: UserCircle },
]

const roleNavItems: Record<string, string[]> = {
  admin: navItems.map((item) => item.url),
  truck_driver: ["/dashboard", "/orders", "/fleet", "/profile"],
  warehouse_worker: ["/dashboard", "/orders", "/deposits", "/stock", "/profile"],
  client: ["/dashboard", "/orders", "/profile"],
}

export function AppSidebar({ user, ...props }: ComponentProps<typeof Sidebar> & { user: User }) {
  const currentUser = {
    name: user.name,
    role: user.rawRole || user.role,
    email: user.email,
  }
  const visibleNavItems = navItems.filter((item) =>
    (roleNavItems[user.rawRole || user.role] || roleNavItems.client).includes(item.url),
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Truck className="size-4 text-primary-foreground" />
          </div>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-semibold tracking-wide">LogiSys</span>
            <span className="text-[11px] text-muted-foreground">Logistics Platform</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        <NavMain items={visibleNavItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

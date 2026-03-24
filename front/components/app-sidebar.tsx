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
]

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
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
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={{ name: "Rafael Mendes", role: "admin" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

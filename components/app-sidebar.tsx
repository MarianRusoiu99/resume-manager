"use client"

import * as React from "react"
import { Sidebar, SidebarRail } from "@/components/ui/sidebar"
import { SidebarHeaderComponent } from "./layout/sidebar/SidebarHeader"
import { SidebarNav } from "./layout/sidebar/SidebarNav"
import { SidebarUser } from "./layout/sidebar/SidebarUser"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null
    email?: string | null
  }
}

export function AppSidebar({ user, ...props }: Readonly<AppSidebarProps>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeaderComponent />
      <SidebarNav />
      <SidebarUser user={user} />
      <SidebarRail />
    </Sidebar>
  )
}

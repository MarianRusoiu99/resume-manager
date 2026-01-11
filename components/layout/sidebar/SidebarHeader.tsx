"use client"

import * as React from "react"
import Link from "next/link"
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { NotificationDropdown } from "@/components/notifications"

export function SidebarHeaderComponent() {
  return (
    <SidebarHeader className="p-4" >
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center justify-between w-full">
              <SidebarMenuButton size="lg" asChild>
               <Link href="/dashboard">
                 <div className="flex flex-col gap-0.5 leading-none">
                   <span className="font-semibold">Resume Optimizer</span>
                   <span className="text-xs text-muted-foreground">
                     AI-Powered Career Tools
                   </span>
                 </div>
               </Link>
             </SidebarMenuButton>
            <NotificationDropdown />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}

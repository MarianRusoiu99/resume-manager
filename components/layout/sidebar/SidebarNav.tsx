"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NAV_CONFIG } from "@/lib/constants/nav-config"

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <SidebarContent className="p-4 pt-0">
      <TooltipProvider delayDuration={0}>
        <SidebarMenu className="space-y-1">
          {NAV_CONFIG.filter(item => item.isNav !== false).map((item) => {
            const isActive =
              pathname === item.url || (item.url !== '/' && pathname.startsWith(`${item.url}/`))
            return (
              <SidebarMenuItem className="mt-1" key={item.title}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-6">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </TooltipProvider>
    </SidebarContent>
  )
}

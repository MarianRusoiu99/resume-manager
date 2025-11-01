"use client";

import { FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNav } from "./SidebarNav";
import { UserAccountDropdown } from "./UserAccountDropdown";

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-2">
          <FileText className="h-6 w-6" />
          <span className="font-semibold text-lg">Resume Optimizer</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
      <SidebarFooter className="border-t">
        <UserAccountDropdown user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/**
 * Sidebar Component Library
 * Modular sidebar components split from the original monolithic sidebar.tsx
 */

export { SidebarProvider } from "./SidebarProvider"
export { 
  Sidebar, 
  SidebarTrigger, 
  SidebarRail, 
  SidebarInset, 
  SidebarInput,
  SidebarSeparator 
} from "./Sidebar"
export { SidebarHeader } from "./SidebarHeader"
export { SidebarFooter } from "./SidebarFooter"
export { SidebarContent } from "./SidebarContent"
export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "./SidebarGroup"
export { SidebarMenu, SidebarMenuSub } from "./SidebarMenu"
export {
  SidebarMenuItem,
  SidebarMenuSubItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSubButton,
} from "./SidebarMenuItem"

// Export hooks
export { useSidebar } from "./hooks/use-sidebar"

// Export types
export type {
  SidebarProviderProps,
  SidebarProps,
  SidebarMenuButtonProps,
  SidebarMenuActionProps,
  SidebarMenuSkeletonProps,
  SidebarMenuSubButtonProps,
  SidebarGroupActionProps,
  SidebarGroupLabelProps,
} from "./types"

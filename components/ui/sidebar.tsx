/**
 * Sidebar Component Library
 * 
 * This file re-exports from the modular sidebar structure.
 * The actual implementation has been split into separate files for better maintainability.
 * 
 * @see components/ui/sidebar/* for individual component files
 */

export {
  // Provider
  SidebarProvider,
  
  // Core Components
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarInput,
  SidebarSeparator,
  
  // Layout Components
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  
  // Group Components
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  
  // Menu Components
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuItem,
  SidebarMenuSubItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSubButton,
  
  // Hooks
  useSidebar,
} from "./sidebar/index"

// Re-export types
export type {
  SidebarProviderProps,
  SidebarProps,
  SidebarMenuButtonProps,
  SidebarMenuActionProps,
  SidebarMenuSkeletonProps,
  SidebarMenuSubButtonProps,
  SidebarGroupActionProps,
  SidebarGroupLabelProps,
} from "./sidebar/types"

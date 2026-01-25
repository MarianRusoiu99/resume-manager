import { TooltipContent } from "@/components/ui/tooltip"

/**
 * Shared types for Sidebar components
 */

export interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface SidebarProps extends React.ComponentProps<"div"> {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}

export interface SidebarMenuButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
  isActive?: boolean;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  tooltip?: string | React.ComponentPropsWithoutRef<typeof TooltipContent>;
}

export interface SidebarMenuActionProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
  showOnHover?: boolean;
}

export interface SidebarMenuSkeletonProps extends React.ComponentProps<"div"> {
  showIcon?: boolean;
}

export interface SidebarMenuSubButtonProps extends React.ComponentProps<"a"> {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}

export interface SidebarGroupActionProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
}

export interface SidebarGroupLabelProps extends React.ComponentProps<"div"> {
  asChild?: boolean;
}

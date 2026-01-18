import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Grid column configuration for responsive layouts
 */
export interface GridConfig {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

/**
 * Filter/category option for gallery filtering
 */
export interface GalleryFilterOption {
  value: string;
  label: string;
}

/**
 * Count label configuration
 */
export interface CountLabelConfig {
  singular: string;
  plural: string;
}

/**
 * Gallery Header configuration
 */
export interface GalleryHeaderConfig {
  /** Show item count (e.g., "5 profiles") */
  showCount?: boolean;
  /** Label for count (e.g., "5 profiles") */
  countLabel?: CountLabelConfig;
  /** Action buttons to show in header */
  actions?: ReactNode;
  /** Filter options for category filtering */
  filters?: GalleryFilterOption[];
  /** Current selected filter value */
  selectedFilter?: string;
  /** Filter change handler */
  onFilterChange?: (value: string) => void;
}

/**
 * Empty state configuration
 */
export interface GalleryEmptyConfig {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    disabled?: boolean;
  };
  /** Secondary action (e.g., import button alongside create) */
  secondaryAction?: ReactNode;
}

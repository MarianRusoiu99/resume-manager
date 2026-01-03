import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "./PageHeader";
import { PageContainer } from "./PageContainer";
import { PageSkeleton } from "@/components/shared/skeletons/PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutoBreadcrumbs, type BreadcrumbItem } from "@/hooks/useAutoBreadcrumbs";

interface PageProps {
  /** Page title displayed in header */
  title: React.ReactNode;
  /** Optional description below title */
  description?: string;
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons displayed in header area */
  actions?: ReactNode;
  /** Optional toolbar shown above content */
  toolbar?: ReactNode;
  /** Maximum width of page content */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "full";
  /** Page content */
  children: ReactNode;
  /** Additional className for container */
  className?: string;
  /** Whether the page content should be scrollable */
  scrollable?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Loading skeleton type */
  loadingType?: 'default' | 'gallery' | 'form' | 'dashboard';
}

/**
 * Page - Unified page layout component
 * 
 * Combines PageHeader and PageContainer for consistent page structure.
 * Use this component for all authenticated pages.
 */
export function Page({
  title,
  description,
  breadcrumbs,
  actions,
  toolbar,
  maxWidth = "6xl",
  children,
  className,
  scrollable = true,
  isLoading = false,
  loadingType = 'default',
}: PageProps) {
  const autoBreadcrumbs = useAutoBreadcrumbs(breadcrumbs);

  return (
    <div className="flex flex-col h-full bg-muted/20 overflow-hidden">
      <PageHeader
        title={isLoading ? <Skeleton className="h-8 w-48" /> : title}
        description={isLoading ? undefined : description}
        breadcrumbs={autoBreadcrumbs}
        actions={isLoading ? undefined : actions}
      />
      <div className={cn(
        "flex-1 min-h-0 flex flex-col",
        scrollable ? "overflow-y-auto" : "overflow-hidden"
      )}>
        <PageContainer maxWidth={maxWidth} className={className}>
          <div className="flex-1 flex flex-col min-h-0 gap-6">
            {toolbar && !isLoading && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="flex-1">{toolbar}</div>
              </div>
            )}
            <div className="flex-1 min-h-0">
              {isLoading ? (
                <PageSkeleton type={loadingType} />
              ) : (
                children
              )}
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}

/**
 * PageWithSidebar - Page layout with sidebar support
 * 
 * For pages that need a two-column layout with sidebar.
 */
interface PageWithSidebarProps extends Omit<PageProps, "children"> {
  /** Main content area */
  children: ReactNode;
  /** Sidebar content */
  sidebar?: ReactNode;
  /** Sidebar position */
  sidebarPosition?: "left" | "right";
  /** Sidebar width class */
  sidebarWidth?: string;
}

export function PageWithSidebar({
  title,
  description,
  breadcrumbs,
  actions,
  toolbar,
  maxWidth = "full",
  children,
  sidebar,
  sidebarPosition = "right",
  sidebarWidth = "w-80",
  className,
}: Readonly<PageWithSidebarProps>) {
  const mainContent = (
    <div className="flex-1 min-w-0">
      {children}
    </div>
  );

  const sidebarContent = sidebar && (
    <aside className={`shrink-0 ${sidebarWidth}`}>
      {sidebar}
    </aside>
  );

  const autoBreadcrumbs = useAutoBreadcrumbs(breadcrumbs);

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={autoBreadcrumbs}
        actions={actions}
      />
      <PageContainer maxWidth={maxWidth} className={className}>
        {toolbar && <div className="mb-6">{toolbar}</div>}
        <div className="flex gap-6">
          {sidebarPosition === "left" && sidebarContent}
          {mainContent}
          {sidebarPosition === "right" && sidebarContent}
        </div>
      </PageContainer>
    </>
  );
}

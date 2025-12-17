import { type ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { PageContainer } from "./PageContainer";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageProps {
  /** Page title displayed in header */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons displayed in header area */
  actions?: ReactNode;
  /** Optional toolbar shown above content */
  toolbar?: ReactNode;
  /** Maximum width of page content */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Page content */
  children: ReactNode;
  /** Additional className for container */
  className?: string;
}

/**
 * Page - Unified page layout component
 * 
 * Combines PageHeader and PageContainer for consistent page structure.
 * Use this component for all authenticated pages.
 * 
 * @example
 * ```tsx
 * <Page
 *   title="My Resumes"
 *   description="Manage your AI-generated resumes"
 *   breadcrumbs={[{ label: "Resumes" }]}
 *   actions={
 *     <Button onClick={() => router.push('/generate')}>
 *       Generate New Resume
 *     </Button>
 *   }
 * >
 *   <ResumeList resumes={resumes} />
 * </Page>
 * ```
 */
export function Page({
  title,
  description,
  breadcrumbs,
  actions,
  toolbar,
  maxWidth = "2xl",
  children,
  className,
}: PageProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />
      <PageContainer maxWidth={maxWidth} className={className}>
        {toolbar && <div className="mb-6">{toolbar}</div>}
        {actions && <div className="flex justify-end mb-6">{actions}</div>}
        {children}
      </PageContainer>
    </>
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
}: PageWithSidebarProps) {
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

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />
      <PageContainer maxWidth={maxWidth} className={className}>
        {toolbar && <div className="mb-6">{toolbar}</div>}
        {actions && <div className="flex justify-end mb-6">{actions}</div>}
        <div className="flex gap-6">
          {sidebarPosition === "left" && sidebarContent}
          {mainContent}
          {sidebarPosition === "right" && sidebarContent}
        </div>
      </PageContainer>
    </>
  );
}

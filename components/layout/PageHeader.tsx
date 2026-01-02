import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: Readonly<PageHeaderProps>) {
  return (
    <header className="flex flex-col gap-4 bg-transparent px-4 sm:px-8 py-4 shrink-0">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-2" />

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb) => (
                <div key={`${crumb.label}-${crumb.href || 'current'}`} className="flex items-center gap-2">
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                  {breadcrumbs.indexOf(crumb) < breadcrumbs.length - 1 && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              ))}
            </nav>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      <div className="w-full">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </header>
  );
}

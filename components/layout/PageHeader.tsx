import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({ title, description, breadcrumbs }: Readonly<PageHeaderProps>) {
  return (
    <header className="flex flex-col gap-4 bg-background px-6 py-4">
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </header>
  );
}

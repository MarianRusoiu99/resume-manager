'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Static route labels map
const ROUTE_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'profile': 'Profile',
  'generate': 'Generate',
  'resumes': 'Resumes',
  'cover-letters': 'Cover Letters',
  'templates': 'Templates',
  'settings': 'Settings',
  'new': 'New',
  'edit': 'Edit',
  'api-keys': 'API Keys',
  'ai-models': 'AI Models',
};

export function useAutoBreadcrumbs(customBreadcrumbs?: BreadcrumbItem[]): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    if (customBreadcrumbs) return customBreadcrumbs;

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip numeric/ID segments for labels unless we have a label for it
      const label = ROUTE_LABELS[segment] || segment;
      
      // UUID or CUID detection (simple check)
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || 
                   (segment.startsWith('c') && segment.length >= 24);

      if (isId) {
        // We could fetch the name here if we had a registry, 
        // for now we just show "Detail" or "Edit" depending on next segment
        const nextSegment = segments[index + 1];
        if (nextSegment === 'edit') {
           // Skip adding the ID itself, 'edit' will handle it
           return;
        }
        breadcrumbs.push({ label: 'Detail', href: currentPath });
      } else {
        breadcrumbs.push({
          label,
          href: index === segments.length - 1 ? undefined : currentPath,
        });
      }
    });

    return breadcrumbs;
  }, [pathname, customBreadcrumbs]);
}

'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { getRouteConfig, ALL_ROUTES_CONFIG, RouteConfig } from '@/lib/constants/nav-config';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function useAutoBreadcrumbs(customBreadcrumbs?: BreadcrumbItem[]): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    if (customBreadcrumbs) return customBreadcrumbs;

    const currentRoute = getRouteConfig(pathname);
    if (!currentRoute) {
        // Fallback to simple segment-based breadcrumbs if route not in config
        const segments = pathname.split('/').filter(Boolean);
        return segments.map((s, i) => ({
            label: s.charAt(0).toUpperCase() + s.slice(1),
            href: i === segments.length - 1 ? undefined : '/' + segments.slice(0, i + 1).join('/')
        }));
    }

    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Helper to recursively build parent chain
    const buildChain = (route: RouteConfig) => {
        if (route.parent) {
            const parentRoute = ALL_ROUTES_CONFIG.find(r => r.url === route.parent);
            if (parentRoute) {
                buildChain(parentRoute);
            }
        }
        
        // Don't add link to the current page (last item)
        const isLast = route.url === currentRoute.url;
        
        // Resolve dynamic URL if needed (replace [id] with actual segment from pathname)
        let resolvedUrl = route.url;
        if (resolvedUrl.includes('[')) {
            const segments = pathname.split('/');
            const configSegments = route.url.split('/');
            configSegments.forEach((seg, i) => {
                if (seg.startsWith('[') && seg.endsWith(']')) {
                    resolvedUrl = resolvedUrl.replace(seg, segments[i]);
                }
            });
        }

        breadcrumbs.push({
            label: route.title,
            href: isLast ? undefined : resolvedUrl
        });
    };

    buildChain(currentRoute);
    return breadcrumbs;
  }, [pathname, customBreadcrumbs]);
}

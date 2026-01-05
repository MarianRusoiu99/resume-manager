'use client';

const prefetchCache = new Set<string>();

/**
 * Prefetches a URL using the browser's link prefetch mechanism.
 * Useful for preloading API data when hovering over navigation links or cards.
 */
export function prefetchUrl(url: string) {
  if (prefetchCache.has(url)) return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = 'fetch';
  
  document.head.appendChild(link);
  prefetchCache.add(url);
}

/**
 * Hook to prefetch multiple URLs
 */
export function usePrefetch() {
  return {
    prefetch: prefetchUrl,
  };
}

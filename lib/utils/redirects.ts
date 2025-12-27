/**
 * Redirect helpers
 */

/**
 * Prevent open redirects by ensuring the callback URL is a safe, internal path.
 * - Allows only relative paths starting with `/`
 * - Disallows protocol-relative (`//...`) and external URLs (`http://...`)
 */
export function sanitizeCallbackUrl(callbackUrl: string | null | undefined, fallback = '/profile'): string {
  if (!callbackUrl) return fallback;

  const value = callbackUrl.trim();

  // Only allow internal paths
  if (!value.startsWith('/')) return fallback;

  // Disallow protocol-relative URLs
  if (value.startsWith('//')) return fallback;

  // Basic header injection hardening
  if (value.includes('\r') || value.includes('\n')) return fallback;

  return value;
}

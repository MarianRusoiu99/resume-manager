/**
 * API Client
 * 
 * A fetch wrapper that handles session expiry automatically.
 * When a 401 response is received, it triggers the session expiry flow.
 */

import { triggerSessionExpiry } from "@/lib/auth/session-expiry";

type FetchOptions = RequestInit & {
  /** Skip session expiry handling for this request */
  skipSessionCheck?: boolean;
};

/**
 * Fetch wrapper that handles session expiry
 * 
 * Use this instead of native fetch for API calls to get automatic
 * session expiry handling when the server returns 401.
 * 
 * @example
 * ```tsx
 * import { apiFetch } from '@/lib/utils/api-client';
 * 
 * const response = await apiFetch('/api/v1/profile');
 * if (!response.ok) {
 *   // Handle other errors (401 is already handled)
 * }
 * ```
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: FetchOptions
): Promise<Response> {
  const { skipSessionCheck, ...fetchInit } = init ?? {};
  
  const response = await fetch(input, fetchInit);
  
  // Handle session expiry
  if (!skipSessionCheck && response.status === 401) {
    // Check if this is an auth-related endpoint (don't trigger for login/register)
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else {
      url = input.url;
    }
    
    const isAuthEndpoint = url.includes('/api/v1/auth/');
    
    if (!isAuthEndpoint) {
      // Trigger session expiry flow
      triggerSessionExpiry();
    }
  }
  
  return response;
}

/**
 * Typed fetch helper for JSON responses
 * 
 * @example
 * ```tsx
  * const data = await apiJson<Profile>('/api/v1/profile');

 * ```
 */
export async function apiJson<T>(
  input: RequestInfo | URL,
  init?: FetchOptions
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const response = await apiFetch(input, init);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorBody.error || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }
    
    const data = await response.json();
    return { data, error: null, status: response.status };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

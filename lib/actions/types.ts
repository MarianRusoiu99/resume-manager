/**
 * Shared types for Server Actions (application boundary).
 */

/**
 * Standard result type for all Server Actions.
 */
import type { ServiceErrorCode } from '@/lib/types/service-result';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ServiceErrorCode };

/**
 * Shared types for Server Actions
 */

/**
 * Standard result type for all Server Actions
 * Provides consistent error handling across the application
 */
export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

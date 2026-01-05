/**
 * Utility functions for tracing
 */

/**
 * Generate a random ID for tracing
 */
export function generateId(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

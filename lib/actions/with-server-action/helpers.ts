/**
 * Server Action Wrapper - Helpers
 * 
 * Helper functions for server action wrapper.
 */

export function extractResourceId(result: unknown): string | undefined {
  if (result && typeof result === 'object') {
    if ('id' in result && typeof result.id === 'string') {
      return result.id;
    }
    if ('data' in result && typeof result.data === 'object' && result.data && 'id' in result.data) {
      return (result.data as { id: string }).id;
    }
  }
  return undefined;
}

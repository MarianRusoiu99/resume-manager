/**
 * Utility types for the application
 */

/**
 * Make all properties in T optional, recursively
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/** Recursively convert Date -> string for API/action return types */
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | undefined
      ? string | undefined
      : T[K] extends (infer U)[]
        ? Serialized<U>[]
        : T[K] extends object
          ? Serialized<T[K]>
          : T[K];
};

/**
 * Safely access nested properties that might be undefined
 * 
 * @example
 * safeGet(obj, 'a.b.c', 'default')
 */
export function safeGet<T, K>(
  obj: T | undefined | null,
  path: string,
  defaultValue?: K
): K | undefined {
  if (!obj) return defaultValue;
  
  const value = path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj as unknown);
  
  return (value as K) ?? defaultValue;
}

/**
 * Form Schema Utilities
 */

import { FormSchema, FieldConfig } from './types';

/**
 * Helper function to create a form schema with type inference
 */
export function createFormSchema<T>(schema: FormSchema<T>): FormSchema<T> {
  return schema;
}

/**
 * Get display value for a field
 */
export function getFieldValue<T>(item: T, key: keyof T): string {
  const value = item[key];
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/**
 * Check if a field should span full width
 */
export function isFullWidth<T>(field: FieldConfig<T>): boolean {
  if (field.colSpan === 2) return true;
  if (field.type === 'textarea') return true;
  if (field.type === 'richtext') return true;
  if (field.type === 'tags') return true;
  return false;
}

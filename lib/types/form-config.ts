/**
 * Form Configuration Type Definitions
 * 
 * Proper type definitions for dynamic form configurations
 */

export * from '@/lib/forms/schemas/types';
import type { FieldConfig, FormSchema } from '@/lib/forms/schemas/types';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Generic field configuration with unknown data type
 * Used when the specific type is not known at compile time
 */
export type GenericFieldConfig = FieldConfig<Record<string, unknown>>;

/**
 * Generic form schema with unknown data type
 * Used when the specific type is not known at compile time
 */
export type GenericFormSchema = FormSchema<Record<string, unknown>>;

/**
 * Dynamic form transformer functions
 * These functions handle conversion between resume data and form data
 */
export type FormDataTransformer<TResumeField = unknown, TFormData = unknown> = {
  toForm?: (data: TResumeField) => TFormData;
  fromForm?: (data: TFormData) => TResumeField;
};

/**
 * Resume field value type helper
 * Extracts the type of a specific resume field
 */
export type ResumeFieldValue<K extends keyof Resume> = Resume[K];

/**
 * Dynamic data transformer
 * Used for sections where we don't know the exact type at compile time
 */
export type DynamicDataTransformer = FormDataTransformer<unknown, unknown>;

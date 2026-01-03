/**
 * Form Field Configuration Types
 */

/**
 * Base field configuration shared by all field types
 */
export interface BaseFieldConfig<T> {
  /** Field key in the data object */
  key: keyof T;
  /** Display label */
  label: string;
  /** Whether field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Help text shown below field */
  description?: string;
  /** Grid column span (1 or 2 for full width) */
  colSpan?: 1 | 2;
}

/**
 * Text input field configuration
 */
export interface TextFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'text' | 'email' | 'url' | 'tel' | 'password';
}

/**
 * Textarea field configuration
 */
export interface TextareaFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'textarea';
  rows?: number;
}

/**
 * Date/month input field configuration
 */
export interface DateFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'date' | 'month';
}

/**
 * Select field configuration
 */
export interface SelectFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'select';
  options: { value: string; label: string }[];
}

/**
 * List field configuration (for arrays like highlights, keywords)
 */
export interface ListFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'list';
  /** Separator between items when displayed as string */
  separator?: 'newline' | 'comma';
  rows?: number;
}

/**
 * Union type for all field configurations
 */
export type FieldConfig<T> =
  | TextFieldConfig<T>
  | TextareaFieldConfig<T>
  | DateFieldConfig<T>
  | SelectFieldConfig<T>
  | ListFieldConfig<T>;

/**
 * Form schema definition
 */
export interface FormSchema<T> {
  /** Form fields in display order */
  fields: FieldConfig<T>[];
  /** Template for new items */
  newItemTemplate: T;
  /** Labels for add/remove buttons */
  labels?: {
    addButton?: string;
    emptyMessage?: string;
    itemTitle?: (item: T, index: number) => string;
  };
}

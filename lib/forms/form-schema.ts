/**
 * Form Field Configuration
 *
 * Generic type-safe form field definitions for creating dynamic forms.
 * Used with useListForm and FormList for consistent form generation.
 */

export * from './schemas/types';
export * from './schemas/utils';

// Re-export schemas from individual files
export * from './schemas/resume/basics';
export * from './schemas/resume/experience';
export * from './schemas/resume/education';
export * from './schemas/resume/skills';
export * from './schemas/resume/projects';
export * from './schemas/resume/misc';


/**
 * Resume CRUD Service - Facade for backward compatibility
 *
 * This module re-exports from the split service for existing imports.
 * New code should import from `lib/services/resume-crud`.
 */

export { ResumeCrudService, resumeCrudService } from './resume-crud';
export type { ResumeListItem, ResumeDetails, UpdatedResumeData } from './resume-crud';

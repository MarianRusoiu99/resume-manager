/**
 * Resume Generation Service (Facade)
 *
 * This file preserves stable imports while the implementation lives under
 * `lib/services/resume-generation/`.
 */

export {
  ResumeGenerationService,
  resumeGenerationService,
} from './resume-generation';

export type {
  GenerateResumeServiceInput,
  GenerateResumeWithProgressInput,
  ProgressCallback,
  ResumeData,
  GeneratedResumeData,
  CoverLetterGenerationData,
} from './resume-generation';

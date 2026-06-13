export { resumeSchema, type Resume } from './schema';

export type {
  Basics,
  Location,
  Profile,
  Work,
  Volunteer,
  Education,
  Award,
  Certificate,
  Publication,
  Skill,
  Language,
  Interest,
  Reference,
  Project,
  Meta
} from './schema';

export {
  safeParseResume,
  parseResumeOrThrow,
  isValidResume,
  type ResumeValidationIssue,
  type ResumeValidationMode,
  type ResumeValidationResult,
} from './contract';

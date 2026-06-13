import { ValidationError } from '@/lib/errors';
import { type Resume, resumeSchema } from './schema';
import { strictResumeSchema } from './strict';

export type ResumeValidationMode = 'strict' | 'lenient';

export interface ResumeValidationIssue {
  path: string;
  message: string;
}

export type ResumeValidationResult =
  | {
      success: true;
      data: Resume;
    }
  | {
      success: false;
      issues: ResumeValidationIssue[];
    };

function formatIssues(issues: Array<{ path: PropertyKey[]; message: string }>): ResumeValidationIssue[] {
  return issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

export function safeParseResume(
  value: unknown,
  mode: ResumeValidationMode = 'strict'
): ResumeValidationResult {
  const schema = mode === 'strict' ? strictResumeSchema : resumeSchema;
  const parsed = schema.safeParse(value);

  if (parsed.success) {
    return { success: true, data: parsed.data as Resume };
  }

  return {
    success: false,
    issues: formatIssues(parsed.error.issues),
  };
}

export function parseResumeOrThrow(
  value: unknown,
  mode: ResumeValidationMode = 'strict'
): Resume {
  const result = safeParseResume(value, mode);
  if (!result.success) {
    const details = result.issues.map((issue): Record<string, string> => ({
      path: issue.path,
      message: issue.message,
    }));
    const message = `Invalid JSON Resume payload (${mode})`;
    throw new ValidationError(message, 'resume', details);
  }

  return result.data as Resume;
}

export function isValidResume(value: unknown, mode: ResumeValidationMode = 'strict'): value is Resume {
  return safeParseResume(value, mode).success;
}

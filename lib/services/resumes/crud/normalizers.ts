import type { ResumeListItem, ResumeDetails } from '@/lib/types';

export function extractJobInfo(
  jobMetadata: Record<string, unknown> | null
): { jobTitle: string | null; companyName: string | null } {
  return {
    jobTitle: (jobMetadata?.jobTitle as string) || null,
    companyName: (jobMetadata?.companyName as string) || null,
  };
}

export function normalizeResumeMetadata(
  storedMetadata: Record<string, unknown>,
  options?: { allowTokensAlias?: boolean }
): ResumeListItem['metadata'] {
  return {
    generatedAt: (storedMetadata.generatedAt as string) || new Date().toISOString(),
    model: (storedMetadata.model as string) || 'unknown',
    totalTokens:
      (options?.allowTokensAlias ? (storedMetadata.tokens as number) : undefined) ||
      (storedMetadata.totalTokens as number) ||
      0,
    processingTime: (storedMetadata.processingTime as number) || 0,
  };
}

export function normalizeResumeDetailsJobTitle(
  jobTitle: string | null
): ResumeDetails['jobTitle'] {
  return jobTitle || 'Position';
}

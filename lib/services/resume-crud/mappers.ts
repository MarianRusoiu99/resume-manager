import type { GeneratedResume } from '@prisma/client';

import type { ResumeDetails, ResumeListItem } from './types';
import { extractJobInfo, normalizeResumeDetailsJobTitle, normalizeResumeMetadata } from './normalizers';

export function mapGeneratedResumeToListItem(resume: GeneratedResume): ResumeListItem {
  const jobMetadata = resume.jobMetadata as Record<string, unknown> | null;
  const { jobTitle, companyName } = extractJobInfo(jobMetadata);

  const storedMetadata = resume.metadata as Record<string, unknown>;
  const normalizedMetadata = normalizeResumeMetadata(storedMetadata);

  return {
    id: resume.id,
    userId: resume.userId,
    jobTitle,
    companyName,
    jobDescription: resume.jobDescription,
    content: resume.resume as Record<string, unknown>,
    templateId: resume.templateId,
    metadata: normalizedMetadata,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

export function mapGeneratedResumeToDetails(resume: GeneratedResume): ResumeDetails {
  const jobMetadata = resume.jobMetadata as Record<string, unknown> | null;
  const { jobTitle, companyName } = extractJobInfo(jobMetadata);

  const storedMetadata = resume.metadata as Record<string, unknown>;
  const normalizedMetadata = normalizeResumeMetadata(storedMetadata, { allowTokensAlias: true });

  return {
    id: resume.id,
    jobDescription: resume.jobDescription,
    jobMetadata: resume.jobMetadata as Record<string, unknown>,
    jobTitle: normalizeResumeDetailsJobTitle(jobTitle),
    companyName,
    content: resume.resume as Record<string, unknown>,
    metadata: normalizedMetadata,
    templateId: resume.templateId,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

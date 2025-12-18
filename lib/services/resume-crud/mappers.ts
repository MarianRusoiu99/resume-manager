import type { ResumeDetails, ResumeListItem } from './types';

export interface LegacyGeneratedResume {
  id: string;
  userId: string;
  jobDescription: string;
  jobMetadata: unknown;
  resume: unknown;
  templateId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}
import { extractJobInfo, normalizeResumeDetailsJobTitle, normalizeResumeMetadata } from './normalizers';

export function mapGeneratedResumeToListItem(resume: LegacyGeneratedResume): ResumeListItem {
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

export function mapGeneratedResumeToDetails(resume: LegacyGeneratedResume): ResumeDetails {
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

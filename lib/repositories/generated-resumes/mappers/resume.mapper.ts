import { Prisma } from '@prisma/client';
import { GeneratedResumeEntity } from '@/lib/repositories/interfaces/generated-resumes.repository.interface';
import type { Resume } from '@/lib/validations/jsonresume';

export type ResumeWithIncludes = Prisma.ResumeGetPayload<{
  include: {
    document: { select: { document: true } };
    jobPosting: { include: { company: true } };
    coverLetter: { select: { id: true } };
  };
}>;

export function mapResumeToGeneratedData(resume: ResumeWithIncludes): GeneratedResumeEntity {
  const metadata = resume.metadata as unknown;
  const metadataRecord =
    metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};

  const jobMetadataFromMetadata = metadataRecord?.jobMetadata;

  const jobMetadata: Record<string, unknown> =
    (jobMetadataFromMetadata as Record<string, unknown>) ??
    ({
      jobTitle: resume.jobPosting?.title ?? null,
      companyName: resume.jobPosting?.company?.name ?? null,
    } satisfies Record<string, unknown>);

  return {
    id: resume.id,
    userId: resume.userId,
    jobDescription: resume.jobPosting?.description ?? '',
    jobMetadata,
    resume: (resume.document?.document as Resume) ?? null,
    templateId: resume.templateId ?? null,
    coverLetterId: resume.coverLetter?.id ?? null,
    metadata: metadataRecord,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

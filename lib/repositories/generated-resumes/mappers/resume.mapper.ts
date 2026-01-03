import { Prisma } from '@prisma/client';
import { GeneratedResumeData } from '../../interfaces/generated-resumes.repository.interface';

export type ResumeWithIncludes = Prisma.ResumeGetPayload<{
  include: {
    document: { select: { document: true } };
    jobPosting: { include: { company: true } };
    coverLetter: { select: { id: true } };
  };
}>;

export function mapResumeToGeneratedData(resume: ResumeWithIncludes): GeneratedResumeData {
  const metadata = resume.metadata as unknown;
  const metadataRecord =
    metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : undefined;

  const jobMetadataFromMetadata = metadataRecord?.jobMetadata;

  const jobMetadata =
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
    resume: (resume.document?.document as any) ?? null,
    templateId: resume.templateId ?? null,
    coverLetterId: resume.coverLetter?.id ?? null,
    metadata: resume.metadata as unknown,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

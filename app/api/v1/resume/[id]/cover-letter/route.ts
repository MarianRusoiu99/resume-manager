/**
 * Update Cover Letter API
 * PUT /api/resume/[id]/cover-letter
 * 
 * Updates the cover letter content for an existing resume
 */

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler } from '@/lib/api-handler';
import { requireFound, requireOwnership } from '@/lib/auth/guards';
import { success } from '@/lib/types/service-result';

const updateCoverLetterSchema = z.object({
  coverLetter: z.string().min(1, 'Cover letter cannot be empty'),
});

type UpdateCoverLetterBody = z.infer<typeof updateCoverLetterSchema>;

type CoverLetterResponseData = {
  resume: { coverLetter: string; updatedAt: string };
};

export const PUT = createApiHandler<CoverLetterResponseData, UpdateCoverLetterBody>(
  async (_request, { params }, session, body) => {
    const { id: resumeId } = await params;

    const existingResume = requireFound(
      await prisma.generatedResume.findUnique({
        where: { id: resumeId },
        select: {
          userId: true,
          jobDescription: true,
        },
      }),
      'Resume'
    );

    requireOwnership({
      resourceUserId: existingResume.userId,
      sessionUserId: session.user.id,
      message: 'Forbidden - You do not have access to this resume',
    });

    const updatedResume = await prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        coverLetter: {
          upsert: {
            create: {
              userId: session.user.id,
              content: body!.coverLetter,
              jobDescription: existingResume.jobDescription,
              metadata: {},
            },
            update: {
              content: body!.coverLetter,
              updatedAt: new Date(),
            },
          },
        },
        updatedAt: new Date(),
      },
      select: {
        coverLetter: { select: { content: true } },
        updatedAt: true,
      },
    });

    return success({
      resume: {
        coverLetter: updatedResume.coverLetter?.content ?? body!.coverLetter,
        updatedAt: updatedResume.updatedAt.toISOString(),
      },
    });
  },
  { bodySchema: updateCoverLetterSchema, verifyUser: true }
);


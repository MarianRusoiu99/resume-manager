/**
 * API Route: PATCH /api/resume/:id/content
 * Updates resume content for a specific resume
 */

import { z } from 'zod';
import { resumeSchema } from '@/lib/validations/jsonresume';
import { createApiHandler } from '@/lib/api-handler';
import { resumeService } from '@/lib/services/resume.service';

const contentSchema = z.object({ content: resumeSchema });

export const PATCH = createApiHandler(
  async (_request, { params }, session, body) => {
    const { id: resumeId } = await params;

    return resumeService.updateResumeContent(resumeId, session.user.id, body!.content);
  },
  { bodySchema: contentSchema, verifyUser: true }
);


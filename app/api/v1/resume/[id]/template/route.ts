import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import { requireFound } from '@/lib/auth/guards';
import { generatedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import { templateRepository } from '@/lib/repositories/templates.repository';
import { success } from '@/lib/types/service-result';

const updateTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
});

type UpdateTemplateBody = z.infer<typeof updateTemplateSchema>;

type UpdateTemplateResponseData = {
  resume: {
    id: string;
    templateId: string | null;
  };
  message: string;
};

/**
 * PATCH /api/resume/[id]/template - Update template for a resume
 */
export const PATCH = createApiHandler<UpdateTemplateResponseData, UpdateTemplateBody>(
  async (_request, { params }, session, body) => {
    const { id: resumeId } = await params;

    requireFound(await templateRepository.findById(body!.templateId), 'Template');

    const resume = requireFound(
      await generatedResumeRepository.findByIdAndUserId(resumeId, session.user.id),
      'Resume'
    );

    const updatedResume = await generatedResumeRepository.updateTemplate(resume.id, body!.templateId);

    return success({
      resume: {
        id: updatedResume.id,
        templateId: updatedResume.templateId,
      },
      message: 'Template updated successfully',
    });
  },
  { bodySchema: updateTemplateSchema, verifyUser: true }
);

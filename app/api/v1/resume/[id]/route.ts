/**
 * Resume Detail API Routes
 * 
 * GET /api/resume/[id] - Get a specific resume
 *   - Used for initial data fetching in components
 * 
 * PATCH /api/resume/[id] - Update resume content or template
 *   - Used for content updates (no server action equivalent yet)
 * 
 * DELETE /api/resume/[id] - Delete a specific resume
 *   - @deprecated Prefer using deleteResume server action from '@/app/actions/resume'
 *   - Kept for backward compatibility
 */

import { resumeService } from '@/lib/services/resume.service';
import { createApiHandler } from '@/lib/api-handler';
import { success } from '@/lib/types/service-result';
import { updateResumeContentSchema } from '@/lib/validations';

/**
 * GET /api/resume/[id] - Get a specific resume
 */
export const GET = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  // Get resume (with ownership verification)
  return resumeService.getResume(id, session.user.id);
});

/**
 * DELETE /api/resume/[id] - Delete a specific resume
 */
export const DELETE = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  // Delete resume (with ownership verification) - cache invalidation handled in service
  const result = await resumeService.deleteResume(id, session.user.id);

  if (!result.success) {
    return result;
  }

  return success({ message: 'Resume deleted successfully' });
});

/**
 * PATCH /api/resume/[id] - Update resume content or template
 */
export const PATCH = createApiHandler<unknown, Partial<{ templateId: string | null }> & Partial<{
  resume: Record<string, unknown>;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
}>>(
  async (_request, { params }, session, body) => {
    const { id } = await params;

    // Backward-compatible template-only update
    if (body && 'templateId' in body && !('resume' in body)) {
      const templateId = (body as { templateId: string | null }).templateId;
      return resumeService.updateResumeTemplate(id, session.user.id, templateId);
    }

    const resume = (body as { resume?: Record<string, unknown> } | undefined)?.resume;
    const jobTitle = (body as { jobTitle?: string } | undefined)?.jobTitle;
    const companyName = (body as { companyName?: string } | undefined)?.companyName;
    const jobDescription = (body as { jobDescription?: string } | undefined)?.jobDescription;

    // If the request includes job fields, persist them first.
    if (jobTitle !== undefined || companyName !== undefined || jobDescription !== undefined) {
      const jobResult = await resumeService.updateResumeJobDetails(id, session.user.id, {
        jobTitle,
        companyName,
        jobDescription,
      });

      if (!jobResult.success) {
        return jobResult;
      }
    }

    // If resume payload is present, update resume content.
    if (resume !== undefined) {
      return resumeService.updateResumeContent(id, session.user.id, resume as never);
    }

    // If only metadata was updated, return the updated record.
    return resumeService.getResume(id, session.user.id);
  },
  { bodySchema: updateResumeContentSchema.partial().passthrough(), verifyUser: true }
);


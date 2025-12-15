/**
 * Resume HTML Preview API
 * GET /api/resume/[id]/preview
 * Returns rendered HTML for iframe preview
 */

import { prisma } from '@/lib/db';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import { createApiHandler } from '@/lib/api-handler';
import { requireFound } from '@/lib/auth/guards';

export const GET = createApiHandler(async (_req, { params }, session) => {
  const { id } = await params;

  // Fetch resume (ownership-safe) with template
  const resume = requireFound(
    await prisma.generatedResume.findFirst({
      where: { id, userId: session.user.id },
      include: { template: true },
    }),
    'Resume'
  );

  // Get template (use default if none selected)
  let template = resume.template;

  if (!template) {
    template = requireFound(
      await prisma.resumeTemplate.findFirst({ where: { isPublic: true } }),
      'Template'
    );
  }

  const html = renderCompleteDocument(
    template.htmlTemplate,
    template.cssStyles,
    resume.resume as Resume
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});

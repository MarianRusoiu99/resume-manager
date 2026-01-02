/**
 * Resume HTML Preview API
 * GET /api/resume/[id]/preview
 * Returns rendered HTML for iframe preview
 */

import { prisma } from '@/lib/db/index';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import { createApiHandler } from '@/lib/api/handler';
import { requireFound } from '@/lib/auth/guards';

export const GET = createApiHandler(async (_req, { params }, session) => {
  const { id } = await params;

  // Fetch resume (ownership-safe) with template + document
  const resume = requireFound(
    await prisma.resume.findFirst({
      where: { id, userId: session.user.id },
      include: {
        template: true,
        document: { select: { document: true } },
      },
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
    resume.document?.document as Resume
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});

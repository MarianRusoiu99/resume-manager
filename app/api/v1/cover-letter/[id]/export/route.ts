/**
 * Cover Letter Export API
 * POST /api/v1/cover-letter/[id]/export
 *
 * Generates a PDF for an existing cover letter.
 *
 * Implementation detail:
 * This reuses the existing universal PDF exporter by converting the cover letter
 * content into a minimal JSON Resume payload and a simple HTML template.
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { coverLetterService } from '@/lib/services';
import type { Resume } from '@/lib/validations/jsonresume';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { pdfService, DEFAULT_PDF_CONFIG } from '@/lib/services/pdf/pdf.service';

const COVER_LETTER_HTML_TEMPLATE = `
<div class="cover-letter">
  <header class="header">
    <h1>{{basics.name}}</h1>
    <div class="meta">
      {{#if basics.email}}<div>{{basics.email}}</div>{{/if}}
      {{#if basics.phone}}<div>{{basics.phone}}</div>{{/if}}
      {{#if basics.location.address}}<div>{{basics.location.address}}</div>{{/if}}
    </div>
  </header>

  <main class="content">
    {{{coverLetterHtml}}}
  </main>
</div>
`;

const COVER_LETTER_CSS = `
.cover-letter{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#111;}
.header{margin-bottom:24px;}
h1{font-size:20px; margin:0 0 8px;}
.meta{font-size:12px; color:#444;}
.content{font-size:12px; line-height:1.5; white-space:normal;}
.content p{margin:0 0 10px;}
`;

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function markdownishToHtml(text: string): string {
  // Not a full markdown implementation; preserves paragraphs and newlines.
  const normalized = text.replaceAll('\r\n', '\n').trim();
  if (!normalized) return '';

  return normalized
    .split(/\n\n+/)
    .map((block) => `<p>${escapeHtml(block).replaceAll('\n', '<br />')}</p>`)
    .join('\n');
}

export const POST = createApiHandler(async (_request, { params }, session) => {
  const { id } = await params;
  const coverLetterResult = await coverLetterService.getCoverLetter(id, session.user.id);

  if (!coverLetterResult.success) {
    return coverLetterResult;
  }

  const coverLetter = coverLetterResult.data;

  const metadata = coverLetter.metadata as unknown;
  const metadataRecord =
    metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : undefined;

  const metadataJobTitle = typeof metadataRecord?.jobTitle === 'string' ? metadataRecord.jobTitle : undefined;
  const metadataCompanyName =
    typeof metadataRecord?.companyName === 'string' ? metadataRecord.companyName : undefined;

  const jobTitle = coverLetter.jobPosting?.title ?? metadataJobTitle;
  const companyName = coverLetter.jobPosting?.company?.name ?? metadataCompanyName;
  const displayTitle = [jobTitle, companyName].filter(Boolean).join(' - ') || 'Cover Letter';

  const resume = {
    basics: {
      name: displayTitle,
    },
    coverLetterHtml: markdownishToHtml(coverLetter.content),
  } as Resume & { coverLetterHtml: string };

  const mergedHtml = `<style>\n${COVER_LETTER_CSS}\n</style>\n${COVER_LETTER_HTML_TEMPLATE}`;
  const html = renderCompleteDocument(mergedHtml, resume as Resume);

  const pdfBuffer = await pdfService.generateFromHtml(html, DEFAULT_PDF_CONFIG);

  const safeNameBase = displayTitle || 'cover-letter';
  const safeName = safeNameBase.replaceAll(/\s+/g, '_').replaceAll(/[^a-zA-Z0-9_\-]/g, '');

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName || 'cover-letter'}.pdf"`,
      'Cache-Control': 'no-cache',
    },
  });
});

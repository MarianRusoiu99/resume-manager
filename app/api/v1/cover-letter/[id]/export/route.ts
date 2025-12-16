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
import { createApiHandler } from '@/lib/api-handler';
import { coverLetterService } from '@/lib/services/cover-letter.service';
import type { Resume } from '@/lib/validations/jsonresume';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { PDF_CONFIG } from '@/lib/utils/pdf-renderer';
import puppeteer, { type Browser } from 'puppeteer';

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

  const resume = {
    basics: {
      name: coverLetter.jobTitle || 'Cover Letter',
    },
    coverLetterHtml: markdownishToHtml(coverLetter.content),
  } as Resume & { coverLetterHtml: string };

  const html = renderCompleteDocument(COVER_LETTER_HTML_TEMPLATE, COVER_LETTER_CSS, resume as Resume);

  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf(PDF_CONFIG);

    const safeName = (coverLetter.jobTitle || coverLetter.companyName || 'cover-letter')
      .replaceAll(/\s+/g, '_')
      .replaceAll(/[^a-zA-Z0-9_\-]/g, '');

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName || 'cover-letter'}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

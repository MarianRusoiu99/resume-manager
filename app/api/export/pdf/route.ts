/**
 * Universal PDF Export API
 * POST /api/export/pdf
 * Generates PDF from any resume data and template
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-handler';
import { chromium } from 'playwright';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { PDF_CONFIG } from '@/lib/utils/pdf-renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import { z } from 'zod';

// Request schema validation
const exportRequestSchema = z.object({
  resume: z.any(), // Resume data (JSON Resume format) - validated by Resume type
  template: z.object({
    htmlTemplate: z.string(),
    cssStyles: z.string(),
  }),
  fileName: z.string().optional(),
});

export const POST = createApiHandler(
  async (request, context, session, body) => {
    let browser;

    try {
      const { resume, template, fileName } = body!;

      // Render HTML using unified renderer
      const html = renderCompleteDocument(
        template.htmlTemplate,
        template.cssStyles,
        resume as Resume
      );

      // Launch browser with optimal settings
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const browserContext = await browser.newContext();
      const page = await browserContext.newPage();

      // Set content and wait for render
      await page.setContent(html, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Generate PDF with unified config
      const pdfBuffer = await page.pdf(PDF_CONFIG);

      await browser.close();

      // Generate filename from resume data or use provided name
      const resumeData = resume as Resume;
      const defaultFileName = resumeData.basics?.name?.replaceAll(/\s+/g, '_') || 'resume';
      const finalFileName = fileName || `${defaultFileName}.pdf`;

      // Return PDF with proper headers
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${finalFileName}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } finally {
      // Ensure browser cleanup
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  },
  { bodySchema: exportRequestSchema }
);

/**
 * Universal PDF Export API
 * POST /api/export/pdf
 * Generates PDF from any resume data and template
 */

import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

import { createApiHandler } from '@/lib/api-handler';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { PDF_CONFIG } from '@/lib/utils/pdf-renderer';
import { resumeSchema, type Resume } from '@/lib/validations/jsonresume';
import { z } from 'zod';

// Request schema validation
const exportRequestSchema = z.object({
  resume: z.unknown(),
  template: z.object({
    htmlTemplate: z.string(),
    cssStyles: z.string(),
  }),
  fileName: z.string().optional(),
});

export const POST = createApiHandler(
  async (_request, _context, _session, body) => {
    let browser;

    try {
      const { resume, template, fileName } = body!;

      const parsedResume = resumeSchema.parse(resume) as Resume;

      // Render HTML using unified renderer (renderer sanitizes template HTML/CSS)
      const html = renderCompleteDocument(
        template.htmlTemplate,
        template.cssStyles,
        parsedResume
      );

      // Launch browser with optimal settings
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Block all network requests during rendering to prevent SSRF/external loads.
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (url.startsWith('data:') || url.startsWith('about:')) {
          req.continue();
          return;
        }

        // The HTML is provided via setContent; its base URL is typically about:blank.
        // Deny any attempted external fetches.
        req.abort();
      });

      // Set content and wait for render
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfBuffer = await page.pdf(PDF_CONFIG);

      await browser.close();

      // Generate filename from resume data or use provided name
      const defaultFileName = parsedResume.basics?.name?.replaceAll(/\s+/g, '_') || 'resume';
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
        await browser.close().catch(() => { });
      }
    }
  },
  { bodySchema: exportRequestSchema }
);

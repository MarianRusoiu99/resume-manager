/**
 * PDF Generation API
 * POST /api/templates/generate-pdf
 * Generates PDF from HTML using Playwright
 */

import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { resumeSchema } from '@/lib/validations/jsonresume';

export async function POST(req: Request) {
  let browser;
  
  try {
    const body = await req.json();
    const { templateHtml, templateCss, resumeData } = body;

    // Validate inputs
    if (!templateHtml || !templateCss || !resumeData) {
      return NextResponse.json(
        { error: 'Missing required fields: templateHtml, templateCss, resumeData' },
        { status: 400 }
      );
    }

    // Validate resume data
    const validatedResume = resumeSchema.parse(resumeData);

    // Render the HTML
    const html = renderCompleteDocument(templateHtml, templateCss, validatedResume);

    // Launch browser
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Set content and wait for it to be ready
    await page.setContent(html, {
      waitUntil: 'networkidle',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });

    await browser.close();

    // Return PDF as blob
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

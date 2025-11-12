/**
 * Generic Resume PDF Export API
 * POST /api/export-resume
 * Downloads resume as PDF using provided data and template (supports multi-page PDFs)
 * Works with any resume data source (profiles, resumes, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { chromium } from 'playwright';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import type { Resume } from '@/lib/validations/jsonresume';

export async function POST(req: NextRequest) {
  let browser;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resumeData, templateId, filename } = body as {
      resumeData: Resume;
      templateId?: string | null;
      filename?: string;
    };

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      );
    }

    // Get template (use provided or get default)
    let template;
    
    if (templateId) {
      template = await prisma.resumeTemplate.findUnique({
        where: { id: templateId },
      });
    }
    
    if (!template) {
      // Get first available public template as fallback
      template = await prisma.resumeTemplate.findFirst({
        where: { isPublic: true },
        orderBy: { createdAt: 'asc' },
      });
      
      if (!template) {
        return NextResponse.json(
          { error: 'No template available' },
          { status: 500 }
        );
      }
    }

    // Render HTML
    const html = renderCompleteDocument(
      template.htmlTemplate,
      template.cssStyles,
      resumeData
    );

    // Launch browser
    browser = await chromium.launch({ headless: true });
    const browserContext = await browser.newContext();
    const page = await browserContext.newPage();

    // Set content and generate PDF
    await page.setContent(html, { waitUntil: 'networkidle' });

    // Generate multi-page PDF with proper formatting
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      // Allow content to flow across multiple pages naturally
      preferCSSPageSize: false,
    });

    await browser.close();

    // Generate filename
    const pdfFilename = filename || `resume-${resumeData.basics?.name || 'download'}.pdf`;
    const sanitizedFilename = pdfFilename.replaceAll(/[^a-z0-9.-]/gi, '_');

    // Return PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
      },
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    );
  }
}

/**
 * Resume PDF Export API
 * POST /api/resumes/[id]/export
 * Downloads resume as PDF using HTML template (supports multi-page PDFs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { chromium } from 'playwright';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import type { Resume } from '@/lib/validations/jsonresume';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let browser;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch resume with template
    const resume = await prisma.generatedResume.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get template (use default if none selected)
    let template = resume.template;
    
    if (!template) {
      // Get first available template as fallback
      template = await prisma.resumeTemplate.findFirst({
        where: { isPublic: true },
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
      resume.resume as Resume
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

    // Return PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${id}.pdf"`,
      },
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    console.error('Resume PDF export error:', error);
    return NextResponse.json(
      {
        error: 'Failed to export PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

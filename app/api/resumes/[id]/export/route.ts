import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { resumeService } from '@/lib/services/resume.service';
import { pdfService } from '@/lib/services/pdf.service';

// Type for resume content structure
interface ResumeContent {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    links?: string[];
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string | null;
    description: string;
    bulletPoints: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string | null;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
}

/**
 * POST /api/resumes/[id]/export - Generate and download PDF for a resume
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Get resume (with ownership verification)
    const resume = await resumeService.getResume(id, session.user.id);

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Generate PDF buffer with template and customization if available
    const pdfBuffer = await pdfService.generatePDFBuffer(
      resume.content as unknown as ResumeContent,
      resume.templateId || undefined,
      resume.templateCustomization as Record<string, unknown> | undefined
    );

    // Set headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="resume-${id}.pdf"`);

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error exporting PDF:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to export PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resumes/[id]/export - Get or generate PDF URL for a resume
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Get resume (with ownership verification)
    const resume = await resumeService.getResume(id, session.user.id);

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Check if PDF already exists
    if (resume.pdfUrl) {
      return NextResponse.json({
        success: true,
        pdfUrl: resume.pdfUrl,
      });
    }

    // Generate new PDF and save URL with template and customization if available
    const pdfUrl = await pdfService.generatePDF(
      id,
      resume.content as unknown as ResumeContent,
      resume.templateId || undefined,
      resume.templateCustomization as Record<string, unknown> | undefined
    );

    // Update resume with PDF URL
    await resumeService.updatePdfUrl(id, session.user.id, pdfUrl);

    return NextResponse.json({
      success: true,
      pdfUrl,
    });

  } catch (error) {
    console.error('Error generating PDF URL:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { resumeService } from '@/lib/services/resume.service';
import { pdfService } from '@/lib/services/pdf.service';

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
 * GET /api/resumes/:id/preview
 * Preview PDF in browser (inline display)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch resume with ownership verification
    const resume = await resumeService.getResume(id, session.user.id);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Generate PDF buffer with template, customization, and section order if available
    const pdfBuffer = await pdfService.generatePDFBuffer(
      resume.content as unknown as ResumeContent,
      resume.templateId || undefined,
      resume.templateCustomization as Record<string, unknown> | undefined,
      resume.sectionOrder as string[] | undefined
    );

    // Return PDF for inline display
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="resume-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF preview' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { resumeService } from '@/lib/services/resume.service';


interface ResumeContent {
  personalInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

/**
 * POST /api/resumes/:id/export-cover-letter
 * Export cover letter as PDF
 */
export async function POST(
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

    // Check if cover letter exists
    if (!resume.coverLetter) {
      return NextResponse.json(
        { error: 'This resume does not have a cover letter' },
        { status: 400 }
      );
    }

    // Parse content
    const content = resume.content as unknown as ResumeContent;

    // Extract contact information
    const candidateName = `${content.personalInfo?.firstName || ''} ${
      content.personalInfo?.lastName || ''
    }`.trim() || 'Candidate';
    const candidateEmail = content.personalInfo?.email || '';
    const candidatePhone = content.personalInfo?.phone;

    // Generate PDF
    const pdfBuffer = await pdfService.generateCoverLetterBuffer(
      resume.coverLetter,
      candidateName,
      candidateEmail,
      candidatePhone,
      resume.jobTitle,
      resume.companyName || 'Company'
    );

    // Return PDF as download
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cover-letter-${resume.jobTitle.replace(
          /[^a-z0-9]/gi,
          '-'
        )}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating cover letter PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter PDF' },
      { status: 500 }
    );
  }
}

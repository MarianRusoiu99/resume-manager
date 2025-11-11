import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { profileRepository } from "@/lib/repositories/profile.repository";
import { PDFDocument } from "pdf-lib";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Export profile as PDF
 * POST /api/profiles/[id]/export-pdf
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { resume } = body;    // Verify ownership
    const profile = await profileRepository.findById(id, session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // TODO: Implement actual PDF generation with template
    // For now, return a simple PDF with the resume data
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    const { height } = page.getSize();
    const fontSize = 12;
    
    // Add basic text (this is a placeholder - you should use a proper PDF template)
    page.drawText(resume.basics?.name || "Resume", {
      x: 50,
      y: height - 50,
      size: 20,
    });

    page.drawText(resume.basics?.email || "", {
      x: 50,
      y: height - 80,
      size: fontSize,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${profile.name || "resume"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    return NextResponse.json(
      { error: "Failed to export PDF" },
      { status: 500 }
    );
  }
}

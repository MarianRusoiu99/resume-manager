import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api/handler";
import { profileRepository } from "@/lib/repositories/profile.repository";
import { resumeSchema } from "@/lib/validations/jsonresume";
import { PDFDocument } from "pdf-lib";
import { z } from "zod";

const exportProfilePdfBodySchema = z.object({
  resume: resumeSchema,
});

/**
 * Export profile as PDF
 * POST /api/profile/[id]/export-pdf
 */
export const POST = createApiHandler(
  async (_request, { params }, session, body) => {
    const { id } = await params;
    const resume = body?.resume;

    if (!resume) {
      return NextResponse.json({ error: "Missing resume" }, { status: 400 });
    }

    // Verify ownership
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
  },
  { bodySchema: exportProfilePdfBodySchema }
);


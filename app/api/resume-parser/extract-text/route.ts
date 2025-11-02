import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

/**
 * Extract text from PDF, DOCX, or TXT files
 * POST /api/resume-parser/extract-text
 * 
 * Note: This requires installing dependencies:
 * - pdf-parse: npm install pdf-parse
 * - mammoth (for DOCX): npm install mammoth
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileType = file.type;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let text = "";

    // Extract text based on file type
    if (fileType === "application/pdf") {
      // Parse PDF - requires: npm install pdf-parse
      try {
        // @ts-expect-error - pdf-parse doesn't have proper ESM support
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        text = data.text;
      } catch {
        return NextResponse.json(
          { error: "PDF parsing requires 'pdf-parse' package. Install: npm install pdf-parse" },
          { status: 500 }
        );
      }
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      // For DOCX - requires: npm install mammoth
      try {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        return NextResponse.json(
          { error: "DOCX parsing requires 'mammoth' package. Install: npm install mammoth" },
          { status: 500 }
        );
      }
    } else if (fileType === "text/plain" || file.name.endsWith(".txt")) {
      // Plain text
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT files." },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from file" },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error extracting text:", error);
    return NextResponse.json(
      { error: "Failed to extract text from file" },
      { status: 500 }
    );
  }
}

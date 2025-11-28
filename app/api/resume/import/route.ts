/**
 * Resume Import API Route
 * Handles file uploads (PDF, Image, Word) and triggers AI extraction
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { parseResumeFromText, parseResumeFromImage } from "@/lib/ai/resume-parser";
import mammoth from "mammoth";
import { PDFDocument } from "pdf-lib";

// Extract text from PDF using pdf-lib
const parsePdf = async (buffer: Buffer): Promise<string> => {
    try {
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();

        // For now, we'll extract text by getting the content streams
        // Note: pdf-lib doesn't have built-in text extraction, so we'll use a simpler approach
        // We'll just send the raw PDF to the AI which can handle it
        const text = `PDF with ${pages.length} pages. Content will be extracted by AI.`;

        // Convert buffer to base64 for AI processing
        const base64 = buffer.toString('base64');
        return base64;
    } catch (error) {
        console.error("PDF parsing error:", error);
        throw new Error("Failed to parse PDF file");
    }
};

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const fileType = formData.get("fileType") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size must be less than 10MB" },
                { status: 400 }
            );
        }

        let resumeData;

        if (fileType === "pdf") {
            // For PDFs, we'll treat them as images and use Vision API
            // This is more reliable than text extraction
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString("base64");

            // Use Vision API to extract from PDF (treating it as an image)
            resumeData = await parseResumeFromImage(base64, "application/pdf");
        } else if (fileType === "image") {
            // Parse Image using Vision API
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            resumeData = await parseResumeFromImage(base64, file.type);
        } else if (fileType === "word") {
            // Parse Word document
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await mammoth.extractRawText({ buffer });
            resumeData = await parseResumeFromText(result.value);
        } else {
            return NextResponse.json(
                { error: "Unsupported file type" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            resume: resumeData,
        });
    } catch (error) {
        console.error("Resume import error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to import resume",
            },
            { status: 500 }
        );
    }
}

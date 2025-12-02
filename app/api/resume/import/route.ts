/**
 * Resume Import API Route
 * Handles file uploads (PDF, Image, Word) and triggers AI extraction
 */

import { NextResponse } from "next/server";
import { parseResumeFromText, parseResumeFromImage } from "@/lib/ai/resume-parser";
import mammoth from "mammoth";
import { createApiHandler } from "@/lib/api-handler";

export const POST = createApiHandler(async (request, context, session) => {
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
});

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { PDFParse } from "pdf-parse";
import path from "path";

/**
 * Extract text from PDF, DOCX, or TXT files
 * POST /api/resume-parser/extract-text
 * 
 * Note: This requires installing dependencies:
 * - pdf-parse: npm install pdf-parse
 * - mammoth (for DOCX): npm install mammoth
 */

// Set the worker source to the pdfjs-dist worker file
// This needs to be done once, outside the handler
const workerPath = path.join(
  process.cwd(),
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.min.mjs"
);
PDFParse.setWorker(workerPath);

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

    // Convert file to Uint8Array (pdf-parse requires this, not Buffer)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let text = "";

    // Extract text based on file type
    if (fileType === "application/pdf") {
      // Parse PDF using pdf-parse module
      try {
        console.log("[PDF-PARSE] Parsing PDF file, size:", uint8Array.length);
        
        // Configure PDFParse to work in Node.js environment
        const pdfParser = new PDFParse({
          data: uint8Array,
          useWorkerFetch: false,
          isEvalSupported: false,
          verbosity: 0,
        });
        const textResult = await pdfParser.getText();
        
        console.log("[PDF-PARSE] Successfully extracted text, length:", textResult.text?.length);
        text = textResult.text;
      } catch (error) {
        console.error("PDF parsing error:", error);
        return NextResponse.json(
          { 
            error: "Failed to parse PDF file", 
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    } else if (fileType === "text/plain" || file.name.endsWith(".txt")) {
      // Plain text - convert Uint8Array to string
      const decoder = new TextDecoder("utf-8");
      text = decoder.decode(uint8Array);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT files." },
        { status: 400 }
      );
    }

    

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error extracting text:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Detailed error:", {
      message: errorMessage,
      stack: errorStack,
      fileType: (await req.formData()).get("file") ? "file provided" : "no file"
    });
    
    return NextResponse.json(
      { 
        error: "Failed to extract text from file",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

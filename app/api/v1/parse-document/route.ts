import { createApiHandler, ApiErrors } from "@/lib/api-handler";
import { documentParserService } from "@/lib/services/document-parser/document-parser.service";
import { NextResponse } from "next/server";

export const POST = createApiHandler(async (request) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return ApiErrors.badRequest("No file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;

  const result = await documentParserService.parseDocument(buffer, mimeType);

  if (!result.success) {
    return result;
  }

  return NextResponse.json({ text: result.data });
}, {
  rateLimit: "resumeGeneration", // Parsing is expensive
});

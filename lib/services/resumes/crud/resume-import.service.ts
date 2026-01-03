import { resolveAIModelOrThrow, resolveVisionModelKey } from "@/lib/ai/runtime";
import { parseResumeFromText, parseResumeFromImage } from "@/lib/ai/agents/resume-parsing";
import mammoth from "mammoth";
import { withServiceError } from '@/lib/services/utils';
import { type ServiceResult } from '@/lib/types/service-result';

/**
 * Service for importing resumes from various file formats
 * Handles PDF, Image, and Word document parsing via AI
 */
export class ResumeImportService {
  /**
   * Import a resume from a file
   */
  async importResume(userId: string, formData: FormData): Promise<ServiceResult<{ resume: unknown }>> {
    return withServiceError('import resume', async () => {
      const fileValue = formData.get("file");
      const fileTypeValue = formData.get("fileType");

      if (!(fileValue instanceof File)) {
        throw new Error("No file provided");
      }

      if (typeof fileTypeValue !== "string" || !fileTypeValue.trim()) {
        throw new Error("No file type provided");
      }

      const file = fileValue;
      const fileType = fileTypeValue;

      const resolvedModel = await resolveAIModelOrThrow({
        userId,
        feature: 'resume',
      });

      let resumeData: unknown;

      if (fileType === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        resumeData = await parseResumeFromImage({
          imageBase64: base64,
          mimeType: "application/pdf",
          provider: resolvedModel.provider,
          modelKey: resolveVisionModelKey(resolvedModel),
        });
      } else if (fileType === "image") {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        resumeData = await parseResumeFromImage({
          imageBase64: base64,
          mimeType: file.type,
          provider: resolvedModel.provider,
          modelKey: resolveVisionModelKey(resolvedModel),
        });
      } else if (fileType === "word") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
        resumeData = await parseResumeFromText({
          text: result.value,
          provider: resolvedModel.provider,
          modelKey: resolvedModel.modelKey,
        });
      } else {
        throw new Error("Unsupported file type");
      }

      return { resume: resumeData };
    });
  }
}

export const resumeImportService = new ResumeImportService();

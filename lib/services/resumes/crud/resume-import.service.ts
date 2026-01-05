import { resolveAIModelOrThrow, resolveVisionModelKey } from "@/lib/ai/runtime";
import { ValidationError } from "@/lib/errors";
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
      const requestedModelId = formData.get("modelId");

      if (!(fileValue instanceof File)) {
        throw new TypeError("No file provided");
      }

      const file = fileValue;
      const fileType = file.type;

      const resolvedModel = await resolveAIModelOrThrow({
        userId,
        feature: 'resume',
        modelId: typeof requestedModelId === 'string' ? requestedModelId : undefined,
      });


      let resumeData: unknown;

      // Check if it's an image or PDF (which can be handled by vision models)
      if (fileType.startsWith("image/") || fileType === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        resumeData = await parseResumeFromImage({
          imageBase64: base64,
          mimeType: fileType,
          provider: resolvedModel.provider,
          modelKey: resolveVisionModelKey(resolvedModel),
        });
      } else if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileType === "application/msword" ||
        file.name.endsWith(".docx") ||
        file.name.endsWith(".doc")
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
        resumeData = await parseResumeFromText({
          text: result.value,
          provider: resolvedModel.provider,
          modelKey: resolvedModel.modelKey,
        });
      } else if (fileType === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        resumeData = await parseResumeFromText({
          text,
          provider: resolvedModel.provider,
          modelKey: resolvedModel.modelKey,
        });
      } else {
        // Fallback: try to parse as text if unknown but looks like text, 
        // or throw if it's definitely something else
        try {
          const text = await file.text();
          resumeData = await parseResumeFromText({
            text,
            provider: resolvedModel.provider,
            modelKey: resolvedModel.modelKey,
          });
        } catch {
          throw new ValidationError(`Unsupported file type: ${fileType}`);
        }
      }

      return { resume: resumeData };
    });
  }

}

export const resumeImportService = new ResumeImportService();

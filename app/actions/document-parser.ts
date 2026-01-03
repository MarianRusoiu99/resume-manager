'use server';

import { documentParserService } from "@/lib/services/document-parser/document-parser.service";
import { withServerAction } from "@/lib/actions/with-server-action";

export const parseDocumentAction = withServerAction(
  'parseDocument',
  async (_session, formData: FormData) => {
    const file = formData.get("file") as Blob | null;
    
    if (!file) {
      return { success: false, error: "No file provided", code: "VALIDATION_ERROR" as const };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;

    const result = await documentParserService.parseDocument(buffer, mimeType);
    
    if (!result.success) {
      return result;
    }

    return { success: true, data: { text: result.data } };
  }
);

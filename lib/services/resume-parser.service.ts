import { Resume } from "@/lib/validations/jsonresume";

/**
 * Resume Parser Service
 * Extracts structured JSON Resume data from uploaded resume files (PDF, DOCX, TXT)
 * using AI-powered text analysis
 */

export interface ParserOptions {
  model?: string;
  overwrite?: boolean;
  existingResume?: Resume;
}

export interface ParserResult {
  success: boolean;
  resume?: Resume;
  error?: string;
  tokensUsed?: number;
  warning?: string;
  validationErrors?: Array<{ path: string; message: string }>;
}

/**
 * Extract text from different file formats
 */
async function extractText(file: File): Promise<string> {
  const fileType = file.type;
  
  // For text files, read directly
  if (fileType === "text/plain" || file.name.endsWith(".txt")) {
    return await file.text();
  }
  
  // For PDF and DOCX, we need server-side processing
  // This returns the raw text that needs to be sent to the backend
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch("/api/resume-parser/extract-text", {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to extract text: ${response.statusText}`);
  }
  
  const { text } = await response.json();
  return text;
}

/**
 * Parse resume text using AI
 * Note: API key is fetched server-side for security
 */
async function parseWithAI(text: string, model: string): Promise<ParserResult> {
  try {
    const response = await fetch("/api/resume-parser/parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to parse resume",
      };
    }
    
    const result = await response.json();
    
    // The API now validates against JSON Resume schema AFTER AI fills the template
    // We accept the result even if there are validation warnings
    // The schema validation happens server-side as the final step
    
    return {
      success: true,
      resume: result.resume,
      tokensUsed: result.tokensUsed,
      warning: result.warning,
      validationErrors: result.validationErrors,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Main function to parse a resume file
 * Note: API key is fetched server-side for security
 */
export async function parseResume(
  file: File,
  options?: ParserOptions
): Promise<ParserResult> {
  try {
    const model = options?.model || "gpt-4o-mini";
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "File size exceeds 10MB limit",
      };
    }
    
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    
    const allowedExtensions = [".pdf", ".docx", ".doc", ".txt"];
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return {
        success: false,
        error: "Unsupported file type. Please upload PDF, DOCX, or TXT files.",
      };
    }
    
    // Extract text from file
    const text = await extractText(file);
    
    // Parse with AI
    const result = await parseWithAI(text, model);
    
    // If successful and we have existing resume data, merge them
    if (result.success && result.resume && options?.existingResume) {
      result.resume = mergeResumeData(
        options.existingResume,
        result.resume,
        options
      );
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse resume",
    };
  }
}

/**
 * Merge parsed resume with existing profile data
 * This allows users to keep some existing data while adding parsed data
 */
export function mergeResumeData(
  existing: Resume | undefined,
  parsed: Resume,
  options?: {
    overwrite?: boolean; // If true, replace existing data. If false, only fill empty fields
  }
): Resume {
  const overwrite = options?.overwrite ?? false;
  
  if (!existing || overwrite) {
    return parsed;
  }
  
  // Merge strategy: keep existing data, only add new data for empty fields
  return {
    ...parsed,
    basics: existing.basics || parsed.basics,
    work: (existing.work && existing.work.length > 0) ? existing.work : parsed.work,
    volunteer: (existing.volunteer && existing.volunteer.length > 0) ? existing.volunteer : parsed.volunteer,
    education: (existing.education && existing.education.length > 0) ? existing.education : parsed.education,
    awards: (existing.awards && existing.awards.length > 0) ? existing.awards : parsed.awards,
    certificates: (existing.certificates && existing.certificates.length > 0) ? existing.certificates : parsed.certificates,
    publications: (existing.publications && existing.publications.length > 0) ? existing.publications : parsed.publications,
    skills: (existing.skills && existing.skills.length > 0) ? existing.skills : parsed.skills,
    languages: (existing.languages && existing.languages.length > 0) ? existing.languages : parsed.languages,
    interests: (existing.interests && existing.interests.length > 0) ? existing.interests : parsed.interests,
    references: (existing.references && existing.references.length > 0) ? existing.references : parsed.references,
    projects: (existing.projects && existing.projects.length > 0) ? existing.projects : parsed.projects,
  };
}

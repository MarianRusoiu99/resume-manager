/**
 * Resume CRUD Service Types
 *
 * These types represent the response shapes used by the CRUD layer.
 */

/**
 * Resume list item
 */
export interface ResumeListItem {
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string;
  content: Record<string, unknown>;
  templateId: string | null;
  metadata: {
    generatedAt: string;
    model: string;
    totalTokens: number;
    processingTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detailed resume data
 */
export interface ResumeDetails {
  id: string;
  jobDescription: string;
  jobMetadata: Record<string, unknown>;
  jobTitle: string;
  companyName: string | null;
  content: Record<string, unknown>;
  metadata: {
    generatedAt: string;
    model: string;
    totalTokens: number;
    processingTime: number;
  };
  templateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Updated resume data
 */
export interface UpdatedResumeData {
  id: string;
  resume: unknown;
  jobDescription: string;
  jobMetadata: unknown;
  template: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

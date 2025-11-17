/**
 * Shared Resume Cache Instance
 * Ensures cache consistency across all resume API endpoints
 */

import { SimpleCache } from './simple-cache';

// Cache type for user resumes list (2 minute TTL - shorter than API keys since resumes change more frequently)
type ResumesCacheData = Array<{
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string;
  content: Record<string, unknown>;
  templateId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}>;

// Export a single shared instance
export const resumesCache = new SimpleCache<ResumesCacheData>(120);

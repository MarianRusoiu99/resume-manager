import type { Resume } from '@/lib/validations/jsonresume';
import type { ContentType } from '@/lib/validations/settings';
import type { ServiceResult } from '@/lib/types';

export interface EnhanceTextInput {
  content: string;
  instructions: string;
  context?: string;
  contentType: ContentType;
  modelId?: string;
  attachments?: Array<{
    type: string;
    content: string;
    name: string;
  }>;
}

export interface EnhanceTextResult {
  enhancedContent: string;
  metadata: {
    model: string;
    provider: string;
    contentType: ContentType;
  };
}

export interface OptimizeResumeInput {
  jobDescription: string;
  userResume: Resume;
  modelId?: string;
}

export interface OptimizeResumeResult {
  resume: Resume;
  jobTitle: string;
  companyName: string;
}

export interface GenerateCoverLetterInput {
  jobDescription: string;
  userResume: Resume;
  modelId?: string;
}

export interface GenerateCoverLetterResult {
  content: string;
  subject?: string;
  jobTitle?: string;
  companyName?: string;
  recipientName?: string;
}

export interface IAIService {
  enhanceText(userId: string, input: EnhanceTextInput): Promise<ServiceResult<EnhanceTextResult>>;
  optimizeResume(userId: string, input: OptimizeResumeInput): Promise<ServiceResult<OptimizeResumeResult>>;
  generateCoverLetter(userId: string, input: GenerateCoverLetterInput): Promise<ServiceResult<GenerateCoverLetterResult>>;
}

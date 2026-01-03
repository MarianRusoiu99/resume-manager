import type { ContentType } from '@/lib/validations/settings';

export type ConversationMode =
  | 'resume-generation'
  | 'resume-enhancement'
  | 'cover-letter-generation'
  | 'template-generation'
  | 'template-enhancement'
  | 'text-enhancement';

export interface TextEnhancementOptions {
  content: string;
  instructions: string;
  context?: string;
  contentType?: ContentType;
  modelId?: string;
  attachments?: Array<{
    type: string;
    content: string;
    name: string;
  }>;
}

export interface TemplateEnhancementOptions {
  html: string;
  instructions: string;
  context?: string;
}

export interface EnhancementResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface UseAIEnhancementReturn<T> {
  enhancedContent: T | null;
  isLoading: boolean;
  error: string | null;
  enhance: (attachments?: any[], overrideModelId?: string) => Promise<void>;
  reset: () => void;
  hasEnhancement: boolean;
}

/**
 * AI Enhancement Types
 * 
 * Shared types for AI enhancement components and hooks.
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { ContentType } from '@/lib/validations/settings';

/**
 * File attachment for AI context
 */
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  /** Preview URL for images */
  previewUrl?: string;
}

/**
 * Enhancement history entry for undo/comparison
 */
export interface EnhancementHistoryEntry {
  id: string;
  timestamp: Date;
  instructions: string;
  originalContent: string;
  enhancedContent: string;
  model?: string;
  provider?: string;
}

/**
 * Quick instruction preset
 */
export interface InstructionPreset {
  label: string;
  value: string;
  icon?: string;
}

/**
 * Common presets for text enhancement
 */
export const TEXT_PRESETS: InstructionPreset[] = [
  { label: 'Professional', value: 'Make this more professional and polished' },
  { label: 'Concise', value: 'Make this more concise without losing key information' },
  { label: 'Grammar', value: 'Fix grammar, spelling, and punctuation errors' },
  { label: 'Impactful', value: 'Make this more impactful and compelling' },
  { label: 'ATS-Friendly', value: 'Optimize for ATS (Applicant Tracking Systems) while keeping it readable' },
];

/**
 * Presets for resume enhancement
 */
export const RESUME_PRESETS: InstructionPreset[] = [
  { label: 'More Impactful', value: 'Make achievements and responsibilities more impactful with quantifiable results' },
  { label: 'Senior Role', value: 'Tailor content for a senior-level position, emphasizing leadership and strategic thinking' },
  { label: 'Technical', value: 'Highlight technical skills and projects with more specific technologies' },
  { label: 'ATS Optimize', value: 'Optimize for ATS systems while maintaining readability' },
  { label: 'Action Verbs', value: 'Start bullet points with strong action verbs' },
];

/**
 * Preview mode for comparison
 */
export type PreviewMode = 'original' | 'enhanced' | 'diff';

/**
 * Base props for AI enhancement modals
 */
export interface AIEnhanceBaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Show model selector */
  showModelSelector?: boolean;
}

/**
 * Props for text enhancement modal
 */
export interface AIEnhanceTextModalProps extends AIEnhanceBaseModalProps {
  originalContent: string;
  onAccept: (enhancedContent: string) => void;
  contentType?: ContentType;
  context?: string;
}

/**
 * Props for resume enhancement modal
 */
export interface AIEnhanceResumeModalProps extends AIEnhanceBaseModalProps {
  resume: Resume;
  onAccept: (enhancedResume: Resume) => void;
  /** Optional profile ID for live preview */
  profileId?: string;
  /** Optional template ID for preview */
  templateId?: string | null;
}

/**
 * State for the enhancement process
 */
export interface EnhancementState {
  instructions: string;
  enhancedContent: string;
  isLoading: boolean;
  error: string | null;
  attachments: FileAttachment[];
}

/**
 * Result from enhancement API
 */
export interface EnhancementResult {
  success: boolean;
  enhancedContent: string;
  metadata?: {
    model: string;
    provider: string;
    contentType: ContentType;
  };
}

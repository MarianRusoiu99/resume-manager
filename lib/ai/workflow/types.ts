import { BaseMessage } from '@langchain/core/messages';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * State interface for resume generation workflow
 * This tracks all data through the agent pipeline
 */
export interface ResumeGenerationState {
  // Input data
  jobDescription: string;
  userResume: Resume;
  personalInstructions?: string; // Optional custom instructions for cover letter
  includeCoverLetter?: boolean; // Whether to generate cover letter

  // Job analysis results (includes extracted jobTitle and companyName)
  jobAnalysis?: {
    jobTitle: string;
    companyName: string;
    requirements: {
      required: string[];
      preferred: string[];
    };
    keywords: string[];
    atsKeywords: string[];
    jobSummary: string;
    keyResponsibilities: string[];
  };

  // Profile matching results
  profileMatch?: {
    relevanceScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    experienceMatch: number;
    recommendations: string[];
  };

  // Optimized resume
  optimizedResume?: Resume;

  // Format validation results
  formatValidation?: {
    atsCompliant: boolean;
    issues: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
      location?: string;
    }>;
    recommendations: string[];
  };

  // Final output
  generatedResume?: Resume;

  // Cover letter (optional)
  coverLetter?: {
    content: string;
    structure: {
      opening: string;
      body: string[];
      closing: string;
    };
    tone: string;
    wordCount: number;
  };

  // Workflow metadata
  messages: BaseMessage[];
  currentStep?: string;
  errors: string[];
  tokensUsed: number;
}

/**
 * Options for resume generation
 */
export interface ResumeGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  includeCoverLetter?: boolean;
}

/**
 * Result of resume generation workflow
 */
export interface ResumeGenerationResult {
  success: boolean;
  resume?: ResumeGenerationState['generatedResume'];
  coverLetter?: ResumeGenerationState['coverLetter'];
  errors?: string[];
  tokensUsed: number;
  duration: number;
}

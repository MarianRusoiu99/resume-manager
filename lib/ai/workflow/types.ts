import { BaseMessage } from '@langchain/core/messages';

/**
 * State interface for resume generation workflow
 * This tracks all data through the agent pipeline
 */
export interface ResumeGenerationState {
  // Input data
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  userProfile: {
    personalInfo: {
      name: string;
      email: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      github?: string;
      website?: string;
    };
    summary?: string;
    experience: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description: string;
    }>;
    education: Array<{
      school: string;
      degree: string;
      field: string;
      gpa?: string;
      startDate: string;
      endDate?: string;
      description?: string;
    }>;
    skills: {
      technical: string[];
      soft: string[];
      languages: string[];
    };
  };

  // Job analysis results
  jobAnalysis?: {
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

  // Optimized content
  optimizedContent?: {
    summary: string;
    experience: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description: string;
      bulletPoints: string[];
    }>;
    prioritizedSkills: string[];
  };

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
  generatedResume?: {
    personalInfo: {
      name: string;
      email: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      github?: string;
      website?: string;
    };
    summary: string;
    experience: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description: string;
      bulletPoints: string[];
    }>;
    education: Array<{
      school: string;
      degree: string;
      field: string;
      gpa?: string;
      startDate: string;
      endDate?: string;
      description?: string;
    }>;
    skills: string[];
    metadata: {
      generatedAt: string;
      modelUsed: string;
      tokensUsed: number;
      jobTitle?: string;
      companyName?: string;
    };
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
  errors?: string[];
  tokensUsed: number;
  duration: number;
}

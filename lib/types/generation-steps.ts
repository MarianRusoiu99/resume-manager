/**
 * Resume Generation Steps
 * 
 * Type-safe step identifiers for resume generation progress tracking.
 * Used with progress callbacks to provide consistent UI updates.
 */

/**
 * Generation step identifiers
 */
export const GenerationStep = {
  /** Initial setup */
  INIT: 'init',
  /** Loading user profile data */
  PROFILE: 'profile',
  /** Starting AI workflow */
  WORKFLOW: 'workflow',
  /** Analyzing job description */
  JOB_ANALYSIS: 'job-analysis',
  /** Matching profile to job requirements */
  PROFILE_MATCHING: 'profile-matching',
  /** Optimizing resume content */
  CONTENT_OPTIMIZATION: 'content-optimization',
  /** Validating ATS compatibility */
  FORMAT_VALIDATION: 'format-validation',
  /** Generating final resume */
  OUTPUT_GENERATION: 'output-generation',
  /** Saving to database */
  SAVE: 'save',
  /** Generation complete */
  COMPLETE: 'complete',
  /** Error occurred */
  ERROR: 'error',
} as const;

export type GenerationStep = (typeof GenerationStep)[keyof typeof GenerationStep];

/**
 * Step configuration with default progress values and messages
 */
export interface StepConfig {
  step: GenerationStep;
  message: string;
  progress: number;
}

/**
 * Default step configurations for resume generation
 */
export const defaultStepConfigs: StepConfig[] = [
  { step: GenerationStep.INIT, message: 'Initializing resume generation...', progress: 0 },
  { step: GenerationStep.PROFILE, message: 'Loading your profile data...', progress: 5 },
  { step: GenerationStep.WORKFLOW, message: 'Starting AI workflow...', progress: 15 },
  { step: GenerationStep.JOB_ANALYSIS, message: 'Analyzing job description...', progress: 20 },
  { step: GenerationStep.PROFILE_MATCHING, message: 'Matching your profile to job requirements...', progress: 40 },
  { step: GenerationStep.CONTENT_OPTIMIZATION, message: 'Optimizing resume content...', progress: 60 },
  { step: GenerationStep.FORMAT_VALIDATION, message: 'Validating ATS compatibility...', progress: 75 },
  { step: GenerationStep.OUTPUT_GENERATION, message: 'Generating final resume...', progress: 85 },
  { step: GenerationStep.SAVE, message: 'Saving resume to database...', progress: 95 },
  { step: GenerationStep.COMPLETE, message: 'Resume generated successfully!', progress: 100 },
];

/**
 * Get step configuration by step ID
 */
export function getStepConfig(step: GenerationStep): StepConfig | undefined {
  return defaultStepConfigs.find(config => config.step === step);
}

/**
 * Create a progress update for a step
 */
export function createProgressUpdate(step: GenerationStep, customMessage?: string): StepConfig {
  const config = getStepConfig(step);
  if (config) {
    return customMessage ? { ...config, message: customMessage } : config;
  }
  return { step, message: customMessage || 'Processing...', progress: 50 };
}

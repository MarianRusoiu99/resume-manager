/**
 * Predefined Workflow Configurations
 * 
 * Ready-to-use workflow configurations for common use cases
 */

import type { WorkflowConfig } from './types';
import {
  optimizeResumeStep,
  generateCoverLetterStep,
  validateResumeStep,
} from './steps';

/**
 * Resume Generation Workflow
 * 
 * Optimizes a resume for a target job
 */
export const resumeGenerationWorkflow: WorkflowConfig = {
  name: 'Resume Generation',
  description: 'Optimize your resume for a specific job application',
  steps: [
    optimizeResumeStep,
    validateResumeStep,
  ],
};

/**
 * Cover Letter Generation Workflow
 * 
 * Generates a cover letter for a job application
 */
export const coverLetterWorkflow: WorkflowConfig = {
  name: 'Cover Letter Generation',
  description: 'Generate a personalized cover letter for a job application',
  steps: [
    generateCoverLetterStep,
  ],
};

/**
 * Full Application Workflow
 * 
 * Generates both resume and cover letter
 */
export const fullApplicationWorkflow: WorkflowConfig = {
  name: 'Full Application',
  description: 'Generate optimized resume and cover letter for a job application',
  steps: [
    {
      ...optimizeResumeStep,
      progressStart: 10,
      progressEnd: 50,
    },
    {
      ...validateResumeStep,
      progressStart: 50,
      progressEnd: 55,
    },
    {
      ...generateCoverLetterStep,
      progressStart: 55,
      progressEnd: 90,
    },
  ],
};

/**
 * Get workflow by name
 */
export function getWorkflow(name: 'resume' | 'cover-letter' | 'full'): WorkflowConfig {
  switch (name) {
    case 'resume':
      return resumeGenerationWorkflow;
    case 'cover-letter':
      return coverLetterWorkflow;
    case 'full':
      return fullApplicationWorkflow;
    default:
      return resumeGenerationWorkflow;
  }
}

/**
 * Create a custom workflow from step IDs
 */
export async function createCustomWorkflow(
  name: string,
  description: string,
  stepIds: string[]
): Promise<WorkflowConfig> {
  const { availableSteps } = await import('./steps');
  
  const steps = stepIds
    .map((id, index) => {
      const step = availableSteps[id as keyof typeof availableSteps];
      if (!step) return null;
      
      // Calculate progress distribution
      const progressPerStep = 80 / stepIds.length;
      return {
        ...step,
        progressStart: 10 + (index * progressPerStep),
        progressEnd: 10 + ((index + 1) * progressPerStep),
      };
    })
    .filter(Boolean);

  return {
    name,
    description,
    steps: steps as WorkflowConfig['steps'],
  };
}

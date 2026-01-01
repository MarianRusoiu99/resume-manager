import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';

import type { IResumeGenerationService } from '../../interfaces';

import type { GenerateResumeServiceInput, GenerateResumeWithProgressInput } from './types';
import {
  runResumeGenerationWorkflow,
  runResumeGenerationWorkflowWithProgress,
  runStandaloneCoverLetterWorkflow,
} from './resume-generation.workflow';

/**
 * Service for resume generation using AI.
 * Single Responsibility: Exposes resume generation operations.
 */
export class ResumeGenerationService implements IResumeGenerationService {
  constructor(private readonly repository: GeneratedResumeRepository = generatedResumeRepository) {}

  async generateResume(input: GenerateResumeServiceInput) {
    return runResumeGenerationWorkflow(this.repository, input);
  }

  async generateResumeWithProgress(input: GenerateResumeWithProgressInput) {
    return runResumeGenerationWorkflowWithProgress(this.repository, input);
  }

  async generateStandaloneCoverLetter(input: {
    userId: string;
    jobDescription: string;
    personalInstructions?: string;
    modelId?: string;
    profileId?: string;
  }) {
    return runStandaloneCoverLetterWorkflow(input);
  }
}

export const resumeGenerationService = new ResumeGenerationService();

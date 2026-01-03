import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resumes.repository';

import type { IResumeGenerationService, IProfileService } from '../../interfaces';

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
  constructor(
    private readonly repository: GeneratedResumeRepository = generatedResumeRepository,
    private readonly profileService?: IProfileService
  ) {}

  async generateResume(input: GenerateResumeServiceInput) {
    if (!this.profileService) {
      throw new Error('ProfileService is required for resume generation');
    }
    return runResumeGenerationWorkflow(this.repository, this.profileService, input);
  }

  async generateResumeWithProgress(input: GenerateResumeWithProgressInput) {
    if (!this.profileService) {
      throw new Error('ProfileService is required for resume generation');
    }
    return runResumeGenerationWorkflowWithProgress(this.repository, this.profileService, input);
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

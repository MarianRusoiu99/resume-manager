import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import { profileService as defaultProfileService } from '@/lib/services/profiles';

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
    private readonly profileService: IProfileService = defaultProfileService
  ) {}

  async generateResume(input: GenerateResumeServiceInput) {
    return runResumeGenerationWorkflow(this.repository, this.profileService, input);
  }

  async generateResumeWithProgress(input: GenerateResumeWithProgressInput) {
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

import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import { profileService as defaultProfileService } from '@/lib/services/profiles';
import { notificationService as defaultNotificationService } from '@/lib/services/notifications/notifications.service';

import type { IResumeGenerationService, IProfileService, INotificationService } from '@/lib/services/interfaces';

import type { GenerateResumeServiceInput, GenerateResumeWithProgressInput } from '@/lib/types';
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
    private readonly profileService: IProfileService = defaultProfileService,
    private readonly notificationService: INotificationService = defaultNotificationService
  ) {}

  async generateResume(input: GenerateResumeServiceInput) {
    return runResumeGenerationWorkflow(this.repository, this.profileService, this.notificationService, input);
  }

  async generateResumeWithProgress(input: GenerateResumeWithProgressInput) {
    return runResumeGenerationWorkflowWithProgress(this.repository, this.profileService, this.notificationService, input);
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

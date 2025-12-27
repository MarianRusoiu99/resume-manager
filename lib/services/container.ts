/**
 * Service Container for Dependency Injection
 * 
 * Centralizes all service instances and their dependencies.
 * This enables proper dependency injection and makes services
 * easily testable with mock implementations.
 */

import { ProfileRepository, profileRepository } from '@/lib/repositories/profile.repository';
import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { NotificationRepository, notificationRepository } from '@/lib/repositories/notification.repository';
import { ApiProviderRepository, apiProviderRepository } from '@/lib/repositories/api-provider.repository';
import { UserAISettingsRepository, userAISettingsRepository } from '@/lib/repositories/user-ai-settings.repository';
import { CoverLetterRepository, coverLetterRepository } from '@/lib/repositories/cover-letter.repository';
import { TemplateRepository, templateRepository } from '@/lib/repositories/template.repository';

import { AnalyticsService, analyticsService as analyticsServiceInstance } from './analytics/analytics.service';
import { ProfileService } from './profile/profile.service';
import { ResumeGenerationService } from './resume-generation/resume-generation.service';
import { ResumeCrudService } from './resume-crud/resume-crud.service';
import { NotificationService } from './notification/notification.service';
import { ApiProviderService } from './api-provider/api-provider.service';
import { UserAISettingsService } from './user-ai-settings/user-ai-settings.service';
import { AIService } from './ai.service';
import { TemplateService } from './template/template.service';
import { CoverLetterService } from './cover-letter.service';

import { profileCache } from '@/lib/cache/simple-cache';
import type { ICache } from '@/lib/repositories/interfaces';

/**
 * Service Container
 * 
 * Provides properly instantiated services with all dependencies injected.
 * Use this container to get service instances rather than importing singletons directly.
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  
  // Service instances - initialized in constructor
  private _profileService!: ProfileService;
  private _analyticsService!: AnalyticsService;
  private _resumeGenerationService!: ResumeGenerationService;
  private _resumeCrudService!: ResumeCrudService;
  private _notificationService!: NotificationService;
  private _apiProviderService!: ApiProviderService;
  private _userAISettingsService!: UserAISettingsService;
  private _aiService!: AIService;
  private _templateService!: TemplateService;
  private _coverLetterService!: CoverLetterService;

  private constructor() {
    this.initializeServices();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Initialize all services with their dependencies
   */
  private initializeServices(): void {
    // Core repositories
    const profileRepo = profileRepository;
    const generatedResumeRepo = generatedResumeRepository;
    const notificationRepo = notificationRepository;
    const apiProviderRepo = apiProviderRepository;
    const userAISettingsRepo = userAISettingsRepository;
    const coverLetterRepo = coverLetterRepository;
    const templateRepo = templateRepository;

    // Cache instance
    const cache = profileCache;

    // Initialize services with dependency injection
    this._profileService = new ProfileService(profileRepo, cache);
    this._analyticsService = analyticsServiceInstance;
    this._resumeGenerationService = new ResumeGenerationService(generatedResumeRepo);
    this._resumeCrudService = new ResumeCrudService(generatedResumeRepo);
    this._notificationService = new NotificationService(notificationRepo);
    this._apiProviderService = new ApiProviderService(apiProviderRepo);
    this._userAISettingsService = new UserAISettingsService(userAISettingsRepo);
    this._aiService = new AIService();
    this._templateService = new TemplateService(templateRepo);
    this._coverLetterService = new CoverLetterService(coverLetterRepo);
  }

  // Service getters
  get profileService(): ProfileService {
    return this._profileService;
  }

  get analyticsService(): AnalyticsService {
    return this._analyticsService;
  }

  get resumeGenerationService(): ResumeGenerationService {
    return this._resumeGenerationService;
  }

  get resumeCrudService(): ResumeCrudService {
    return this._resumeCrudService;
  }

  get notificationService(): NotificationService {
    return this._notificationService;
  }

  get apiProviderService(): ApiProviderService {
    return this._apiProviderService;
  }

  get userAISettingsService(): UserAISettingsService {
    return this._userAISettingsService;
  }

  get aiService(): AIService {
    return this._aiService;
  }

  get templateService(): TemplateService {
    return this._templateService;
  }

  get coverLetterService(): CoverLetterService {
    return this._coverLetterService;
  }

  /**
   * Create a test container with mock dependencies
   */
  static createTestContainer(mocks: {
    profileRepository?: ProfileRepository;
    generatedResumeRepository?: GeneratedResumeRepository;
    notificationRepository?: NotificationRepository;
    apiProviderRepository?: ApiProviderRepository;
    userAISettingsRepository?: UserAISettingsRepository;
    coverLetterRepository?: CoverLetterRepository;
    templateRepository?: TemplateRepository;
    cache?: ICache;
  }): ServiceContainer {
    const container = new ServiceContainer();
    
    // Override with mocks if provided
    if (mocks.profileRepository || mocks.cache) {
      container._profileService = new ProfileService(
        mocks.profileRepository || profileRepository,
        mocks.cache || profileCache
      );
    }
    
    if (mocks.generatedResumeRepository) {
      container._resumeGenerationService = new ResumeGenerationService(mocks.generatedResumeRepository);
      container._resumeCrudService = new ResumeCrudService(mocks.generatedResumeRepository);
    }
    
    if (mocks.notificationRepository) {
      container._notificationService = new NotificationService(mocks.notificationRepository);
    }
    
    if (mocks.apiProviderRepository) {
      container._apiProviderService = new ApiProviderService(mocks.apiProviderRepository);
    }
    
    if (mocks.userAISettingsRepository) {
      container._userAISettingsService = new UserAISettingsService(mocks.userAISettingsRepository);
    }
    
    if (mocks.coverLetterRepository) {
      container._coverLetterService = new CoverLetterService(mocks.coverLetterRepository);
    }
    
    if (mocks.templateRepository) {
      container._templateService = new TemplateService(mocks.templateRepository);
    }
    
    return container;
  }
}

/**
 * Get the service container singleton
 */
export const serviceContainer = ServiceContainer.getInstance();

/**
 * Service exports for backward compatibility
 * These delegate to the container instances
 */
export const profileService = serviceContainer.profileService;
export const analyticsService = serviceContainer.analyticsService;
export const resumeGenerationService = serviceContainer.resumeGenerationService;
export const resumeCrudService = serviceContainer.resumeCrudService;
export const notificationService = serviceContainer.notificationService;
export const apiProviderService = serviceContainer.apiProviderService;
export const userAISettingsService = serviceContainer.userAISettingsService;
export const aiService = serviceContainer.aiService;
export const templateService = serviceContainer.templateService;
export const coverLetterService = serviceContainer.coverLetterService;

// Combined resume service for backward compatibility
import { ResumeService } from './resume.service';
export const resumeService = new ResumeService(
  serviceContainer.resumeGenerationService,
  serviceContainer.resumeCrudService
);

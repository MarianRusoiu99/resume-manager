/**
 * Service Container for Dependency Injection
 * 
 * Centralizes all service instances and their dependencies.
 * This enables proper dependency injection and makes services
 * easily testable with mock implementations.
 */

import { ProfileRepository, profileRepository } from '@/lib/repositories/profiles.repository';
import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import { NotificationRepository, notificationRepository } from '@/lib/repositories/notifications.repository';
import { ApiProviderRepository, apiProviderRepository } from '@/lib/repositories/api-providers.repository';
import { UserAISettingsRepository, userAISettingsRepository } from '@/lib/repositories/ai-settings.repository';
import { CoverLetterRepository, coverLetterRepository } from '@/lib/repositories/cover-letters.repository';
import { TemplateRepository, templateRepository } from '@/lib/repositories/templates.repository';

import { AnalyticsService, analyticsService as analyticsServiceInstance } from './analytics/analytics.service';
import { ProfileService } from './profiles/profiles.service';
import { ResumeService } from './resumes/resume.service';
import { NotificationService } from './notifications/notifications.service';
import { ApiProviderService } from './api-providers/api-providers.workflow';
import { UserAISettingsService } from './ai-settings/user-ai-settings.workflow';
import { AIService, aiService as aiServiceInstance } from './ai';
import { TemplateService } from './templates/templates.workflow';
import { CoverLetterService } from './cover-letters';

import { profileCache } from '@/lib/cache/simple-cache';
import type { ICache } from '@/lib/repositories/interfaces';

import { DocumentParserService } from './document-parser/document-parser.service';

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
  private _resumeService!: ResumeService;
  private _notificationService!: NotificationService;
  private _apiProviderService!: ApiProviderService;
  private _userAISettingsService!: UserAISettingsService;
  private _aiService!: AIService;
  private _templateService!: TemplateService;
  private _coverLetterService!: CoverLetterService;
  private _documentParserService!: DocumentParserService;

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
    this._notificationService = new NotificationService(notificationRepo);
    this._resumeService = new ResumeService(generatedResumeRepo, this._profileService, this._notificationService);
    this._apiProviderService = new ApiProviderService(apiProviderRepo);
    this._userAISettingsService = new UserAISettingsService(userAISettingsRepo);
    this._aiService = aiServiceInstance;
    this._templateService = new TemplateService(templateRepo);
    this._coverLetterService = new CoverLetterService(coverLetterRepo, this._notificationService);
    this._documentParserService = new DocumentParserService();
  }

  // Service getters
  get profileService(): ProfileService {
    return this._profileService;
  }

  get analyticsService(): AnalyticsService {
    return this._analyticsService;
  }

  get resumeService(): ResumeService {
    return this._resumeService;
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

  get documentParserService(): DocumentParserService {
    return this._documentParserService;
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
      container._resumeService = new ResumeService(
        mocks.generatedResumeRepository,
        container._profileService,
        container._notificationService
      );
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

import { auditLogService as auditLogServiceInstance, auditLog as auditLogInstance } from './audit-logs';

// Service exports for backward compatibility
// These delegate to the container instances
export const profileService = serviceContainer.profileService;
export const analyticsService = serviceContainer.analyticsService;
export const resumeService = serviceContainer.resumeService;
export const notificationService = serviceContainer.notificationService;
export const apiProviderService = serviceContainer.apiProviderService;
export const userAISettingsService = serviceContainer.userAISettingsService;
export const aiService = serviceContainer.aiService;
export const templateService = serviceContainer.templateService;
export const coverLetterService = serviceContainer.coverLetterService;
export const documentParserService = serviceContainer.documentParserService;
export const auditLogService = auditLogServiceInstance;
export const auditLog = auditLogInstance;

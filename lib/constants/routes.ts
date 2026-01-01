/**
 * Application route constants
 * Centralized routing to avoid magic strings throughout the codebase
 */

/**
 * Application routes
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Profiles
  PROFILES: '/profile',
  PROFILE: (id: string) => `/profile/${id}` as const,
  PROFILE_PUBLIC: (slug: string) => `/public/${slug}` as const,
  
  // Resumes
  RESUMES: '/resumes',
  RESUME: (id: string) => `/resumes/${id}` as const,
  RESUME_EDIT: (id: string) => `/resumes/${id}/edit` as const,
  
  // Cover Letters
  COVER_LETTERS: '/cover-letters',
  COVER_LETTER: (id: string) => `/cover-letters/${id}` as const,
  
  // Templates
  TEMPLATES: '/templates',
  TEMPLATE: (id: string) => `/templates/${id}` as const,
  TEMPLATE_NEW: '/templates/new',
  
  // Generation
  GENERATE: '/generate',
  GENERATE_COVER_LETTER: '/generate?tab=cover-letter',
  
  // Settings
  SETTINGS_API_KEYS: '/settings/api-keys',
} as const;

/**
 * API endpoints
 */
import { API_V1_PREFIX } from "@/lib/api/versioning";

export const API_V1 = {
  AUTH: {
    REGISTER: `${API_V1_PREFIX}/auth/register`,
    SESSION: `${API_V1_PREFIX}/auth/session`,
  },
  PROFILE: {
    LIST: `${API_V1_PREFIX}/profile`,
    GET: (id: string) => `${API_V1_PREFIX}/profile/${id}` as const,
    DUPLICATE: (id: string) => `${API_V1_PREFIX}/profile/${id}/duplicate` as const,
    SET_DEFAULT: (id: string) => `${API_V1_PREFIX}/profile/${id}/set-default` as const,
    EXPORT_PDF: (id: string) => `${API_V1_PREFIX}/profile/${id}/export-pdf` as const,
    PUBLIC: (id: string) => `${API_V1_PREFIX}/profile/${id}/public` as const,
  },
  RESUME: {
    LIST: `${API_V1_PREFIX}/resume/generate`,
    GET: (id: string) => `${API_V1_PREFIX}/resume/${id}` as const,
    CONTENT: (id: string) => `${API_V1_PREFIX}/resume/${id}/content` as const,
    PREVIEW: (id: string) => `${API_V1_PREFIX}/resume/${id}/preview` as const,
    TEMPLATE: (id: string) => `${API_V1_PREFIX}/resume/${id}/template` as const,
    DUPLICATE: (id: string) => `${API_V1_PREFIX}/resume/${id}/duplicate` as const,
    COVER_LETTER: (id: string) => `${API_V1_PREFIX}/resume/${id}/cover-letter` as const,
    GENERATE: `${API_V1_PREFIX}/resume/generate`,
    GENERATE_STREAM: `${API_V1_PREFIX}/resume/generate-stream`,
    GENERATE_SIMPLE: `${API_V1_PREFIX}/resume/generate-simple`,
    IMPORT: `${API_V1_PREFIX}/resume/import`,
    IMPORT_TEMPLATE: `${API_V1_PREFIX}/template/import`,
  },
  COVER_LETTER: {
    LIST: `${API_V1_PREFIX}/cover-letter`,
    GET: (id: string) => `${API_V1_PREFIX}/cover-letter/${id}` as const,
    EXPORT: (id: string) => `${API_V1_PREFIX}/cover-letter/${id}/export` as const,
    GENERATE: `${API_V1_PREFIX}/cover-letter/generate`,
  },
  TEMPLATE: {
    LIST: `${API_V1_PREFIX}/template`,
    GET: (id: string) => `${API_V1_PREFIX}/template/${id}` as const,
    DUPLICATE: (id: string) => `${API_V1_PREFIX}/template/${id}/duplicate` as const,
    IMPORT: `${API_V1_PREFIX}/template/import`,
  },
  EXPORT: {
    PDF: `${API_V1_PREFIX}/export/pdf`,
  },
  SETTINGS: {
    API_PROVIDERS: `${API_V1_PREFIX}/settings/api-providers`,
    API_PROVIDER: (id: string) => `${API_V1_PREFIX}/settings/api-providers/${id}` as const,
    MODELS: `${API_V1_PREFIX}/settings/api-providers/models`,
    AI_MODELS: `${API_V1_PREFIX}/settings/ai-models`,
    REVOKE_PROVIDER: (id: string) => `${API_V1_PREFIX}/settings/api-providers/${id}/revoke` as const,
  },
  HEALTH: {
    CHECK: `${API_V1_PREFIX}/health`,
    LIVE: `${API_V1_PREFIX}/health/live`,
    READY: `${API_V1_PREFIX}/health/ready`,
  },
  METRICS: `${API_V1_PREFIX}/metrics`,
  NOTIFICATIONS: {
    ROOT: `${API_V1_PREFIX}/notifications`,
    COUNT: `${API_V1_PREFIX}/notifications/count`,
    STREAM: `${API_V1_PREFIX}/notifications/stream`,
    ITEM: (id: string) => `${API_V1_PREFIX}/notifications/${id}` as const,
  },
  DOCS: `${API_V1_PREFIX}/docs`,
  AI: {
    CHAT: `${API_V1_PREFIX}/ai/chat`,
    ENHANCE: `${API_V1_PREFIX}/ai/enhance`,
    ENHANCE_STREAM: `${API_V1_PREFIX}/ai/enhance/stream`,
  },
} as const;

/**
 * External links
 */
export const EXTERNAL_LINKS = {
  GITHUB: 'https://github.com/MarianRusoiu99/resume-optimizer',
  DOCS: '/api-docs',
} as const;

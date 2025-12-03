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
export const API = {
  // Auth
  AUTH: {
    REGISTER: '/api/auth/register',
    SESSION: '/api/auth/session',
  },
  
  // Profiles
  PROFILE: {
    LIST: '/api/profile',
    GET: (id: string) => `/api/profile/${id}` as const,
    DUPLICATE: (id: string) => `/api/profile/${id}/duplicate` as const,
    SET_DEFAULT: (id: string) => `/api/profile/${id}/set-default` as const,
    EXPORT_PDF: (id: string) => `/api/profile/${id}/export-pdf` as const,
    PUBLIC: (id: string) => `/api/profile/${id}/public` as const,
  },
  
  // Resumes
  RESUME: {
    LIST: '/api/resume/generate',
    GET: (id: string) => `/api/resume/${id}` as const,
    CONTENT: (id: string) => `/api/resume/${id}/content` as const,
    PREVIEW: (id: string) => `/api/resume/${id}/preview` as const,
    TEMPLATE: (id: string) => `/api/resume/${id}/template` as const,
    DUPLICATE: (id: string) => `/api/resume/${id}/duplicate` as const,
    COVER_LETTER: (id: string) => `/api/resume/${id}/cover-letter` as const,
    GENERATE: '/api/resume/generate',
    GENERATE_SIMPLE: '/api/resume/generate-simple',
    GENERATE_STREAM: '/api/resume/generate-stream',
    IMPORT: '/api/resume/import',
  },
  
  // Cover Letters
  COVER_LETTER: {
    LIST: '/api/cover-letter',
    GET: (id: string) => `/api/cover-letter/${id}` as const,
    GENERATE: '/api/cover-letter/generate',
    EXPORT: (id: string) => `/api/cover-letter/${id}/export` as const,
  },
  
  // Templates
  TEMPLATE: {
    LIST: '/api/template',
    GET: (id: string) => `/api/template/${id}` as const,
    DUPLICATE: (id: string) => `/api/template/${id}/duplicate` as const,
    RENDER: '/api/template/render',
  },
  
  // Export
  EXPORT: {
    PDF: '/api/export/pdf',
  },
  
  // Settings
  SETTINGS: {
    API_PROVIDERS: '/api/settings/api-providers',
    API_PROVIDER: (id: string) => `/api/settings/api-providers/${id}` as const,
    MODELS: '/api/settings/api-providers/models',
  },
  
  // Health
  HEALTH: {
    CHECK: '/api/health',
    LIVE: '/api/health/live',
    READY: '/api/health/ready',
  },
} as const;

/**
 * External links
 */
export const EXTERNAL_LINKS = {
  GITHUB: 'https://github.com/MarianRusoiu99/resume-optimizer',
  DOCS: '/api-docs',
} as const;

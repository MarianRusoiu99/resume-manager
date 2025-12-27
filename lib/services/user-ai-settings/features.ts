import type { AIFeatureConfig } from './types';

/**
 * All available AI features.
 */
export const AI_FEATURES: AIFeatureConfig[] = [
  {
    id: 'resume',
    name: 'Resume Generation',
    description: 'AI model used when generating optimized resumes from job descriptions',
  },
  {
    id: 'coverLetter',
    name: 'Cover Letter Generation',
    description: 'AI model used when generating cover letters',
  },
  {
    id: 'enhance',
    name: 'AI Enhancement',
    description: 'AI model used for enhancing text fields (descriptions, summaries)',
  },
  {
    id: 'template',
    name: 'Template Analysis',
    description: 'AI model used for parsing and analyzing templates',
  },
];

import type { ProgressCallback } from './types';

export function scheduleProgressUpdates(onProgress: ProgressCallback, startTime: number): void {
  onProgress('job-analysis', 'Analyzing job description...', 20);

  setTimeout(() => {
    if (Date.now() - startTime < 30000) {
      onProgress('profile-matching', 'Matching your profile to job requirements...', 40);
    }
  }, 3000);

  setTimeout(() => {
    if (Date.now() - startTime < 30000) {
      onProgress('content-optimization', 'Optimizing resume content...', 60);
    }
  }, 8000);

  setTimeout(() => {
    if (Date.now() - startTime < 30000) {
      onProgress('format-validation', 'Validating ATS compatibility...', 75);
    }
  }, 13000);

  setTimeout(() => {
    if (Date.now() - startTime < 30000) {
      onProgress('output-generation', 'Generating final resume...', 85);
    }
  }, 18000);
}

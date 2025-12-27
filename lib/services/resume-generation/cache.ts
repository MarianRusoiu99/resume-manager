import { resumesCache } from '@/lib/cache/resumes-cache';

export function getResumesCacheKey(userId: string): string {
  return `resumes:${userId}`;
}

export function invalidateResumesCache(userId: string): void {
  resumesCache.delete(getResumesCacheKey(userId));
}

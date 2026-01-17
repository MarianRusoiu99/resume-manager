import { resumesCache } from '@/lib/cache/resumes-cache';

export function getUserResumesCacheKey(userId: string): string {
  return `resumes:${userId}`;
}

export function invalidateUserResumesCache(userId: string): void {
  resumesCache.delete(getUserResumesCacheKey(userId));
}

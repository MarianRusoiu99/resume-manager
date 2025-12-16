import type { ICache } from '@/lib/repositories/interfaces';

export function getUserProfilesCacheKey(userId: string): string {
  return `profiles:${userId}`;
}

export function getProfileCacheKey(profileId: string): string {
  return `profile:${profileId}`;
}

export function invalidateProfileCache(options: {
  cache: ICache;
  userId: string;
  profileId?: string;
}): void {
  options.cache.delete(getUserProfilesCacheKey(options.userId));
  if (options.profileId) {
    options.cache.delete(getProfileCacheKey(options.profileId));
  }
}

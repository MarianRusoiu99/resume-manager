import type { ICache } from '@/lib/repositories/interfaces';
import { withLock } from '@/lib/cache/distributed-lock';

export function getUserProfilesCacheKey(userId: string): string {
  return `profiles:${userId}`;
}

export function getProfileCacheKey(profileId: string): string {
  return `profile:${profileId}`;
}

export async function invalidateProfileCache(options: {
  cache: ICache;
  userId: string;
  profileId?: string;
}): Promise<void> {
  const lockKey = `profile-cache-lock:${options.userId}`;

  await withLock(lockKey, async () => {
    options.cache.delete(getUserProfilesCacheKey(options.userId));
    if (options.profileId) {
      options.cache.delete(getProfileCacheKey(options.profileId));
    }
  });
}

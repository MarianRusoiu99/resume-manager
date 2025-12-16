import { profileRepository } from '@/lib/repositories/profile.repository';

// Type for profile data returned from repository
export type Profile = Awaited<ReturnType<typeof profileRepository.findById>>;
export type ProfileList = Awaited<ReturnType<typeof profileRepository.findAllByUserId>>;

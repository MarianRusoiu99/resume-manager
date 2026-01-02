import { profileRepository } from '@/lib/repositories/profiles.repository';

// Type for profile data returned from repository
export type Profile = Awaited<ReturnType<typeof profileRepository.findById>>;

export type ProfileList = Array<NonNullable<Profile> & { selectedTemplateId: string | null }>;

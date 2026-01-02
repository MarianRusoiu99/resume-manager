import { profileRepository } from '@/lib/repositories';
import { resumeSchema } from '@/lib/validations/jsonresume';
import type { Resume } from '@/lib/validations/jsonresume';
import { logger } from '@/lib/utils/logger';
import { failure, success, type ServiceResult } from '@/lib/types/service-result';

/**
 * Fetch and validate user's resume from profile.
 * Supports both default profile and specific profile ID.
 */
export async function fetchAndValidateUserResume(
  userId: string,
  profileId?: string,
  skipValidation = false
): Promise<ServiceResult<Resume>> {
  const profileData = profileId
    ? await profileRepository.findById(profileId, userId)
    : await profileRepository.findDefaultByUserId(userId);

  if (!profileData) {
    return failure(
      'User profile not found. Please complete your profile before generating a resume.',
      'NOT_FOUND'
    );
  }

  if (typeof profileData !== 'object' || !('resume' in profileData)) {
    return failure('Profile structure is invalid. Please update your profile.', 'VALIDATION_ERROR');
  }

  if (!profileData.resume) {
    return failure('Profile does not contain resume data. Please complete your profile.', 'VALIDATION_ERROR');
  }

  if (skipValidation) {
    return success(profileData.resume as Resume);
  }

  try {
    const userResume = resumeSchema.parse(profileData.resume);
    return success(userResume);
  } catch (error) {
    logger.error('Profile resume validation failed', error);
    return failure('Invalid profile data format. Please update your profile.', 'VALIDATION_ERROR');
  }
}

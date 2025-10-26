import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileService } from '../profile.service';
import { profileRepository } from '@/lib/repositories/profile.repository';
import { profileCache } from '@/lib/cache/simple-cache';

// Mock dependencies
vi.mock('@/lib/repositories/profile.repository', () => ({
  profileRepository: {
    findByUserId: vi.fn(),
    exists: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/cache/simple-cache', () => ({
  profileCache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ProfileService', () => {
  let profileService: ProfileService;
  const mockUserId = 'user-123';
  const mockProfile = {
    id: 'profile-1',
    userId: mockUserId,
    personalInfo: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      location: 'San Francisco, CA',
    },
    summary: 'Experienced software engineer',
    experience: [
      {
        company: 'Tech Corp',
        position: 'Senior Developer',
        startDate: '2020-01',
        endDate: '2023-12',
        description: 'Led team of 5 developers',
        location: 'San Francisco, CA',
      },
    ],
    education: [
      {
        school: 'University of California',
        degree: 'BS Computer Science',
        field: 'Computer Science',
        startDate: '2015-09',
        endDate: '2019-06',
        location: 'Berkeley, CA',
      },
    ],
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    certifications: null,
    languages: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    profileService = new ProfileService();
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return cached profile if available', async () => {
      vi.mocked(profileCache.get).mockReturnValue(mockProfile);

      const result = await profileService.getProfile(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
      expect(profileCache.get).toHaveBeenCalledWith(`profile:${mockUserId}`);
      expect(profileRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      vi.mocked(profileCache.get).mockReturnValue(null);
      vi.mocked(profileRepository.findByUserId).mockResolvedValue(mockProfile);

      const result = await profileService.getProfile(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
      expect(profileRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(profileCache.set).toHaveBeenCalledWith(`profile:${mockUserId}`, mockProfile);
    });

    it('should return null if profile not found', async () => {
      vi.mocked(profileCache.get).mockReturnValue(null);
      vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);

      const result = await profileService.getProfile(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(profileCache.set).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(profileCache.get).mockReturnValue(null);
      vi.mocked(profileRepository.findByUserId).mockRejectedValue(new Error('DB error'));

      const result = await profileService.getProfile(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch profile');
    });
  });

  describe('createProfile', () => {
    const validProfileData = {
      personalInfo: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        location: 'New York, NY',
      },
      summary: 'Product manager with 5 years experience',
      experience: [
        {
          company: 'Startup Inc',
          title: 'Product Manager',
          startDate: '2019-01',
          endDate: '2024-01',
          description: 'Managed product roadmap',
          current: false,
        },
      ],
      education: [
        {
          school: 'Harvard University',
          degree: 'MBA',
          field: 'Business Administration',
          startDate: '2015-09',
          endDate: '2017-06',
        },
      ],
      skills: {
        technical: ['Product Management', 'Agile', 'Scrum'],
        soft: ['Leadership', 'Communication'],
        languages: ['English', 'Spanish'],
      },
    };

    it('should create profile successfully', async () => {
      vi.mocked(profileRepository.exists).mockResolvedValue(false);
      vi.mocked(profileRepository.create).mockResolvedValue(mockProfile);

      const result = await profileService.createProfile(mockUserId, validProfileData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
      expect(profileRepository.create).toHaveBeenCalledWith(mockUserId, validProfileData);
      expect(profileCache.delete).toHaveBeenCalledWith(`profile:${mockUserId}`);
    });

    it('should reject if profile already exists', async () => {
      vi.mocked(profileRepository.exists).mockResolvedValue(true);

      const result = await profileService.createProfile(mockUserId, validProfileData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile already exists. Use update instead.');
      expect(profileRepository.create).not.toHaveBeenCalled();
    });

    it('should reject invalid data with validation error', async () => {
      const invalidData = {
        personalInfo: {
          name: '', // Empty name - should fail validation
          email: 'invalid-email', // Invalid email format
        },
        summary: 'Test',
        experience: [],
        education: [],
        skills: {
          technical: [],
          soft: [],
          languages: [],
        },
      };

      vi.mocked(profileRepository.exists).mockResolvedValue(false);

      const result = await profileService.createProfile(mockUserId, invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error');
      expect(result.details).toBeDefined();
      expect(profileRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      vi.mocked(profileRepository.exists).mockResolvedValue(false);
      vi.mocked(profileRepository.create).mockRejectedValue(new Error('DB error'));

      const result = await profileService.createProfile(mockUserId, validProfileData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create profile');
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      summary: 'Updated summary text',
      skills: {
        technical: ['New Skill', 'Another Skill'],
        soft: ['Leadership'],
        languages: ['English'],
      },
    };

    it('should update profile successfully', async () => {
      vi.mocked(profileRepository.exists).mockResolvedValue(true);
      vi.mocked(profileRepository.update).mockResolvedValue({
        ...mockProfile,
        ...updateData,
      });

      const result = await profileService.updateProfile(mockUserId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.summary).toBe(updateData.summary);
      expect(profileRepository.update).toHaveBeenCalledWith(mockUserId, updateData);
      expect(profileCache.delete).toHaveBeenCalledWith(`profile:${mockUserId}`);
    });

    it('should reject if profile does not exist', async () => {
      vi.mocked(profileRepository.exists).mockResolvedValue(false);

      const result = await profileService.updateProfile(mockUserId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile not found. Create one first.');
      expect(profileRepository.update).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const invalidUpdate = {
        skills: 'not-an-array', // Should be array
      };

      vi.mocked(profileRepository.exists).mockResolvedValue(true);

      const result = await profileService.updateProfile(mockUserId, invalidUpdate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error');
      expect(profileRepository.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      vi.mocked(profileRepository.exists).mockResolvedValue(true);
      vi.mocked(profileRepository.update).mockRejectedValue(new Error('DB error'));

      const result = await profileService.updateProfile(mockUserId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update profile');
    });
  });

  describe('upsertProfile', () => {
    const upsertData = {
      personalInfo: {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+9876543210',
        location: 'Austin, TX',
      },
      summary: 'DevOps engineer',
      experience: [],
      education: [],
      skills: {
        technical: ['Docker', 'Kubernetes'],
        soft: [],
        languages: [],
      },
    };

    it('should upsert profile successfully', async () => {
      vi.mocked(profileRepository.upsert).mockResolvedValue({
        ...mockProfile,
        ...upsertData,
      });

      const result = await profileService.upsertProfile(mockUserId, upsertData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(profileRepository.upsert).toHaveBeenCalledWith(mockUserId, upsertData);
      expect(profileCache.delete).toHaveBeenCalledWith(`profile:${mockUserId}`);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        personalInfo: {
          name: '',
          email: 'bad-email',
        },
        summary: '',
        experience: [],
        education: [],
        skills: {
          technical: [],
          soft: [],
          languages: [],
        },
      };

      const result = await profileService.upsertProfile(mockUserId, invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error');
      expect(profileRepository.upsert).not.toHaveBeenCalled();
    });

    it('should handle database errors during upsert', async () => {
      vi.mocked(profileRepository.upsert).mockRejectedValue(new Error('DB error'));

      const result = await profileService.upsertProfile(mockUserId, upsertData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save profile');
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile successfully', async () => {
      vi.mocked(profileRepository.delete).mockResolvedValue(mockProfile);

      const result = await profileService.deleteProfile(mockUserId);

      expect(result.success).toBe(true);
      expect(profileRepository.delete).toHaveBeenCalledWith(mockUserId);
      expect(profileCache.delete).toHaveBeenCalledWith(`profile:${mockUserId}`);
    });

    it('should handle database errors during deletion', async () => {
      vi.mocked(profileRepository.delete).mockRejectedValue(new Error('DB error'));

      const result = await profileService.deleteProfile(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete profile');
    });
  });

  describe('profileExists', () => {
    it('should return true if profile exists', async () => {
      vi.mocked(profileRepository.exists).mockResolvedValue(true);

      const result = await profileService.profileExists(mockUserId);

      expect(result).toBe(true);
      expect(profileRepository.exists).toHaveBeenCalledWith(mockUserId);
    });

    it('should return false if profile does not exist', async () => {
      vi.mocked(profileRepository.exists).mockResolvedValue(false);

      const result = await profileService.profileExists(mockUserId);

      expect(result).toBe(false);
    });
  });
});

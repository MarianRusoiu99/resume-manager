import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileRepository } from '../profile.repository';
import { prisma } from '@/lib/db';

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('ProfileRepository', () => {
  let repository: ProfileRepository;

  const mockProfile = {
    id: '1',
    userId: 'user-123',
    personalInfo: { name: 'John Doe', email: 'john@example.com' },
    summary: 'Software Engineer',
    experience: [],
    education: [],
    skills: { technical: [], soft: [], languages: [] },
    certifications: [],
    languages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = new ProfileRepository();
    vi.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should find a profile by user ID', async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(mockProfile);

      const result = await repository.findByUserId('user-123');

      expect(result).toEqual(mockProfile);
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return null if profile not found', async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(null);

      const result = await repository.findByUserId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new profile', async () => {
      const profileData = {
        personalInfo: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-0100',
          location: 'New York, NY',
        },
        summary: 'Experienced developer',
        experience: [],
        education: [],
        skills: {
          technical: ['JavaScript', 'TypeScript'],
          soft: ['Leadership'],
          languages: ['English'],
        },
      };

      const mockCreatedProfile = {
        id: '1',
        userId: 'user-123',
        ...profileData,
        certifications: [],
        languages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userProfile.create).mockResolvedValue(mockCreatedProfile);

      const result = await repository.create('user-123', profileData);

      expect(result).toBeTruthy();
      expect(prisma.userProfile.create).toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true if profile exists', async () => {
      vi.mocked(prisma.userProfile.count).mockResolvedValue(1);

      const result = await repository.exists('user-123');

      expect(result).toBe(true);
    });

    it('should return false if profile does not exist', async () => {
      vi.mocked(prisma.userProfile.count).mockResolvedValue(0);

      const result = await repository.exists('user-123');

      expect(result).toBe(false);
    });
  });
});


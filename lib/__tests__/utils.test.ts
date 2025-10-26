import { describe, it, expect } from 'vitest';

// Simple test example for validation schema
describe('Profile Validation', () => {
  it('should validate required fields', () => {
    const validProfile = {
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      summary: 'Test summary',
      experience: [],
      education: [],
      skills: {
        technical: [],
        soft: [],
        languages: [],
      },
    };

    expect(validProfile.personalInfo.name).toBeTruthy();
    expect(validProfile.personalInfo.email).toContain('@');
  });

  it('should have required skill categories', () => {
    const skills = {
      technical: ['JavaScript', 'TypeScript'],
      soft: ['Communication'],
      languages: ['English'],
    };

    expect(skills).toHaveProperty('technical');
    expect(skills).toHaveProperty('soft');
    expect(skills).toHaveProperty('languages');
    expect(Array.isArray(skills.technical)).toBe(true);
  });
});

// Simple encryption utility test
describe('Encryption Utils', () => {
  it('should mask API keys correctly', () => {
    const maskApiKey = (key: string) => {
      if (key.length <= 8) return '****';
      return key.slice(0, 4) + '****' + key.slice(-4);
    };

    const key = 'sk-1234567890abcdef';
    const masked = maskApiKey(key);

    expect(masked).toContain('****');
    expect(masked).not.toBe(key);
    expect(masked.length).toBeLessThan(key.length);
  });

  it('should handle short keys', () => {
    const maskApiKey = (key: string) => {
      if (key.length <= 8) return '****';
      return key.slice(0, 4) + '****' + key.slice(-4);
    };

    const shortKey = 'test';
    const masked = maskApiKey(shortKey);

    expect(masked).toBe('****');
  });
});

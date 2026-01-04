import { describe, it, expect } from 'vitest';
import { normalizeResume, extractResumeFromData } from './resume-normalizer';

describe('Resume Normalizer', () => {
  it('should create an empty resume from null', () => {
    const result = normalizeResume(null);
    
    expect(result).toBeDefined();
    expect(result.basics).toBeDefined();
    expect(result.basics.name).toBe('');
    expect(result.work).toEqual([]);
    expect(result.education).toEqual([]);
  });

  it('should normalize partial resume data', () => {
    const partial = {
      basics: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      work: [
        {
          name: 'Tech Corp',
          position: 'Developer',
        },
      ],
    };
    
    const result = normalizeResume(partial);
    
    expect(result.basics.name).toBe('John Doe');
    expect(result.basics.email).toBe('john@example.com');
    expect(result.basics.phone).toBe(''); // Should be filled with default
    expect(result.work).toHaveLength(1);
    expect(result.work[0].name).toBe('Tech Corp');
    expect(result.work[0].position).toBe('Developer');
  });

  it('should preserve all provided data', () => {
    const complete = {
      basics: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        summary: 'Experienced engineer',
        location: {
          city: 'San Francisco',
          region: 'CA',
        },
      },
      work: [
        {
          name: 'Example Inc',
          position: 'Senior Developer',
          startDate: '2020-01-01',
        },
      ],
      skills: [
        {
          name: 'JavaScript',
          level: 'Expert',
        },
      ],
    };
    
    const result = normalizeResume(complete);
    
    expect(result.basics.name).toBe('Jane Smith');
    expect(result.basics.email).toBe('jane@example.com');
    expect(result.basics.phone).toBe('+1234567890');
    expect(result.basics.location?.city).toBe('San Francisco');
    expect(result.work).toHaveLength(1);
    expect(result.work[0].name).toBe('Example Inc');
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('JavaScript');
  });

  it('should extract resume from nested document', () => {
    const data = {
      document: {
        document: {
          basics: {
            name: 'Test User',
          },
        },
      },
    };
    
    const result = extractResumeFromData(data);
    
    expect(result).not.toBeNull();
    expect(result?.basics.name).toBe('Test User');
  });

  it('should return null for invalid data', () => {
    const result = extractResumeFromData('invalid');
    expect(result).toBeNull();
  });
});

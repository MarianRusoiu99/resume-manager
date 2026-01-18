import { describe, it, expect, vi } from 'vitest';
import { encrypt, decrypt, maskApiKey, validateEncryption } from '@/lib/encryption/crypto';
import { ConfigurationError, ValidationError } from '@/lib/errors';

vi.mock('@/lib/config', () => ({
  env: {
    ENCRYPTION_KEY: 'test-encryption-key-that-is-32-characters-long!',
  },
}));

describe('Encryption Module', () => {
  describe('encrypt', () => {
    it('should encrypt a string and return encrypted format', () => {
      const plaintext = 'Hello, World!';

      const encrypted = encrypt(plaintext);

      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
      expect(encrypted).toContain(':');
    });

    it('should produce different encrypted values for same input (due to random salt/iv)', () => {
      const plaintext = 'Same input';

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('');

      expect(encrypted).toContain(':');
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should handle special characters', () => {
      const plaintext = 'Special chars: !@#$%^&*()';

      const encrypted = encrypt(plaintext);

      expect(encrypted).toContain(':');
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Unicode: 你好 🌍 世界';

      const encrypted = encrypt(plaintext);

      expect(encrypted).toContain(':');
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should handle long strings', () => {
      const plaintext = 'A'.repeat(10000);

      const encrypted = encrypt(plaintext);

      expect(encrypted).toContain(':');
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should handle special characters', () => {
      const plaintext = 'Special chars: !@#$%^&*()';

      const encrypted = encrypt(plaintext);

      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Unicode: 你好 🌍 世界';

      const encrypted = encrypt(plaintext);

      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    });

    it('should handle long strings', () => {
      const plaintext = 'A'.repeat(10000);

      const encrypted = encrypt(plaintext);

      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string back to original', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encrypt(plaintext);

      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);

      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should handle special characters', () => {
      const plaintext = 'Special chars: !@#$%^&*()';
      const encrypted = encrypt(plaintext);

      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Unicode: 你好 🌍 世界';
      const encrypted = encrypt(plaintext);

      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = encrypt(plaintext);

      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw ValidationError for invalid format (missing parts)', () => {
      expect(() => {
        decrypt('invalid-format');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid format (too many parts)', () => {
      expect(() => {
        decrypt('salt:iv:encrypted:authTag:extra');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid format (too few parts)', () => {
      expect(() => {
        decrypt('salt:iv:encrypted');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-base64 parts', () => {
      expect(() => {
        decrypt('not-base64:!!!:not-base64:!!!:not-base64:!!!');
      }).toThrow(ValidationError);
    });

    it('should throw error when decrypted content is invalid (wrong auth tag)', () => {
      const plaintext = 'Test data';
      const encrypted = encrypt(plaintext);

      const parts = encrypted.split(':');
      parts[3] = 'invalid-auth-tag';

      const corrupted = parts.join(':');

      expect(() => {
        decrypt(corrupted);
      }).toThrow(ConfigurationError);
    });

    it('should throw error when decrypted content is invalid (wrong data)', () => {
      const plaintext = 'Test data';
      const encrypted = encrypt(plaintext);

      const parts = encrypted.split(':');
      parts[2] = 'corrupted-data';

      const corrupted = parts.join(':');

      expect(() => {
        decrypt(corrupted);
      }).toThrow(ConfigurationError);
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    it('should maintain data integrity through encrypt-decrypt cycle', () => {
      const testData = [
        '',
        'Simple text',
        'With numbers: 12345',
        'Special chars: !@#$%^&*()',
        'Unicode: 你好 🌍 世界',
        'Longer text with multiple sentences. This is a test string that has various characters and structures.',
        'A'.repeat(1000),
        JSON.stringify({ key: 'value', nested: { data: [1, 2, 3] } }),
      ];

      testData.forEach((plaintext) => {
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      });
    });

    it('should produce deterministic salt/iv for same key but different output due to randomness', () => {
      const plaintext = 'Test data';

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      const parts1 = encrypted1.split(':');
      const parts2 = encrypted2.split(':');

      expect(parts1[0]).not.toBe(parts2[0]);
      expect(parts1[1]).not.toBe(parts2[1]);

      expect(parts1[2]).not.toBe(parts2[2]);
    });
  });

  describe('maskApiKey', () => {
    it('should mask API key showing first 4 and last 4 characters', () => {
      const apiKey = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';

      const masked = maskApiKey(apiKey);

      expect(masked).toBe('sk-12****qrstuvwxyz');
    });

    it('should return **** for short keys (less than 8 chars)', () => {
      const apiKey = 'short';

      const masked = maskApiKey(apiKey);

      expect(masked).toBe('****');
    });

    it('should return **** for empty string', () => {
      const masked = maskApiKey('');

      expect(masked).toBe('****');
    });

    it('should return **** for null/undefined', () => {
      expect(maskApiKey(null as unknown as string)).toBe('****');
      expect(maskApiKey(undefined as unknown as string)).toBe('****');
    });

    it('should handle keys exactly 8 characters long', () => {
      const apiKey = '12345678';

      const masked = maskApiKey(apiKey);

      expect(masked).toBe('1234****5678');
    });

    it('should handle keys longer than 20 characters (max 20 shown)', () => {
      const apiKey = 'a'.repeat(30);

      const masked = maskApiKey(apiKey);

      expect(masked.length).toBe(20);
      expect(masked).toBe('aaaa****aaaaaaaa');
    });

    it('should handle keys exactly 20 characters long', () => {
      const apiKey = 'a'.repeat(20);

      const masked = maskApiKey(apiKey);

      expect(masked.length).toBe(20);
      expect(masked).toBe('aaaa****aaaaaaaa');
    });
  });

  describe('validateEncryption', () => {
    it('should return true for successful encryption/decryption round-trip', () => {
      const plaintext = 'Test validation data';

      const result = validateEncryption(plaintext);

      expect(result).toBe(true);
    });

    it('should return false for failed validation', () => {
      const result = validateEncryption('non-encrypted-string');

      expect(result).toBe(false);
    });

    it('should handle complex nested objects', () => {
      const plaintext = {
        user: { name: 'John', age: 30 },
        items: [{ id: 1, value: 'test' }],
        metadata: { created: new Date(), tags: ['tag1', 'tag2'] },
      };

      const result = validateEncryption(JSON.stringify(plaintext));

      expect(result).toBe(true);
    });

    it('should handle empty string', () => {
      const result = validateEncryption('');

      expect(result).toBe(true);
    });
  });
});

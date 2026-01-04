/**
 * Tests for password utilities
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'mySecurePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const password = '';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'mySecurePassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should reject empty password against valid hash', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    it('should handle case-sensitive passwords correctly', async () => {
      const password = 'MyPassword';
      const hash = await hashPassword(password);

      const isValid1 = await verifyPassword('MyPassword', hash);
      const isValid2 = await verifyPassword('mypassword', hash);

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(false);
    });
  });
});

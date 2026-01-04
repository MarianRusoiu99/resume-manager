import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password Utilities', () => {
  it('should hash a password', async () => {
    const password = 'TestPassword123!';
    const hashed = await hashPassword(password);
    
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(0);
  });

  it('should verify a correct password', async () => {
    const password = 'TestPassword123!';
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword(password, hashed);
    
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const password = 'TestPassword123!';
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword('WrongPassword', hashed);
    
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for the same password', async () => {
    const password = 'TestPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    expect(hash1).not.toBe(hash2);
    // But both should verify correctly
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });
});

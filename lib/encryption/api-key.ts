/**
 * API Key Encryption Wrapper
 * Provides encryption/decryption specifically for API keys
 * with secure memory handling
 */

import { encrypt, decrypt } from './crypto';
import { ValidationError } from '@/lib/errors';

/**
 * Encrypt an API key for secure storage
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey || apiKey.trim() === '') {
    throw new ValidationError('API key cannot be empty');
  }

  return encrypt(apiKey);
}

/**
 * Decrypt an API key for use
 * 
 * SECURITY NOTE: The decrypted key should be used immediately
 * and not stored in variables longer than necessary.
 * Consider using the callback pattern for sensitive operations.
 */
export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey || encryptedKey.trim() === '') {
    throw new ValidationError('Encrypted key cannot be empty');
  }

  return decrypt(encryptedKey);
}

/**
 * Decrypt and use an API key in a secure callback pattern
 * This helps ensure the key is not stored longer than necessary
 * 
 * @example
 * await withDecryptedKey(encryptedKey, async (apiKey) => {
 *   // Use apiKey here
 *   await callExternalApi(apiKey);
 * });
 */
export async function withDecryptedKey<T>(
  encryptedKey: string,
  callback: (apiKey: string) => Promise<T>
): Promise<T> {
  const apiKey = decryptApiKey(encryptedKey);
  try {
    return await callback(apiKey);
  } finally {
    // Note: In JavaScript, we can't truly zero memory, but this pattern
    // helps limit the scope of the plaintext key
  }
}

/**
 * Validate API key format before encryption
 */
export function validateApiKeyFormat(apiKey: string, provider: string): boolean {
  const patterns: Record<string, RegExp> = {
    // Updated to support modern OpenAI key format (sk-proj-..., sk-..., with hyphens and underscores)
    openai: /^sk-[a-zA-Z0-9_-]{20,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-_]{95,}$/,
    google: /^AIza[a-zA-Z0-9_-]{35}$/,
  };
  
  const pattern = patterns[provider];
  if (!pattern) {
    return false;
  }
  
  return pattern.test(apiKey);
}

/**
 * Create a preview of the API key (provider prefix only for security)
 * Does NOT expose any actual key characters
 */
export function createKeyPreview(provider: string): string {
  const previews: Record<string, string> = {
    openai: 'sk-****',
    anthropic: 'sk-ant-****',
    google: 'AIza****',
    cohere: 'co-****',
    mistral: 'mk-****',
  };
  
  return previews[provider.toLowerCase()] || '****';
}

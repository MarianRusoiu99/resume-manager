/**
 * API Key Encryption Wrapper
 * Provides encryption/decryption specifically for API keys
 */

import { encrypt, decrypt } from './crypto';

/**
 * Encrypt an API key for secure storage
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key cannot be empty');
  }
  
  return encrypt(apiKey);
}

/**
 * Decrypt an API key for use
 */
export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey || encryptedKey.trim() === '') {
    throw new Error('Encrypted key cannot be empty');
  }
  
  return decrypt(encryptedKey);
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
 * Create a preview of the API key (first characters + "...")
 */
export function createKeyPreview(apiKey: string, length = 12): string {
  if (apiKey.length <= length) {
    return apiKey;
  }
  
  return apiKey.substring(0, length) + '...';
}

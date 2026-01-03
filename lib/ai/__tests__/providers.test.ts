/**
 * AI Provider Factory Tests
 * 
 * Tests for provider factory functions (no API key validation tests)
 */

import { describe, it, expect } from 'vitest';
import { 
  getSupportedProviders, 
  isProviderSupported, 
  getProviderName,
  assertProviderSupported,
  SUPPORTED_PROVIDERS 
} from '../providers/factory';
import { UnsupportedProviderError } from '@/lib/errors/ai';

describe('AI Provider Factory', () => {
  describe('getSupportedProviders', () => {
    it('returns all supported providers', () => {
      const providers = getSupportedProviders();
      
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('google');
      expect(providers.length).toBe(3);
    });

    it('returns readonly array', () => {
      const providers = getSupportedProviders();
      expect(providers).toBe(SUPPORTED_PROVIDERS);
    });
  });

  describe('isProviderSupported', () => {
    it('returns true for supported providers', () => {
      expect(isProviderSupported('openai')).toBe(true);
      expect(isProviderSupported('anthropic')).toBe(true);
      expect(isProviderSupported('google')).toBe(true);
    });

    it('handles case-insensitive check', () => {
      expect(isProviderSupported('OpenAI')).toBe(true);
      expect(isProviderSupported('ANTHROPIC')).toBe(true);
      expect(isProviderSupported('Google')).toBe(true);
    });

    it('returns false for unsupported providers', () => {
      expect(isProviderSupported('unknown')).toBe(false);
      expect(isProviderSupported('claude')).toBe(false);
      expect(isProviderSupported('')).toBe(false);
    });
  });

  describe('getProviderName', () => {
    it('returns display names for supported providers', () => {
      expect(getProviderName('openai')).toBe('OpenAI');
      expect(getProviderName('anthropic')).toBe('Anthropic');
      expect(getProviderName('google')).toBe('Google AI');
    });

    it('capitalizes unknown provider names', () => {
      expect(getProviderName('unknown')).toBe('Unknown');
      expect(getProviderName('myProvider')).toBe('MyProvider');
    });
  });

  describe('assertProviderSupported', () => {
    it('does not throw for supported providers', () => {
      expect(() => assertProviderSupported('openai')).not.toThrow();
      expect(() => assertProviderSupported('anthropic')).not.toThrow();
      expect(() => assertProviderSupported('google')).not.toThrow();
    });

    it('throws UnsupportedProviderError for unsupported providers', () => {
      expect(() => assertProviderSupported('unknown')).toThrow(UnsupportedProviderError);
    });

    it('includes supported providers in error message', () => {
      try {
        assertProviderSupported('invalid');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnsupportedProviderError);
        const unsupportedError = error as UnsupportedProviderError;
        expect(unsupportedError.message).toContain('openai');
        expect(unsupportedError.message).toContain('anthropic');
        expect(unsupportedError.message).toContain('google');
      }
    });
  });
});

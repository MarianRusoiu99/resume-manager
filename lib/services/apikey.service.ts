import { APIKeyRepository, apiKeyRepository } from '@/lib/repositories/apikey.repository';
import { encrypt, decrypt, maskApiKey } from '@/lib/encryption/crypto';
import crypto from 'crypto';

export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface APIKeyDto {
  id: string;
  provider: string;
  maskedKey: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface CreateAPIKeyInput {
  provider: AIProvider;
  apiKey: string;
}

export interface ValidateKeyResult {
  valid: boolean;
  error?: string;
}

/**
 * Service for managing API keys with encryption
 */
export class APIKeyService {
  constructor(private repository: APIKeyRepository = apiKeyRepository) {}

  /**
   * Get all API keys for a user (with masked keys)
   */
  async getUserAPIKeys(userId: string): Promise<APIKeyDto[]> {
    const keys = await this.repository.findByUserId(userId);
    
    return keys.map(key => {
      // Decrypt to mask (we don't store the original key unencrypted)
      let maskedKey = '****';
      try {
        const decryptedKey = decrypt(key.encryptedKey);
        maskedKey = maskApiKey(decryptedKey);
      } catch {
        // If decryption fails, use default mask
        maskedKey = '****';
      }

      return {
        id: key.id,
        provider: key.provider,
        maskedKey,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt
      };
    });
  }

  /**
   * Add a new API key for a user
   */
  async addAPIKey(userId: string, input: CreateAPIKeyInput): Promise<{
    success: boolean;
    key?: APIKeyDto;
    error?: string;
  }> {
    try {
      // Validate provider
      if (!['openai', 'anthropic', 'google'].includes(input.provider)) {
        return {
          success: false,
          error: 'Invalid provider. Supported: openai, anthropic, google'
        };
      }

      // Validate API key format
      const validation = this.validateKeyFormat(input.provider, input.apiKey);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid API key format'
        };
      }

      // Check if user already has an active key for this provider
      const hasKey = await this.repository.hasActiveKey(userId, input.provider);
      if (hasKey) {
        return {
          success: false,
          error: `You already have an active API key for ${input.provider}`
        };
      }

      // Encrypt the API key
      const encryptedKey = encrypt(input.apiKey);
      
      // Create hash for validation without decryption
      const keyHash = crypto
        .createHash('sha256')
        .update(input.apiKey)
        .digest('hex');

      // Store in database
      const apiKey = await this.repository.create({
        userId,
        provider: input.provider,
        encryptedKey,
        keyHash,
        isActive: true
      });

      // Return masked version
      const maskedKey = maskApiKey(input.apiKey);

      return {
        success: true,
        key: {
          id: apiKey.id,
          provider: apiKey.provider,
          maskedKey,
          isActive: apiKey.isActive,
          lastUsedAt: apiKey.lastUsedAt,
          createdAt: apiKey.createdAt
        }
      };
    } catch (error) {
      console.error('Error adding API key:', error);
      return {
        success: false,
        error: 'Failed to add API key'
      };
    }
  }

  /**
   * Delete an API key
   */
  async deleteAPIKey(userId: string, keyId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Verify ownership
      const key = await this.repository.findByIdAndUserId(keyId, userId);
      if (!key) {
        return {
          success: false,
          error: 'API key not found or access denied'
        };
      }

      await this.repository.delete(keyId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting API key:', error);
      return {
        success: false,
        error: 'Failed to delete API key'
      };
    }
  }

  /**
   * Get the decrypted API key for a provider (for internal use)
   */
  async getDecryptedKey(userId: string, provider: AIProvider): Promise<string | null> {
    try {
      const keys = await this.repository.findActiveByUserAndProvider(userId, provider);
      
      if (keys.length === 0) {
        return null;
      }

      // Use the most recently used key, or the newest if none have been used
      const key = keys[0];

      // Update last used timestamp
      await this.repository.updateLastUsed(key.id);

      // Decrypt and return
      return decrypt(key.encryptedKey);
    } catch (error) {
      console.error('Error getting decrypted key:', error);
      return null;
    }
  }

  /**
   * Validate API key format based on provider
   */
  private validateKeyFormat(provider: AIProvider, apiKey: string): ValidateKeyResult {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, error: 'API key cannot be empty' };
    }

    switch (provider) {
      case 'openai':
        // OpenAI keys start with 'sk-' and are typically 48+ characters
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI API keys must start with "sk-"' };
        }
        if (apiKey.length < 20) {
          return { valid: false, error: 'OpenAI API key is too short' };
        }
        break;

      case 'anthropic':
        // Anthropic keys start with 'sk-ant-'
        if (!apiKey.startsWith('sk-ant-')) {
          return { valid: false, error: 'Anthropic API keys must start with "sk-ant-"' };
        }
        if (apiKey.length < 20) {
          return { valid: false, error: 'Anthropic API key is too short' };
        }
        break;

      case 'google':
        // Google API keys vary, but should be at least 20 characters
        if (apiKey.length < 20) {
          return { valid: false, error: 'Google API key is too short' };
        }
        break;

      default:
        return { valid: false, error: 'Unknown provider' };
    }

    return { valid: true };
  }

  /**
   * Test if an API key works by making a simple API call
   * This would need to be implemented for each provider
   */
  async testAPIKey(userId: string, keyId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const key = await this.repository.findByIdAndUserId(keyId, userId);
      
      if (!key) {
        return {
          success: false,
          error: 'API key not found or access denied'
        };
      }

      // Decrypt the key
      const decryptedKey = decrypt(key.encryptedKey);

      // Test based on provider
      // For MVP, we'll just validate the format
      const validation = this.validateKeyFormat(key.provider as AIProvider, decryptedKey);
      
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // In a full implementation, make actual API call here
      // For now, return success if format is valid
      return {
        success: true
      };
    } catch (error) {
      console.error('Error testing API key:', error);
      return {
        success: false,
        error: 'Failed to test API key'
      };
    }
  }

  /**
   * Toggle API key active status
   */
  async toggleAPIKey(userId: string, keyId: string, isActive: boolean): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const key = await this.repository.findByIdAndUserId(keyId, userId);
      
      if (!key) {
        return {
          success: false,
          error: 'API key not found or access denied'
        };
      }

      await this.repository.update(keyId, { isActive });

      return { success: true };
    } catch (error) {
      console.error('Error toggling API key:', error);
      return {
        success: false,
        error: 'Failed to update API key'
      };
    }
  }
}

// Export singleton instance
export const apiKeyService = new APIKeyService();

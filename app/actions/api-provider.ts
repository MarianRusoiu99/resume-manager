'use server';

import { apiProviderService } from '@/lib/services';
import { withServerAction } from '@/lib/actions/with-server-action';
import { z } from 'zod';

const apiKeySchema = z.object({
  name: z.string().min(1, 'Provider name is required'),
  provider: z.string().min(1, 'Provider type is required'),
  apiKey: z.string().min(1, 'API key is required'),
});

/**
 * Add a new API provider
 */
export const addApiProvider = withServerAction(
  'addApiProvider',
  async (session, data: { name: string; provider: string; apiKey: string } | FormData) => {
    let input;
    if (data instanceof FormData) {
      input = {
        name: data.get('name') as string,
        provider: data.get('provider') as string,
        apiKey: data.get('apiKey') as string,
      };
    } else {
      input = data;
    }

    const validated = apiKeySchema.safeParse(input);
    if (!validated.success) {
      return { 
        success: false, 
        error: validated.error.issues[0].message 
      } as any;
    }

    return apiProviderService.addProvider({
      userId: session.user.id,
      ...validated.data,
    });
  },
  {
    auditAction: 'API_KEY_ADD',
    resourceType: 'api-provider',
    revalidatePaths: ['/settings'],
  }
);

/**
 * Delete an API provider
 */
export const deleteApiProvider = withServerAction(
  'deleteApiProvider',
  async (session, id: string) => apiProviderService.deleteProvider(id, session.user.id),
  {
    auditAction: 'API_KEY_DELETE',
    resourceType: 'api-provider',
    revalidatePaths: ['/settings'],
  }
);

/**
 * Get all API providers for the current user
 */
export const getApiProviders = withServerAction(
  'getApiProviders',
  async (session) => apiProviderService.getUserProviders(session.user.id),
  { resourceType: 'api-provider' }
);

/**
 * Get all available models from all providers
 */
export const getAllAvailableModels = withServerAction(
  'getAllAvailableModels',
  async (session) => {
    const result = await apiProviderService.getUserProvidersWithModels(session.user.id);
    if (!result.success) return result;

    const allModels = result.data.flatMap(provider => 
      provider.models.map(model => ({
        id: model.id,
        name: model.name || model.id,
        providerId: provider.id,
        providerType: provider.provider,
      }))
    );

    return {
      success: true,
      data: {
        allModels,
        byProvider: result.data
      }
    };
  },
  { resourceType: 'api-provider' }
);

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api-client';
import type { AIFeatureType } from '@/lib/repositories/interfaces';
import { updateFeaturePreference as updateFeaturePreferenceAction } from '@/app/actions/ai-settings';
import { createComponentLogger } from '@/lib/utils/client-logger';

const logger = createComponentLogger('useFeatureModelPreference');

/**
 * Custom hook to load and track the saved model preference for a specific AI feature
 * 
 * Features:
 * - Loads the user's saved preference for the feature
 * - If no preference exists, leaves modelId/providerId empty (shows "Select Model" in UI)
 * - When user selects a model, saves it as the preference for future visits
 * 
 * @param feature - The AI feature type (e.g., 'resume', 'coverLetter', 'enhance', 'template')
 * @returns Object containing modelId, providerId, isLoading state, and setter function
 */
export function useFeatureModelPreference(feature?: AIFeatureType) {
  const [modelId, setModelId] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!feature) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadPreference = async () => {
      try {
        logger.info('Loading preference for feature:', { feature });
        
        // Load user preferences
        const res = await apiFetch('/api/v1/user/preferences');
        if (cancelled) return;

        logger.info('Fetch response status:', { 
          status: res.status, 
          ok: res.ok,
          statusText: res.statusText 
        });

        if (!res.ok) {
          logger.error('API returned non-OK status', { status: res.status, statusText: res.statusText });
          return;
        }

        const responseText = await res.text();
        if (cancelled) return;

        logger.info('Raw response text (first 500 chars):', { 
          text: responseText.substring(0, 500),
          length: responseText.length 
        });

        // API responses come wrapped in { data, requestId } envelope
        const apiResponse = JSON.parse(responseText) as {
          data?: {
            ai?: Array<{
              feature: string;
              modelId: string | null;
              providerId: string;
            }>;
            template?: {
              defaultProfileId?: string;
              defaultTemplateId?: string;
            }
          };
          requestId?: string;
          error?: string;
        };

        logger.info('Parsed API response:', { 
          hasData: !!apiResponse.data,
          hasAi: !!apiResponse.data?.ai,
          aiLength: apiResponse.data?.ai?.length,
          aiData: apiResponse.data?.ai,
          feature,
          requestId: apiResponse.requestId
        });

        // Check if we got the data
        if (apiResponse.data?.ai) {
          logger.info('Searching for feature preference:', { 
            feature, 
            availableFeatures: apiResponse.data.ai.map(p => p.feature)
          });

          const featurePref = apiResponse.data.ai.find((p) => p.feature === feature);
          
          if (featurePref?.modelId && featurePref?.providerId) {
            logger.info('Loaded saved preference for feature', { feature, modelId: featurePref.modelId, providerId: featurePref.providerId });
            setModelId(featurePref.modelId);
            setProviderId(featurePref.providerId);
          } else if (featurePref) {
            // Preference exists but no modelId - log this unusual case
            logger.warn('Preference found but missing modelId', { feature, featurePref });
          } else {
            logger.info('No saved preference found for feature', { feature });
            // Leave modelId and providerId empty - UI will show "Select Model"
          }
        } else {
          logger.warn('API call failed or no AI data', { 
            hasData: !!apiResponse.data,
            hasAi: !!apiResponse.data?.ai,
            error: apiResponse.error,
            rawResponse: apiResponse
          });
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Failed to load model preference', { feature, error, errorMessage: error instanceof Error ? error.message : String(error) });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPreference();
    return () => { cancelled = true; };
  }, [feature]);

  const updatePreference = useCallback(async (newModelId: string, newProviderId: string) => {
    logger.info('updatePreference called', { 
      feature, 
      newModelId, 
      newProviderId,
      previousModelId: modelId,
      previousProviderId: providerId
    });
    
    // Optimistically update local state
    const previousModelId = modelId;
    const previousProviderId = providerId;

    setModelId(newModelId);
    setProviderId(newProviderId);

    // Persist to database if feature is provided
    if (feature) {
      try {
        const payload = {
          feature,
          providerId: newProviderId,
          modelId: newModelId
        };
        logger.info('Calling updateFeaturePreferenceAction with:', payload);
        
        const result = await updateFeaturePreferenceAction(payload);
        
        logger.info('updateFeaturePreferenceAction result:', result);

        if (!result.success) {
          logger.error('Failed to persist model preference', { feature, error: result.error });
          toast.error('Failed to save model preference');
          // Revert on failure
          setModelId(previousModelId);
          setProviderId(previousProviderId);
        } else {
          logger.info('Model preference saved successfully', { 
            feature, 
            modelId: newModelId, 
            providerId: newProviderId,
            resultData: result.data 
          });
        }
      } catch (error) {
        logger.error('Failed to persist model preference', { feature, error });
        toast.error('An error occurred while saving preference');
        setModelId(previousModelId);
        setProviderId(previousProviderId);
      }
    }
  }, [feature, modelId, providerId]);

  return { modelId, providerId, isLoading, updatePreference };
}

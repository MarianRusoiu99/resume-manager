'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants';
import {
  getAISettings,
  updateAIPreference,
  type AISettings,
  type ModelInfo,
} from '@/lib/client/ai-models.client';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Cpu, RefreshCw, AlertCircle, Check } from 'lucide-react';
import Link from 'next/link';

export default function AIModelsSettingsPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingFeature, setSavingFeature] = useState<string | null>(null);

  // Local state for selections (before saving)
  const [selections, setSelections] = useState<Record<string, { providerId: string; modelId: string }>>({});

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getAISettings();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (!result.data) {
        toast.error('Failed to load AI settings');
        return;
      }

      setSettings(result.data);

      // Initialize selections from loaded data
      const initialSelections: Record<string, { providerId: string; modelId: string }> = {};
      for (const f of result.data.features) {
        if (f.providerId && f.modelId) {
          initialSelections[f.feature.id] = {
            providerId: f.providerId,
            modelId: f.modelId,
          };
        }
      }
      setSelections(initialSelections);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load AI settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleProviderChange = (featureId: string, providerId: string) => {
    // When provider changes, reset model to first available
    const provider = settings?.availableProviders.find((p) => p.id === providerId);
    const firstModel = provider?.models[0];

    setSelections((prev) => ({
      ...prev,
      [featureId]: {
        providerId,
        modelId: firstModel?.id || '',
      },
    }));
  };

  const handleModelChange = (featureId: string, modelId: string) => {
    setSelections((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        modelId,
      },
    }));
  };

  const handleSavePreference = async (featureId: string) => {
    const selection = selections[featureId];

    try {
      setSavingFeature(featureId);

      const result = await updateAIPreference({
        feature: featureId,
        providerId: selection?.providerId || null,
        modelId: selection?.modelId || null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Preference saved');
      await loadSettings(); // Refresh to get updated names
    } catch (error) {
      console.error('Error saving preference:', error);
      toast.error('Failed to save preference');
    } finally {
      setSavingFeature(null);
    }
  };

  const handleClearPreference = async (featureId: string) => {
    try {
      setSavingFeature(featureId);

      const result = await updateAIPreference({
        feature: featureId,
        providerId: null,
        modelId: null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Preference cleared - will use default');
      setSelections((prev) => {
        const updated = { ...prev };
        delete updated[featureId];
        return updated;
      });
      await loadSettings();
    } catch (error) {
      console.error('Error clearing preference:', error);
      toast.error('Failed to clear preference');
    } finally {
      setSavingFeature(null);
    }
  };

  const getModelsForProvider = (providerId: string): ModelInfo[] => {
    const provider = settings?.availableProviders.find((p) => p.id === providerId);
    return provider?.models || [];
  };

  const hasChanges = (featureId: string): boolean => {
    const feature = settings?.features.find((f) => f.feature.id === featureId);
    const selection = selections[featureId];

    if (!feature) return false;
    if (!selection && !feature.providerId) return false;
    if (!selection && feature.providerId) return false;

    return (
      selection?.providerId !== feature.providerId ||
      selection?.modelId !== feature.modelId
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
          <p className="text-muted-foreground">Loading AI settings...</p>
        </div>
      );
    }

    if (!settings || settings.availableProviders.length === 0) {
      return (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No API Providers Configured</h3>
          <p className="text-muted-foreground mb-4">
            You need to add at least one API provider before configuring AI model preferences.
          </p>
          <Button asChild>
            <Link href={ROUTES.SETTINGS_API_KEYS}>Add API Provider</Link>
          </Button>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {settings.features.map((featureSetting) => {
          const { feature } = featureSetting;
          const selection = selections[feature.id];
          const currentProviderId = selection?.providerId || featureSetting.providerId || '';
          const currentModelId = selection?.modelId || featureSetting.modelId || '';
          const availableModels = currentProviderId ? getModelsForProvider(currentProviderId) : [];
          const isSaving = savingFeature === feature.id;
          const changed = hasChanges(feature.id);

          return (
            <Card key={feature.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Feature Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{feature.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>

                  {/* Current Selection Display */}
                  {featureSetting.providerName && featureSetting.modelName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">
                        Current: <span className="font-medium text-foreground">{featureSetting.modelName}</span>
                        {' '}from{' '}
                        <span className="font-medium text-foreground">{featureSetting.providerName}</span>
                      </span>
                    </div>
                  )}
                  {!featureSetting.providerName && (
                    <div className="text-sm text-muted-foreground italic">
                      Using default (first available model)
                    </div>
                  )}
                </div>

                {/* Selection Controls */}
                <div className="flex flex-col sm:flex-row gap-3 lg:w-auto w-full">
                  <div className="flex-1 min-w-[180px]">
                    <span className="block text-xs font-medium text-muted-foreground mb-1">
                      API Provider
                    </span>
                    <Select
                      value={currentProviderId}
                      onValueChange={(value) => handleProviderChange(feature.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select provider..." />
                      </SelectTrigger>
                      <SelectContent>
                        {settings.availableProviders
                          .filter((p) => p.isActive)
                          .map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <span className="block text-xs font-medium text-muted-foreground mb-1">
                      Model
                    </span>
                    <Select
                      value={currentModelId}
                      onValueChange={(value) => handleModelChange(feature.id, value)}
                      disabled={!currentProviderId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name || model.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 items-end">
                    <Button
                      size="sm"
                      onClick={() => handleSavePreference(feature.id)}
                      disabled={!changed || isSaving || !currentProviderId || !currentModelId}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    {featureSetting.providerId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearPreference(feature.id)}
                        disabled={isSaving}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="AI Model Settings"
        description="Configure which AI models to use for each feature"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'AI Models' },
        ]}
      />

      <PageContainer>
        <div className="mb-6">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> Configure your preferred AI model for each feature.
              If not set, the system will use the first available model from your configured providers.
            </p>
          </div>
        </div>

        {renderContent()}

        <div className="mt-8 flex justify-between items-center">
          <Button variant="outline" asChild>
            <Link href={ROUTES.SETTINGS_API_KEYS}>Manage API Keys</Link>
          </Button>
          <Button variant="ghost" onClick={loadSettings} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageContainer>
    </>
  );
}

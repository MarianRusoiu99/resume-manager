'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants';
import { apiV1, type AISettings, type ModelInfo } from '@/lib/client';
import { Page } from '@/components/layout/Page';
import { Button, Card } from '@/components/ui';
import { Callout } from '@/components/shared';
import { EmptyState, LoadingState } from '@/components/shared/states';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Cpu, RefreshCw, AlertCircle, Check } from 'lucide-react';
import Link from 'next/link';
import { useComponentLogger } from '@/hooks';

export default function AIModelsSettingsPage() {
  const log = useComponentLogger('AIModelsSettingsPage');
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingFeature, setSavingFeature] = useState<string | null>(null);

  // Local state for selections (before saving)
  const [selections, setSelections] = useState<Record<string, { providerId: string; modelId: string }>>({});

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await apiV1.SETTINGS.AI_MODELS.get<AISettings>();

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
      log.error('Error loading settings', error);
      toast.error('Failed to load AI settings');
    } finally {
      setIsLoading(false);
    }
  }, [log]);

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

      const result = await apiV1.SETTINGS.AI_MODELS.patch<unknown>({
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
      log.error('Error saving preference', error, { featureId });
      toast.error('Failed to save preference');
    } finally {
      setSavingFeature(null);
    }
  };

  const handleClearPreference = async (featureId: string) => {
    try {
      setSavingFeature(featureId);

      const result = await apiV1.SETTINGS.AI_MODELS.patch<unknown>({
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
      log.error('Error clearing preference', error, { featureId });
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
      return <LoadingState message="Loading AI settings..." minHeight="240px" size="sm" />;
    }

    if (!settings || settings.availableProviders.length === 0) {
      return (
        <EmptyState
          icon={AlertCircle}
          title="No API Providers Configured"
          description="You need to add at least one API provider before configuring AI model preferences."
          secondaryAction={
            <Button asChild>
              <Link href={ROUTES.SETTINGS_API_KEYS}>Add API Provider</Link>
            </Button>
          }
          withCard={true}
        />
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
                    <SearchableSelect
                      value={currentModelId}
                      onValueChange={(value) => handleModelChange(feature.id, value)}
                      disabled={!currentProviderId}
                      placeholder="Select model..."
                      searchPlaceholder="Search models..."
                      dialogTitle="Select a model"
                      maxListHeightClassName="h-72"
                      options={availableModels.map((model) => ({
                        value: model.id,
                        label: model.name || model.id,
                        description: model.name ? model.id : undefined,
                      }))}
                    />
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
    <Page
      title="AI Model Settings"
      description="Configure which AI models to use for each feature"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'AI Models' },
      ]}
      toolbar={
        <Callout>
          <p>
            <strong>Tip:</strong> Configure your preferred AI model for each feature. If not set, the system will use the first available model from your configured providers.
          </p>
        </Callout>
      }
    >
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
    </Page>
  );
}

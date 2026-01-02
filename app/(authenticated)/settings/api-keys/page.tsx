'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiV1, type ApiProvider, type ApiProviderModelInfo } from '@/lib/client';
import { Page } from '@/components/layout/Page';
import { Button, Card, Alert, AlertDescription } from '@/components/ui';
import { Callout } from '@/components/shared';
import { EmptyState, LoadingState } from '@/components/shared/states';
import { Plus, Trash2, Eye, EyeOff, Key, CheckCircle, XCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useComponentLogger } from '@/hooks';

// Provider configs fetched from backend
const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
};


import { ApiKeyForm } from '@/components/settings/ApiKeyForm';

export default function ApiKeysPage() {
  const log = useComponentLogger('ApiKeysPage');
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const loadProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await apiV1.SETTINGS.API_PROVIDERS.get<ApiProvider[]>();
      if (result.error || !result.data) {
        toast.error(result.error ?? 'Failed to load API providers');
        return;
      }
      setProviders(result.data);
    } catch (error) {
      log.error('Error loading providers', error);
      toast.error('Failed to load API providers');
    } finally {
      setIsLoading(false);
    }
  }, [log]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleAddSuccess = async () => {
    setShowAddDialog(false);
    await loadProviders();
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const result = await apiV1.SETTINGS.API_PROVIDER(id).delete<unknown>();

      if (!result.error) {
        toast.success('Provider deleted successfully');
        loadProviders();
      } else {
        toast.error(result.error ?? 'Failed to delete provider');
      }
    } catch (error) {
      log.error('Error deleting provider', error, { id });
      toast.error('Failed to delete provider');
    }
  };

  const handleToggleProvider = async (id: string, isActive: boolean) => {
    try {
      const result = await apiV1.SETTINGS.API_PROVIDER(id).patch<unknown>({ isActive: !isActive });

      if (!result.error) {
        toast.success(`Provider ${isActive ? 'disabled' : 'enabled'}`);
        loadProviders();
      } else {
        toast.error(result.error ?? 'Failed to toggle provider');
      }
    } catch (error) {
      log.error('Error toggling provider', error, { id });
      toast.error('Failed to toggle provider');
    }
  };

  const getProviderConfig = (providerType: string): { name: string; models: ApiProviderModelInfo[] } => {
    return {
      name: PROVIDER_NAMES[providerType] || providerType,
      models: [] as ApiProviderModelInfo[],
    };
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState message="Loading providers..." minHeight="240px" size="sm" />;
    }

    return (
      <div className="space-y-4">
        {providers.length === 0 && (
          <div className="mb-6">
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Welcome! To get started, please add an AI provider and your API key. This will allow the system to generate resumes and cover letters for you.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {providers.length === 0 ? (
          <EmptyState
            icon={Key}
            title="No API Providers Yet"
            description="Add your first API provider to start generating resumes"
            action={{
              label: 'Add Provider',
              onClick: () => setShowAddDialog(true),
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        ) : (
          providers.map((provider) => {
            const config = getProviderConfig(provider.provider);
            return (
              <Card key={provider.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                      {provider.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {config?.name || provider.provider} • {provider.keyPreview}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {provider.models && provider.models.map((model) => (
                        <span
                          key={model.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          title={model.description}
                        >
                          {model.name || model.id}
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Added {new Date(provider.createdAt).toLocaleDateString()}
                      {provider.lastUsedAt && (
                        <> • Last used {new Date(provider.lastUsedAt).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleProvider(provider.id, provider.isActive)}
                    >
                      {provider.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProvider(provider.id, provider.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  return (
    <>
      <Page
        title="API Keys"
        description="Manage your AI provider API keys securely"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'API Keys' },
        ]}
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        }
      >
        {renderContent()}
      </Page>

      {/* Add Provider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add API Provider</DialogTitle>
            <DialogDescription>
              Add a new AI provider with your API key. Your key will be encrypted and stored securely.
            </DialogDescription>
          </DialogHeader>

          <ApiKeyForm 
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddDialog(false)}
          />

          <Callout className="mt-4">
            <p className="text-sm">
              <strong>Note:</strong> Available models will be automatically detected from your API key when you add the provider.
            </p>
          </Callout>
        </DialogContent>
      </Dialog>
    </>
  );
} 

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api-client';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card } from '@/components/ui';
import { Plus, Trash2, Eye, EyeOff, Key, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Provider configs fetched from backend
const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
};

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

interface ApiProvider {
  id: string;
  name: string;
  provider: string;
  keyPreview: string;
  models: ModelInfo[]; // Changed from string[] to ModelInfo[]
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function ApiKeysPage() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add provider form state
  const [newProvider, setNewProvider] = useState({
    name: '',
    provider: 'openai',
    apiKey: '',
  });

  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/settings/api-providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      } else {
        toast.error('Failed to load API providers');
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Failed to load API providers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProvider.name || !newProvider.apiKey) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch('/api/settings/api-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProvider.name,
          provider: newProvider.provider,
          apiKey: newProvider.apiKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('API provider added successfully');
        setShowAddDialog(false);
        setNewProvider({
          name: '',
          provider: 'openai',
          apiKey: '',
        });
        loadProviders();
      } else {
        toast.error(data.error || 'Failed to add provider');
      }
    } catch (error) {
      console.error('Error adding provider:', error);
      toast.error('Failed to add provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiFetch(`/api/settings/api-providers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Provider deleted successfully');
        loadProviders();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete provider');
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Failed to delete provider');
    }
  };

  const handleToggleProvider = async (id: string, isActive: boolean) => {
    try {
      const response = await apiFetch(`/api/settings/api-providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(`Provider ${isActive ? 'disabled' : 'enabled'}`);
        loadProviders();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to toggle provider');
      }
    } catch (error) {
      console.error('Error toggling provider:', error);
      toast.error('Failed to toggle provider');
    }
  };

  const getProviderConfig = (providerType: string): { name: string; models: ModelInfo[] } => {
    return {
      name: PROVIDER_NAMES[providerType] || providerType,
      models: [] as ModelInfo[] // Models are now fetched dynamically from API
    };
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading providers...</p>
        </div>
      );
    }

    if (providers.length === 0) {
      return (
        <Card className="p-12 text-center">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No API Providers Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first API provider to start generating resumes
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {providers.map((provider) => {
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
        })}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Manage your AI provider API keys securely"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'API Keys' },
        ]}
      />

      <PageContainer>
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>

        {renderContent()}
      </PageContainer>


      {/* Add Provider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add API Provider</DialogTitle>
            <DialogDescription>
              Add a new AI provider with your API key. Your key will be encrypted and stored securely.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddProvider} className="space-y-4">
            <div>
              <label htmlFor="provider-name" className="block text-sm font-medium mb-2">
                Provider Name
              </label>
              <input
                id="provider-name"
                type="text"
                value={newProvider.name}
                onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                placeholder="e.g., My OpenAI Key"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="provider-type" className="block text-sm font-medium mb-2">
                Provider Type
              </label>
              <select
                id="provider-type"
                value={newProvider.provider}
                onChange={(e) =>
                  setNewProvider({
                    ...newProvider,
                    provider: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                {Object.entries(PROVIDER_NAMES).map(([key, name]) => (
                  <option key={key} value={key} className="bg-background text-foreground">
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                  placeholder={`Enter your ${getProviderConfig(newProvider.provider)?.name} API key`}
                  className="w-full px-3 py-2 border rounded-md pr-10 font-mono text-sm"
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your API key will be encrypted before storage. Only the first few characters will be visible.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Available models will be automatically detected from your API key when you add the provider.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Provider'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 

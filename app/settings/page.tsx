'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, Button } from '@/components/ui';
import APIKeyForm from '@/components/settings/APIKeyForm';
import APIKeyList from '@/components/settings/APIKeyList';

export interface APIKeyItem {
  id: string;
  provider: string;
  maskedKey: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export default function SettingsPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<APIKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAPIKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/api-keys');
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      showMessage('error', 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAPIKeys();
  }, [fetchAPIKeys]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAddKey = async (provider: string, apiKey: string) => {
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });

      if (response.ok) {
        showMessage('success', 'API key added successfully');
        toast.success('API key added successfully');
        setShowAddForm(false);
        await fetchAPIKeys();
      } else {
        const data = await response.json();
        const errorMsg = data.error || 'Failed to add API key';
        showMessage('error', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error adding API key:', error);
      showMessage('error', 'Failed to add API key');
      toast.error('Failed to add API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/api-keys/${keyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('success', 'API key deleted successfully');
        toast.success('API key deleted successfully');
        await fetchAPIKeys();
      } else {
        const data = await response.json();
        const errorMsg = data.error || 'Failed to delete API key';
        showMessage('error', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      showMessage('error', 'Failed to delete API key');
      toast.error('Failed to delete API key');
    }
  };

  const handleValidateKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/settings/api-keys/${keyId}/validate`, {
        method: 'POST'
      });

      if (response.ok) {
        showMessage('success', 'API key is valid');
        toast.success('API key is valid');
      } else {
        const data = await response.json();
        const errorMsg = data.error || 'API key validation failed';
        showMessage('error', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      showMessage('error', 'Failed to validate API key');
      toast.error('Failed to validate API key');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your AI provider API keys
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* API Keys Section */}
        <Card
          title="API Keys"
          description="Add and manage your AI provider API keys. Keys are encrypted and stored securely."
        >
          {!showAddForm && (
            <div className="mb-6">
              <Button onClick={() => setShowAddForm(true)}>
                + Add API Key
              </Button>
            </div>
          )}

          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Add New API Key</h3>
              <APIKeyForm
                onSubmit={handleAddKey}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          <APIKeyList
            apiKeys={apiKeys}
            onDelete={handleDeleteKey}
            onValidate={handleValidateKey}
          />

          {apiKeys.length === 0 && !showAddForm && (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No API keys configured</p>
              <p className="text-sm">
                Add an API key to start generating AI-optimized resumes
              </p>
            </div>
          )}
        </Card>

        {/* Information Section */}
        <Card
          title="About API Keys"
          description="Learn how API keys are used and kept secure"
          className="mt-6"
        >
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">What are API keys used for?</h4>
              <p>
                API keys allow this application to connect to AI providers like OpenAI
                to generate tailored resumes. Your API key is used exclusively for your
                resume generation requests.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">How are keys secured?</h4>
              <p>
                All API keys are encrypted using AES-256-GCM encryption before being
                stored in the database. Keys are only decrypted when needed to make
                API calls on your behalf.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Supported providers</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>OpenAI:</strong> GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
                </li>
                <li>
                  <strong>Anthropic:</strong> Coming soon
                </li>
                <li>
                  <strong>Google:</strong> Coming soon
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Getting API keys</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  OpenAI: Visit{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    platform.openai.com/api-keys
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

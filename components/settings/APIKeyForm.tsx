'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

interface APIKeyFormProps {
  onSubmit: (provider: string, apiKey: string) => void;
  onCancel: () => void;
}

export default function APIKeyForm({ onSubmit, onCancel }: APIKeyFormProps) {
  const [provider, setProvider] = useState<string>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(provider, apiKey);
      // Reset form on success
      setApiKey('');
      setProvider('openai');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Provider
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={submitting}
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic" disabled>
            Anthropic (Coming Soon)
          </option>
          <option value="google" disabled>
            Google (Coming Soon)
          </option>
        </select>
      </div>

      {/* API Key Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              provider === 'openai'
                ? 'sk-...'
                : 'Enter your API key'
            }
            className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
            required
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            disabled={submitting}
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        {provider === 'openai' && (
          <p className="mt-1 text-xs text-gray-500">
            OpenAI API keys start with &ldquo;sk-&rdquo;
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Key'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

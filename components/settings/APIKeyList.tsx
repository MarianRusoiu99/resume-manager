'use client';

import { Button } from '@/components/ui';

interface APIKeyItem {
  id: string;
  provider: string;
  maskedKey: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface APIKeyListProps {
  apiKeys: APIKeyItem[];
  onDelete: (keyId: string) => void;
  onValidate: (keyId: string) => void;
}

export default function APIKeyList({ apiKeys, onDelete, onValidate }: APIKeyListProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google'
    };
    return labels[provider] || provider;
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: 'bg-green-100 text-green-800',
      anthropic: 'bg-purple-100 text-purple-800',
      google: 'bg-blue-100 text-blue-800'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
  };

  if (apiKeys.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {apiKeys.map((key) => (
        <div
          key={key.id}
          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getProviderColor(
                    key.provider
                  )}`}
                >
                  {getProviderLabel(key.provider)}
                </span>
                {key.isActive ? (
                  <span className="text-xs text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-xs text-gray-500">Inactive</span>
                )}
              </div>

              <div className="font-mono text-sm text-gray-700 mb-2">
                {key.maskedKey}
              </div>

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Added:</span> {formatDate(key.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Last used:</span>{' '}
                  {formatDate(key.lastUsedAt)}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 ml-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onValidate(key.id)}
              >
                Validate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(key.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

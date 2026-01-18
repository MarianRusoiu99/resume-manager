'use client';

import { useEffect } from 'react';
import { Settings, Key } from 'lucide-react';
import { RouteErrorCard } from '@/components/core/feedback/RouteErrorCard';
import { createComponentLogger } from '@/lib/utils/client-logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Settings Route Error Boundary
 * 
 * Handles errors specific to the settings section.
 */
const log = createComponentLogger('SettingsError');

export default function SettingsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    log.error('Settings error', error);
  }, [error]);

  // Detect specific error types
  const isApiKeyError = error.message?.toLowerCase().includes('api key') ||
                        error.message?.toLowerCase().includes('encrypt') ||
                        error.message?.toLowerCase().includes('decrypt');
  const isSaveError = error.message?.toLowerCase().includes('save');

  const getErrorTitle = () => {
    if (isApiKeyError) return 'API Key Error';
    if (isSaveError) return 'Save Error';
    return 'Settings Error';
  };

  const getErrorDescription = () => {
    if (isApiKeyError) return 'There was a problem with your API key configuration.';
    if (isSaveError) return 'Failed to save your settings.';
    return 'Something went wrong while loading your settings.';
  };

  return (
    <RouteErrorCard
      error={error}
      reset={reset}
      title={getErrorTitle()}
      description={getErrorDescription()}
      sectionIcon={Settings}
      sectionLabel="Reload Settings"
      sectionHref="/settings"
    >
      {isApiKeyError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            <Key className="inline-block mr-1 h-4 w-4" />
            API Key Troubleshooting
          </p>
          <ul className="mt-2 list-disc list-inside text-amber-700 dark:text-amber-300 space-y-1">
            <li>Make sure your API key is valid and not expired</li>
            <li>Check that the ENCRYPTION_KEY environment variable is set</li>
            <li>Try removing and re-adding the API key</li>
          </ul>
        </div>
      )}
    </RouteErrorCard>
  );
}

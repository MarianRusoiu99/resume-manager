'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Settings, Home, Key } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Settings Route Error Boundary
 * 
 * Handles errors specific to the settings section.
 */
export default function SettingsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Settings error:', error);
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
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{getErrorTitle()}</CardTitle>
          <CardDescription>{getErrorDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="font-medium">Error details:</p>
            <p className="mt-1 break-words">{error.message || 'An unexpected error occurred'}</p>
            {error.digest && (
              <p className="mt-1 text-xs">Error ID: {error.digest}</p>
            )}
          </div>

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

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Reload Settings
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

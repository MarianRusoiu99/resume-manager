'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Sparkles, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Generate Route Error Boundary
 * 
 * Handles errors specific to the resume generation section.
 * Provides recovery options for AI generation failures.
 */
export default function GenerateError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Generate error:', error);
  }, [error]);

  // Detect common AI/API errors
  const isRateLimitError = error.message?.toLowerCase().includes('rate limit');
  const isApiKeyError = error.message?.toLowerCase().includes('api key') || 
                        error.message?.toLowerCase().includes('unauthorized');
  const isTimeoutError = error.message?.toLowerCase().includes('timeout');

  const getErrorTitle = () => {
    if (isRateLimitError) return 'Rate Limit Exceeded';
    if (isApiKeyError) return 'API Configuration Error';
    if (isTimeoutError) return 'Generation Timeout';
    return 'Generation Error';
  };

  const getErrorDescription = () => {
    if (isRateLimitError) {
      return 'You\'ve made too many requests. Please wait a moment and try again.';
    }
    if (isApiKeyError) {
      return 'There\'s an issue with your API configuration. Please check your settings.';
    }
    if (isTimeoutError) {
      return 'The generation took too long. Try with a shorter job description.';
    }
    return 'Something went wrong during resume generation.';
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            {isApiKeyError && (
              <Button variant="outline" asChild className="flex-1">
                <Link href="/settings">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Check Settings
                </Link>
              </Button>
            )}
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

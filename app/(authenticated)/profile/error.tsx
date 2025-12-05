'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, User, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Profile Route Error Boundary
 * 
 * Handles errors specific to the profile editing section.
 */
export default function ProfileError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Profile error:', error);
  }, [error]);

  // Detect save-related errors
  const isSaveError = error.message?.toLowerCase().includes('save') || 
                      error.message?.toLowerCase().includes('update');
  const isValidationError = error.message?.toLowerCase().includes('validation');

  const getErrorTitle = () => {
    if (isValidationError) return 'Validation Error';
    if (isSaveError) return 'Save Error';
    return 'Profile Error';
  };

  const getErrorDescription = () => {
    if (isValidationError) return 'Some of your profile data is invalid. Please check your entries.';
    if (isSaveError) return 'Failed to save your profile changes.';
    return 'Something went wrong while loading your profile.';
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
            <Button variant="outline" asChild className="flex-1">
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Reload Profile
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

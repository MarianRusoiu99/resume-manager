'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface RouteErrorCardProps {
  /** Error object from Next.js error boundary */
  error: Error & { digest?: string };
  /** Reset function to retry the failed operation */
  reset: () => void;
  /** Title of the error card */
  title: string;
  /** Description of what went wrong */
  description: string;
  /** Icon for the reload section button */
  sectionIcon: LucideIcon;
  /** Label for the reload section button */
  sectionLabel: string;
  /** Link to the section to reload */
  sectionHref: string;
  /** Optional additional content (e.g., troubleshooting tips) */
  children?: ReactNode;
}

/**
 * Reusable error card for route error boundaries
 * 
 * Provides consistent error UI across different authenticated routes
 * with customizable section-specific messaging and actions.
 */
export function RouteErrorCard({
  error,
  reset,
  title,
  description,
  sectionIcon: SectionIcon,
  sectionLabel,
  sectionHref,
  children,
}: RouteErrorCardProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="font-medium">Error details:</p>
            <p className="mt-1 break-words">{error.message || 'An unexpected error occurred'}</p>
            {error.digest && (
              <p className="mt-1 text-xs">Error ID: {error.digest}</p>
            )}
          </div>

          {children}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href={sectionHref}>
                <SectionIcon className="mr-2 h-4 w-4" />
                {sectionLabel}
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

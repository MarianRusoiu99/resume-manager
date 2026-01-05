'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  onReset?: () => void;
}

export function FeatureErrorBoundary({
  children,
  featureName,
  onReset,
}: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-destructive">{featureName} Error</h3>
              <p className="text-sm text-muted-foreground">
                This feature encountered an error. You can try again or continue using other
                features.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onReset?.();
                  window.location.reload();
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

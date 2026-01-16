'use client';

import { useOptimistic } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface ResourceListProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyState: {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  gridCols?: 1 | 2 | 3 | 4;
}

export function ResourceList<T extends { id: string }>({
  items,
  renderItem,
  emptyState,
  isLoading = false,
  error = null,
  className = '',
  gridCols = 3,
}: ResourceListProps<T>) {
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridCols} gap-6 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl bg-muted/20 min-h-[300px]">
        <h3 className="text-xl font-semibold mb-2">{emptyState.title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{emptyState.description}</p>
        {emptyState.actionLabel && emptyState.onAction && (
          <Button onClick={emptyState.onAction}>
            <Plus className="mr-2 h-4 w-4" />
            {emptyState.actionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridCols} gap-6 ${className}`}>
      {items.map((item) => (
        <div key={item.id}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

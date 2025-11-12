/**
 * Preview State Display Component
 * Responsible for showing loading, error, and empty states
 * Single Responsibility: Display preview states
 */

'use client';

interface PreviewStateProps {
  type: 'loading' | 'error' | 'empty';
  message?: string;
}

export function PreviewState({ type, message }: Readonly<PreviewStateProps>) {
  const getContent = () => {
    switch (type) {
      case 'loading':
        return {
          className: 'text-muted-foreground',
          message: message || 'Loading template...',
        };
      case 'error':
        return {
          className: 'text-destructive',
          message: message || 'Failed to load preview',
        };
      case 'empty':
        return {
          className: 'text-muted-foreground',
          message: message || 'No preview available',
        };
    }
  };

  const { className, message: displayMessage } = getContent();

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
      {displayMessage}
    </div>
  );
}

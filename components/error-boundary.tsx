"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/utils/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Fallback UI to show when error occurs */
  fallback?: React.ReactNode;
  /** Custom error handler */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to show the reset button */
  showReset?: boolean;
  /** Custom reset handler */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * 
 * Features:
 * - Logs errors to the application logger
 * - Shows a user-friendly error message
 * - Provides a reset button to recover
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to application logger
    logger.error(
      "React Error Boundary caught an error",
      error,
      {
        componentStack: errorInfo.componentStack,
      }
    );

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.props.showReset ? this.handleReset : undefined}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

/**
 * Default error fallback UI component
 */
export function ErrorFallback({ error, onReset }: Readonly<ErrorFallbackProps>) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {error?.message || "An unexpected error occurred. Please try again."}
      </p>
      {onReset && (
        <Button onClick={onReset} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Hook to use error boundary imperatively (for async errors)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const showBoundary = useErrorBoundary();
 *   
 *   const handleClick = async () => {
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       showBoundary(error as Error);
 *     }
 *   };
 * }
 * ```
 */
export function useErrorBoundary() {
  const [, setState] = React.useState();
  
  return React.useCallback((error: Error) => {
    setState(() => {
      throw error;
    });
  }, []);
}

/**
 * withErrorBoundary - HOC to wrap a component with an error boundary
 * 
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: <p>Error in MyComponent</p>
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
): React.FC<P> {
  const displayName = Component.displayName || Component.name || "Component";
  
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}

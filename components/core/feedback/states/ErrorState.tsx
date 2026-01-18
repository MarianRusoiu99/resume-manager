"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Error title */
  title?: string;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Text for retry button */
  retryText?: string;
  /** Variant of the error display */
  variant?: "inline" | "full";
  /** Additional class names */
  className?: string;
}

/**
 * ErrorState - Standardized error display component
 * 
 * Use this component to display error states consistently across the app.
 * 
 * @example
 * ```tsx
 * if (error) {
 *   return (
 *     <ErrorState 
 *       message={error.message} 
 *       onRetry={refetch}
 *     />
 *   );
 * }
 * ```
 */
export function ErrorState({
  message = "Something went wrong. Please try again.",
  title = "Error",
  onRetry,
  retryText = "Try Again",
  variant = "full",
  className,
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <Alert variant="destructive" className={cn("my-4", className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{message}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {retryText}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center min-h-[300px] p-8",
        className
      )}
    >
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryText}
        </Button>
      )}
    </div>
  );
}

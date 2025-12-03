"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  /** Loading message to display */
  message?: string;
  /** Size of the loading spinner */
  size?: "sm" | "md" | "lg";
  /** Minimum height for the container */
  minHeight?: string;
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

/**
 * LoadingState - Standardized loading indicator component
 * 
 * Use this component to display loading states consistently across the app.
 * 
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <LoadingState message="Loading your resumes..." />;
 * }
 * ```
 */
export function LoadingState({
  message = "Loading...",
  size = "md",
  minHeight = "400px",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        className
      )}
      style={{ minHeight }}
    >
      <Loader2 className={cn("animate-spin text-primary mb-4", sizeClasses[size])} />
      {message && (
        <p className="text-muted-foreground text-sm">{message}</p>
      )}
    </div>
  );
}

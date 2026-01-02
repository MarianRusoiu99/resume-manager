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

import { Spinner } from "@/components/shared/Spinner";

/**
 * LoadingState - Standardized loading indicator component
 * 
 * Use this component to display loading states consistently across the app.
 * Refactored to use the unified Spinner component.
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
        "flex flex-col items-center justify-center text-center animate-in fade-in duration-500",
        className
      )}
      style={{ minHeight }}
    >
      <Spinner size={size} label={message} />
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, type LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary";
  disabled?: boolean;
}

interface EmptyStateProps {
  /** Icon to display (LucideIcon component or custom ReactNode) */
  icon?: LucideIcon | ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action - can be a ReactNode for custom components (e.g., import button) */
  secondaryAction?: ReactNode;
  /** Secondary actions as array of buttons */
  secondaryActions?: EmptyStateAction[];
  /** Whether to wrap in a Card */
  withCard?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * EmptyState - Standardized empty state component
 * 
 * Use this component to display empty states consistently across the app.
 * 
 * @example
 * ```tsx
 * if (items.length === 0) {
 *   return (
 *     <EmptyState
 *       icon={FileText}
 *       title="No resumes yet"
 *       description="Generate your first AI-optimized resume"
 *       action={{
 *         label: "Generate Resume",
 *         onClick: () => router.push('/generate'),
 *         icon: <Plus className="h-4 w-4" />,
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function EmptyState({
  icon: IconProp = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  secondaryActions = [],
  withCard = true,
  className,
}: EmptyStateProps) {
  // Handle both LucideIcon components and ReactNode icons
  const renderIcon = () => {
    if (typeof IconProp === "function") {
      const Icon = IconProp as LucideIcon;
      return <Icon className="h-12 w-12 text-muted-foreground/50" />;
    }
    return IconProp;
  };

  const hasActions = action || secondaryAction || secondaryActions.length > 0;

  const content = (
    <div className={cn("flex flex-col items-center text-center py-12 px-4", className)}>
      <div className="mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {hasActions && (
        <div className="flex flex-wrap gap-3 justify-center">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              disabled={action.disabled}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          )}
          {/* Custom secondary action (e.g., import button) */}
          {secondaryAction}
          {/* Array of secondary action buttons */}
          {secondaryActions.map((sa, index) => (
            <Button
              key={index}
              onClick={sa.onClick}
              variant={sa.variant || "outline"}
              disabled={sa.disabled}
            >
              {sa.icon && <span className="mr-2">{sa.icon}</span>}
              {sa.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  if (withCard) {
    return <Card className="w-full">{content}</Card>;
  }

  return content;
}

/**
 * SearchEmptyState - Specialized empty state for search results
 */
interface SearchEmptyStateProps {
  searchTerm: string;
  onClear?: () => void;
  className?: string;
}

export function SearchEmptyState({
  searchTerm,
  onClear,
  className,
}: SearchEmptyStateProps) {
  return (
    <EmptyState
      icon={FileText}
      title="No results found"
      description={`No items match "${searchTerm}". Try a different search term.`}
      action={
        onClear
          ? {
              label: "Clear Search",
              onClick: onClear,
              variant: "outline",
            }
          : undefined
      }
      className={className}
    />
  );
}

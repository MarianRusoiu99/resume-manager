import * as React from "react"

import { cn } from "@/lib/utils"

interface LegacyInputProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, LegacyInputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    if (label || error || helperText) {
      return (
        <div className="w-full">
          {label && (
            <label htmlFor={props.id} className="block text-sm font-medium text-muted-foreground mb-1">
              {label}
            </label>
          )}
          <input
            type={type}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              error
                ? "border-destructive text-destructive"
                : "",
              className
            )}
            ref={ref}
            {...props}
          />
          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
          {helperText && !error && <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

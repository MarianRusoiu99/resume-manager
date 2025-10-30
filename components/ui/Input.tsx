import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-muted-foreground mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm bg-card-foreground/5
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-muted/10 disabled:cursor-not-allowed
            ${
              error
                ? "border-destructive focus:border-destructive focus:ring-destructive text-destructive"
                : "border-border focus:border-primary focus:ring-primary text-foreground"
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

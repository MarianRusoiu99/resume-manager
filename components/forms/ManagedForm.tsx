"use client";

import { FormProvider, useForm, useWatch, UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType } from "zod";
import { GenericForm } from "./GenericForm";
import { FieldConfig } from "@/lib/forms/form-schema";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef, useCallback, memo } from "react";

interface ManagedFormProps<T extends FieldValues> {
  /** Zod validation schema */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodType requires any for proper inference with react-hook-form
  schema: ZodType<any, any, any>;
  /** Initial form data */
  defaultValues: T;
  /** Field configuration for GenericForm */
  fields: FieldConfig<T>[];
  /** Form submission handler */
  onSubmit: (data: T) => void | Promise<void>;
  /** Optional change handler (called on every valid change) */
  onUpdate?: (data: T) => void;
  /** Whether to auto-save on change (debounced) */
  autoSave?: boolean;
  /** Debounce time for auto-save in ms */
  debounceMs?: number;
  /** Additional className for the form element */
  className?: string;
  /** Render prop for form footer/actions */
  children?: ReactNode | ((form: UseFormReturn<T>) => ReactNode);
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Number of columns for the grid */
  columns?: 1 | 2;
}

/**
 * ManagedForm - Connects GenericForm with react-hook-form and Zod validation
 */
export const ManagedForm = memo(function ManagedForm<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  onSubmit,
  onUpdate,
  autoSave = false,
  debounceMs = 500,
  className,
  children,
  disabled = false,
  columns = 2,
}: Readonly<ManagedFormProps<T>>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form DefaultValues type requires cast
    defaultValues: defaultValues as any,
    mode: "onBlur",
  });

  const { control, formState: { isDirty }, getValues, reset } = form;
  const values = useWatch({ control });
  const prevValuesRef = useRef<T>(defaultValues);
  const prevDefaultValuesRef = useRef<T>(defaultValues);

    // Sync form with external defaultValues changes (when not dirty)
  useEffect(() => {
    if (!isDirty && JSON.stringify(defaultValues) !== JSON.stringify(prevDefaultValuesRef.current)) {
      reset(defaultValues);
      prevDefaultValuesRef.current = defaultValues;
    }
  }, [defaultValues, isDirty, reset]);

  // Auto-save logic
  useEffect(() => {
    const currentValues = getValues();
    if (autoSave && isDirty && JSON.stringify(currentValues) !== JSON.stringify(prevValuesRef.current)) {
      const timeoutId = setTimeout(async () => {
        if (onUpdate) {
          onUpdate(currentValues);
        }
        prevValuesRef.current = currentValues;
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    }
  }, [values, isDirty, onUpdate, autoSave, debounceMs, getValues]);

  const handleFormSubmit = useCallback((e?: React.BaseSyntheticEvent) => {
    return form.handleSubmit(async (data) => {
      await onSubmit(data);
    })(e);
  }, [form, onSubmit]);

  const handleFieldChange = useCallback((newData: T) => {
    Object.entries(newData).forEach(([key, value]) => {
      form.setValue(key as Path<T>, value as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });

    if (onUpdate && !autoSave) {
      onUpdate(newData);
    }
  }, [form, onUpdate, autoSave]);

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleFormSubmit}
        className={cn("space-y-6", className)}
      >
        <GenericForm
          fields={fields}
          data={values as T}
          onChange={handleFieldChange}
          columns={columns}
          disabled={disabled || form.formState.isSubmitting}
        />

        {typeof children === "function" 
          ? children(form)
          : children}
      </form>
    </FormProvider>
  );
});

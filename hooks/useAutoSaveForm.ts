'use client';

import { useEffect, useRef } from 'react';
import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType } from 'zod';

interface UseAutoSaveFormProps<T extends FieldValues> extends UseFormProps<T> {
  schema: ZodType<T>;
  onSave: (data: T) => void | Promise<void>;
  debounceMs?: number;
}

export function useAutoSaveForm<T extends FieldValues>({
  schema,
  onSave,
  debounceMs = 500,
  ...formProps
}: UseAutoSaveFormProps<T>) {
  const form = useForm<T>({
    ...formProps,
    resolver: zodResolver(schema as any),
  });

  const { watch, reset, formState: { isDirty } } = form;
  const values = watch();
  const prevValuesRef = useRef<T>(formProps.defaultValues as T);

  // Auto-save logic
  useEffect(() => {
    // Only save if dirty and values changed
    if (isDirty && JSON.stringify(values) !== JSON.stringify(prevValuesRef.current)) {
      const timeoutId = setTimeout(async () => {
        await onSave(values);
        prevValuesRef.current = values;
        // Optional: mark as clean after save if needed
        // reset(values, { keepValues: true }); 
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    }
  }, [values, isDirty, onSave, debounceMs]);

  // Handle external updates to defaultValues
  useEffect(() => {
    if (formProps.defaultValues && JSON.stringify(formProps.defaultValues) !== JSON.stringify(prevValuesRef.current)) {
      reset(formProps.defaultValues as T);
      prevValuesRef.current = formProps.defaultValues as T;
    }
  }, [formProps.defaultValues, reset]);

  return form;
}

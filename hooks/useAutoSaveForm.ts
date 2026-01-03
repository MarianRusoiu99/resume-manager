'use client';

import { useEffect, useRef } from 'react';
import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType } from 'zod';
import { createComponentLogger } from '@/lib/utils/client-logger';

const logger = createComponentLogger('useAutoSaveForm');

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        try {
          await onSave(values);
          prevValuesRef.current = values;
          // Optional: mark as clean after save if needed
          // reset(values, { keepValues: true }); 
        } catch (error) {
          logger.error('Auto-save failed', error);
        }
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSaveForm as useAutoSave } from './useAutoSaveForm';
import { z } from 'zod';

const schema = z.object({
  name: z.string()
});

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const onSave = vi.fn();
    const initialData = { name: 'John' };

    const { result } = renderHook(() => 
      useAutoSave({ defaultValues: initialData, onSave, schema })
    );

    expect(result.current.getValues()).toEqual(initialData);
  });

  it('should call onSave when form values change and it is dirty', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const initialData = { name: 'John' };

    const { result } = renderHook(() => 
      useAutoSave({ defaultValues: initialData, onSave, debounceMs: 100, schema })
    );

    // Manually change value and mark as dirty
    await act(async () => {
      result.current.setValue('name', 'Jane', { shouldDirty: true });
    });

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(onSave).toHaveBeenCalledWith({ name: 'Jane' });
  });

  it('should not call onSave if not dirty', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const initialData = { name: 'John' };

    const { result } = renderHook(() => 
      useAutoSave({ defaultValues: initialData, onSave, debounceMs: 100, schema })
    );

    // Change value but NOT marked as dirty
    await act(async () => {
      result.current.setValue('name', 'Jane', { shouldDirty: false });
    });

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(onSave).not.toHaveBeenCalled();
  });
});

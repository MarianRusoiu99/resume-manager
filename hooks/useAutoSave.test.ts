import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should call onSave after delay when data changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const initialData = { name: 'John' };

    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 1000 }),
      { initialProps: { data: initialData } }
    );

    // Change data
    const updatedData = { name: 'Jane' };
    rerender({ data: updatedData });

    // Fast-forward time and run all timers
    await vi.runAllTimersAsync();

    expect(onSave).toHaveBeenCalledWith(updatedData);
  });

  it('should not call onSave if data has not changed', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const data = { name: 'John' };

    renderHook(() => useAutoSave({ data, onSave, delay: 1000 }));

    // Fast-forward time
    await vi.runAllTimersAsync();

    expect(onSave).not.toHaveBeenCalled();
  });

  it('should debounce multiple rapid changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const initialData = { name: 'John' };

    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 1000 }),
      { initialProps: { data: initialData } }
    );

    // Make multiple rapid changes
    rerender({ data: { name: 'Jane' } });
    vi.advanceTimersByTime(500);
    
    rerender({ data: { name: 'Bob' } });
    vi.advanceTimersByTime(500);
    
    rerender({ data: { name: 'Alice' } });

    // Only after the full delay should onSave be called
    await vi.runAllTimersAsync();

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ name: 'Alice' });
  });

  it('should not call onSave when disabled', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const initialData = { name: 'John' };

    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 1000, enabled: false }),
      { initialProps: { data: initialData } }
    );

    // Change data
    rerender({ data: { name: 'Jane' } });

    // Fast-forward time
    await vi.runAllTimersAsync();

    expect(onSave).not.toHaveBeenCalled();
  });

  it('should use custom delay', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const initialData = { name: 'John' };

    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 3000 }),
      { initialProps: { data: initialData } }
    );

    // Change data
    rerender({ data: { name: 'Jane' } });

    // Should not be called before delay
    vi.advanceTimersByTime(2000);
    expect(onSave).not.toHaveBeenCalled();

    // Should be called after delay
    await vi.runAllTimersAsync();

    expect(onSave).toHaveBeenCalledWith({ name: 'Jane' });
  });
});

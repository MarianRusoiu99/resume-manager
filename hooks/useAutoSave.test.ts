/**
 * Tests for useAutoSave hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';

describe('useAutoSave', () => {
  let onSaveMock: any;

  beforeEach(() => {
    onSaveMock = vi.fn().mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should not call onSave immediately', () => {
    const data = { name: 'Test' };
    
    renderHook(() => useAutoSave({ data, onSave: onSaveMock as any }));

    expect(onSaveMock).not.toHaveBeenCalled();
  });

  it('should call onSave after delay when data changes', async () => {
    const initialData = { name: 'Initial' };
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave: onSaveMock as any }),
      { initialProps: { data: initialData } }
    );

    // Change data
    const newData = { name: 'Updated' };
    rerender({ data: newData });

    // Fast-forward time
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalledWith(newData);
      expect(onSaveMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should debounce multiple rapid changes', async () => {
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave: onSaveMock as any }),
      { initialProps: { data: { name: 'Initial' } } }
    );

    // Make multiple rapid changes
    rerender({ data: { name: 'Change 1' } });
    vi.advanceTimersByTime(500);
    
    rerender({ data: { name: 'Change 2' } });
    vi.advanceTimersByTime(500);
    
    rerender({ data: { name: 'Change 3' } });
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      // Should only be called once with the final value
      expect(onSaveMock).toHaveBeenCalledTimes(1);
      expect(onSaveMock).toHaveBeenCalledWith({ name: 'Change 3' });
    });
  });

  it('should not call onSave when data does not change', () => {
    const data = { name: 'Test' };
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave: onSaveMock as any }),
      { initialProps: { data } }
    );

    // Rerender with same data
    rerender({ data });

    vi.advanceTimersByTime(2000);

    expect(onSaveMock).not.toHaveBeenCalled();
  });

  it('should respect custom delay', async () => {
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave: onSaveMock as any, delay: 5000 }),
      { initialProps: { data: { name: 'Initial' } } }
    );

    rerender({ data: { name: 'Updated' } });

    // Should not be called after 2 seconds
    vi.advanceTimersByTime(2000);
    expect(onSaveMock).not.toHaveBeenCalled();

    // Should be called after 5 seconds
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should not call onSave when disabled', () => {
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave: onSaveMock as any, enabled: false }),
      { initialProps: { data: { name: 'Initial' } } }
    );

    rerender({ data: { name: 'Updated' } });

    vi.advanceTimersByTime(2000);

    expect(onSaveMock).not.toHaveBeenCalled();
  });

  it('should not call onSave multiple times concurrently', async () => {
    const slowSave = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave: slowSave as any }),
      { initialProps: { data: { name: 'Initial' } } }
    );

    // Trigger first save
    rerender({ data: { name: 'Update 1' } });
    vi.advanceTimersByTime(2000);

    // Trigger second save while first is in progress
    rerender({ data: { name: 'Update 2' } });
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      // Should only call once (second call is prevented by isSavingRef check)
      expect(slowSave).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle save errors gracefully', async () => {
    const errorSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave: errorSave as any }),
      { initialProps: { data: { name: 'Initial' } } }
    );

    rerender({ data: { name: 'Updated' } });
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(errorSave).toHaveBeenCalled();
    });

    // Should not throw error
    expect(() => {
      vi.advanceTimersByTime(100);
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });

  it('should cancel pending save on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ data }) => useAutoSave({ data, onSave: onSaveMock as any }),
      { initialProps: { data: { name: 'Initial' } } }
    );

    rerender({ data: { name: 'Updated' } });

    // Unmount before timeout fires
    unmount();

    vi.advanceTimersByTime(2000);

    expect(onSaveMock).not.toHaveBeenCalled();
  });
});

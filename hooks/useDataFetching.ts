"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Options for data fetching hooks
 */
interface UseFetchOptions<T> {
  /** Initial data before fetch completes */
  initialData?: T;
  /** Whether to fetch immediately on mount */
  immediate?: boolean;
  /** Whether to refetch when page becomes visible */
  refetchOnFocus?: boolean;
  /** Transform the response data */
  transform?: (data: unknown) => T;
  /** Dependencies that trigger refetch when changed */
  deps?: unknown[];
}

/**
 * Return type for data fetching hooks
 */
interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (data: T | ((prev: T | null) => T)) => void;
}

/**
 * Generic data fetching hook with loading, error, and refetch capabilities
 * 
 * @example
 * ```tsx
 * const { data: resumes, isLoading, error, refetch } = useFetch<Resume[]>(
 *   '/api/v1/resume/generate',
 *   { refetchOnFocus: true }
 * );
 * ```
 */
export function useFetch<T>(
  url: string | null,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    initialData,
    immediate = true,
    refetchOnFocus = false,
    transform,
    deps = [],
  } = options;

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(immediate && !!url);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Store transform in a ref to avoid dependency issues
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const fetchData = useCallback(async () => {
    if (!url) return;

    // Cancel any pending request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as { data: any; error: string | null };

      if (result.error) {
        throw new Error(result.error);
      }

      let transformed: unknown = result.data;

      if (transformRef.current) {
        transformed = transformRef.current(transformed);
      }

      setData(transformed as T);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  // Serialize deps for stable comparison
  const depsKey = JSON.stringify(deps);

  // Initial fetch
  useEffect(() => {
    if (immediate && url) {
      fetchData();
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [url, immediate, fetchData, depsKey]);

  // Refetch on visibility change
  useEffect(() => {
    if (!refetchOnFocus || !url) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchOnFocus, url, fetchData]);

  // Mutate function for optimistic updates
  const mutate = useCallback((updater: T | ((prev: T | null) => T)) => {
    setData((prev) => 
      typeof updater === 'function' 
        ? (updater as (prev: T | null) => T)(prev) 
        : updater
    );
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    mutate,
  };
}

/**
 * Hook for fetching with server actions
 */
interface UseActionOptions<T> {
  initialData?: T;
  immediate?: boolean;
  refetchOnFocus?: boolean;
}

interface UseActionResult<T, Args extends unknown[]> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...args: Args) => Promise<T | null>;
  refetch: () => Promise<void>;
  mutate: (data: T | ((prev: T | null) => T)) => void;
}

/**
 * Hook for calling server actions with loading/error state management
 * 
 * @example
 * ```tsx
 * const { data, isLoading, execute } = useAction(getResumes);
 * 
 * // Execute with arguments
 * const { execute: deleteResumeAction } = useAction(deleteResume);
 * await deleteResumeAction(resumeId);
 * ```
 */
export function useAction<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<{ success: true; data: T } | { success: false; error: string; code?: string }>,
  options: UseActionOptions<T> = {}
): UseActionResult<T, Args> {
  const { initialData, immediate = false, refetchOnFocus = false } = options;

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const argsRef = useRef<Args | null>(null);

  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    argsRef.current = args;
    
    try {
      setIsLoading(true);
      setError(null);

      const result = await action(...args);

      if (result.success) {
        setData(result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [action]);

  const refetch = useCallback(async () => {
    if (argsRef.current) {
      await execute(...argsRef.current);
    }
  }, [execute]);

  // Initial execution (for actions that don't need args)
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
  }, [immediate, execute]);

  // Refetch on visibility change
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && argsRef.current) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchOnFocus, refetch]);

  const mutate = useCallback((updater: T | ((prev: T | null) => T)) => {
    setData((prev) => 
      typeof updater === 'function' 
        ? (updater as (prev: T | null) => T)(prev) 
        : updater
    );
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    refetch,
    mutate,
  };
}

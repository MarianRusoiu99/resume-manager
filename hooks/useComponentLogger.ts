'use client';

import { useMemo } from 'react';
import type { ClientLogger } from '@/lib/utils/client-logger';
import { createComponentLogger } from '@/lib/utils/client-logger';

/**
 * Returns a stable, component-scoped client logger.
 *
 * Use this instead of calling `createComponentLogger()` inline to avoid
 * generating a new logger instance on every render and to keep React hook
 * dependency arrays correct.
 */
export function useComponentLogger(component: string): ClientLogger {
  return useMemo(() => createComponentLogger(component), [component]);
}

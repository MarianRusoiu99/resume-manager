/**
 * Service Wrapper - Utilities
 * 
 * Additional utility functions for service operations.
 */

export async function runParallel<T extends ServiceResult<unknown>[]>(
  ...operations: { [K in keyof T]: Promise<T[K]> }
): Promise<T> {
  return Promise.all(operations) as Promise<T>;
}

export async function chainOperations<A, B>(
  first: () => Promise<ServiceResult<A>>,
  second: (a: A) => Promise<ServiceResult<B>>
): Promise<ServiceResult<B>>;
export async function chainOperations<A, B, C>(
  first: () => Promise<ServiceResult<A>>,
  second: (a: A) => Promise<ServiceResult<B>>,
  third: (b: B) => Promise<ServiceResult<C>>
): Promise<ServiceResult<C>>;
export async function chainOperations<A, B, C, D>(
  first: () => Promise<ServiceResult<A>>,
  second: (a: A) => Promise<ServiceResult<B>>,
  third: (b: B) => Promise<ServiceResult<C>>,
  fourth: (c: C) => Promise<ServiceResult<D>>
): Promise<ServiceResult<D>>;
export async function chainOperations(
  ...operations: Array<(arg?: unknown) => Promise<ServiceResult<unknown>>>
): Promise<ServiceResult<unknown>> {
  let result: ServiceResult<unknown> = success(undefined);
  
  for (const operation of operations) {
    if (!result.success) return result;
    result = await operation(result.data);
  }
  
  return result;
}

import type { ServiceResult } from '@/lib/types';
import { success } from '@/lib/types';

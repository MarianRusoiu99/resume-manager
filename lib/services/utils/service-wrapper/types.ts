/**
 * Service Wrapper - Types
 * 
 * Type definitions for service wrapper utilities.
 */

import { success, failure, type ServiceResult, type ServiceErrorCode } from '@/lib/types/service-result';

export type { ServiceResult, ServiceErrorCode };

export interface ServiceWrapperOptions {
  errorPrefix?: string;
  logErrors?: boolean;
  context?: Record<string, unknown>;
}

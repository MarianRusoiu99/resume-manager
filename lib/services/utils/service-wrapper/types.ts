/**
 * Service Wrapper - Types
 * 
 * Type definitions for service wrapper utilities.
 */

import { success, failure, type ServiceResult, type ErrorCodeType } from '../../../types';

export type { ServiceResult, ErrorCodeType };

export interface ServiceWrapperOptions {
  errorPrefix?: string;
  logErrors?: boolean;
  context?: Record<string, unknown>;
}

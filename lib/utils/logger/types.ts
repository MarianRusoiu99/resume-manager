/**
 * Logger Module - Types
 * 
 * Type definitions for logging utility.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: unknown;
}

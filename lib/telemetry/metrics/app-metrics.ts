/**
 * Metrics Module - Application Metrics
 * 
 * Predefined metrics for application monitoring.
 */

import { MetricsClient } from './client';
import { env } from '@/lib/config';

export const metrics = new MetricsClient(!env.isTest);

export const AppMetrics = {
  httpRequestsTotal: metrics.createCounter('http_requests_total'),
  httpRequestDuration: metrics.createHistogram('http_request_duration_ms'),
  httpRequestErrors: metrics.createCounter('http_request_errors_total'),

  aiGenerationsTotal: metrics.createCounter('ai_generations_total'),
  aiGenerationDuration: metrics.createHistogram('ai_generation_duration_ms'),
  aiTokensUsed: metrics.createCounter('ai_tokens_used_total'),
  aiErrors: metrics.createCounter('ai_errors_total'),

  resumesGenerated: metrics.createCounter('resumes_generated_total'),
  coverLettersGenerated: metrics.createCounter('cover_letters_generated_total'),
  pdfExports: metrics.createCounter('pdf_exports_total'),

  activeUsers: metrics.createGauge('active_users'),
  profilesCreated: metrics.createCounter('profiles_created_total'),

  cacheHits: metrics.createCounter('cache_hits_total'),
  cacheMisses: metrics.createCounter('cache_misses_total'),

  circuitBreakerState: metrics.createGauge('circuit_breaker_state'),
  circuitBreakerTrips: metrics.createCounter('circuit_breaker_trips_total'),
};

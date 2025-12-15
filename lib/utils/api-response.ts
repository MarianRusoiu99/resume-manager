export type ApiEnvelopeSuccess<T> = {
  data: T;
  requestId?: string;
};

export type ApiEnvelopeError = {
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
};

export type ApiEnvelope<T> = ApiEnvelopeSuccess<T> | ApiEnvelopeError;

export function unwrapApiEnvelope<T = unknown>(body: unknown): T {
  if (!body || typeof body !== 'object') {
    return body as T;
  }

  if ('data' in body) {
    return (body as { data: T }).data;
  }

  return body as T;
}

export async function safeJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

export async function parseApiJson<T = unknown>(response: Response): Promise<T> {
  const body = await safeJson(response);
  return unwrapApiEnvelope<T>(body);
}

export function getApiErrorMessage(errorBody: unknown, fallback: string): string {
  const data = unwrapApiEnvelope<unknown>(errorBody);

  if (data && typeof data === 'object' && 'error' in data) {
    const maybeError = (data as { error?: unknown }).error;
    if (typeof maybeError === 'string' && maybeError.trim()) {
      return maybeError;
    }
  }

  return fallback;
}

export async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const errorBody = await safeJson(response);
  return getApiErrorMessage(errorBody, fallback);
}

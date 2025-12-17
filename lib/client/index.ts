import { API_V1 } from '@/lib/constants';
import type { AIModel } from '@/lib/ai/providers';
import type { Resume } from '@/lib/validations/jsonresume';
import type { ResumeDetails } from '@/lib/services/resume-crud';
import type { TemplateBase } from '@/lib/types/template';
import { apiFetch, apiJson } from '@/lib/utils/api-client';

export type RequestOptions = RequestInit & {
  skipSessionCheck?: boolean;
};

export type JsonResult<T> = { data: T | null; error: string | null; status: number };

export async function clientFetch(input: RequestInfo | URL, init?: RequestOptions): Promise<Response> {
  return apiFetch(input, init);
}

export async function clientJson<T>(input: RequestInfo | URL, init?: RequestOptions): Promise<JsonResult<T>> {
  return apiJson<T>(input, init);
}

type QueryValue = string | number | boolean | null | undefined;

export type RouteClient = {
  url: string;

  query(params: Record<string, QueryValue>): RouteClient;

  fetch(init?: RequestOptions): Promise<Response>;
  json<T>(init?: RequestOptions): Promise<JsonResult<T>>;

  get<T>(init?: RequestOptions): Promise<JsonResult<T>>;
  delete<T>(init?: RequestOptions): Promise<JsonResult<T>>;

  post<T>(body?: unknown, init?: RequestOptions): Promise<JsonResult<T>>;
  patch<T>(body?: unknown, init?: RequestOptions): Promise<JsonResult<T>>;
  put<T>(body?: unknown, init?: RequestOptions): Promise<JsonResult<T>>;

  postForm<T>(formData: FormData, init?: RequestOptions): Promise<JsonResult<T>>;

  postFetch(body?: unknown, init?: RequestOptions): Promise<Response>;
  patchFetch(body?: unknown, init?: RequestOptions): Promise<Response>;
  putFetch(body?: unknown, init?: RequestOptions): Promise<Response>;
};

function buildQueryString(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function createRouteClient(url: string): RouteClient {
  const routeClient: RouteClient = {
    url,

    query(params: Record<string, QueryValue>) {
      const query = buildQueryString(params);
      return createRouteClient(`${url}${query}`);
    },

    fetch(init?: RequestOptions) {
      return clientFetch(url, init);
    },

    json<T>(init?: RequestOptions) {
      return clientJson<T>(url, init);
    },

    get<T>(init?: RequestOptions) {
      return clientJson<T>(url, { ...init, method: 'GET' });
    },

    delete<T>(init?: RequestOptions) {
      return clientJson<T>(url, { ...init, method: 'DELETE' });
    },

    post<T>(body?: unknown, init?: RequestOptions) {
      return clientJson<T>(url, {
        ...init,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },

    patch<T>(body?: unknown, init?: RequestOptions) {
      return clientJson<T>(url, {
        ...init,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },

    put<T>(body?: unknown, init?: RequestOptions) {
      return clientJson<T>(url, {
        ...init,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },

    postForm<T>(formData: FormData, init?: RequestOptions) {
      return clientJson<T>(url, {
        ...init,
        method: 'POST',
        body: formData,
      });
    },

    postFetch(body?: unknown, init?: RequestOptions) {
      return clientFetch(url, {
        ...init,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },

    patchFetch(body?: unknown, init?: RequestOptions) {
      return clientFetch(url, {
        ...init,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },

    putFetch(body?: unknown, init?: RequestOptions) {
      return clientFetch(url, {
        ...init,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
  };

  return routeClient;
}

type ApiFromRoutes<T> = T extends (...args: infer A) => string
  ? (...args: A) => RouteClient
  : T extends string
    ? RouteClient
    : T extends Record<string, unknown>
      ? { [K in keyof T]: ApiFromRoutes<T[K]> }
      : never;

export function createApiFromRoutes<T extends Record<string, unknown>>(routes: T): ApiFromRoutes<T> {
  const build = (node: unknown): unknown => {
    if (typeof node === 'string') return createRouteClient(node);
    if (typeof node === 'function') {
      return (...args: unknown[]) => createRouteClient((node as (...args: unknown[]) => string)(...args));
    }

    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node)) {
        out[key] = build(value);
      }
      return out;
    }

    return node;
  };

  return build(routes) as ApiFromRoutes<T>;
}

export const apiV1 = createApiFromRoutes(API_V1);

// ----------------------------------------------------------------------------
// Types used by consumers (kept here for convenience)
// ----------------------------------------------------------------------------

export type AvailableModelListResponse = {
  allModels?: unknown[];
};

export type ModelInfo = {
  id: string;
  name: string;
  description?: string;
};

export type ProviderWithModels = {
  id: string;
  name: string;
  provider: string;
  models: ModelInfo[];
  isActive: boolean;
};

export type FeatureConfig = {
  id: string;
  name: string;
  description: string;
};

export type FeatureModelSelection = {
  feature: FeatureConfig;
  providerId: string | null;
  providerName: string | null;
  modelId: string | null;
  modelName: string | null;
};

export type AISettings = {
  features: FeatureModelSelection[];
  availableProviders: ProviderWithModels[];
};

export type { UpdateAIPreferenceInput } from '@/lib/validations/shared-inputs';

export type ProviderWithModelsDetailed = {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  models: AIModel[];
  keyPreview: string;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
};

export type ApiProviderModelInfo = {
  id: string;
  name: string;
  description?: string;
};

export type ApiProvider = {
  id: string;
  name: string;
  provider: string;
  keyPreview: string;
  models: ApiProviderModelInfo[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export type { AddApiProviderInput } from '@/lib/validations/shared-inputs';

export type ProfileListItem = {
  id: string;
  name: string;
  isDefault: boolean;
};

export type ProfileDto = {
  id: string;
  userId: string;
  name: string;
  resume: Resume | null;
  templateId: string | null;
  selectedTemplateId: string | null;
  isDefault: boolean;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResumeDetailsDto = Omit<ResumeDetails, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type ResumeCoverLetterResponseDto = {
  coverLetter: string | null;
  metadata: unknown;
};

export type DuplicateResumeResponseDto = {
  resume: {
    id: string;
    jobTitle: string | null;
    companyName: string | null;
    createdAt: string;
  };
};

export type DeleteResumeResponseDto = {
  message: string;
};

export type UpdateCoverLetterResponseDto = {
  resume: { coverLetter: string; updatedAt: string };
};

export type UpdateResumeTemplateResponseDto = {
  resume: {
    id: string;
    templateId: string | null;
  };
  message: string;
};

export type TemplateListResponseDto<TTemplate extends TemplateBase = TemplateBase> = {
  templates: TTemplate[];
  count: number;
};

import { API_V1 } from '@/lib/constants';
import type { AIModel } from '@/lib/ai/providers';
import type { Resume } from '@/lib/validations/jsonresume';
import type { ResumeDetails } from '@/lib/services/resumes';
import type { TemplateBase } from '@/lib/types/template';
import { apiFetch, apiJson } from '@/lib/utils/api-client';

export type RequestOptions = RequestInit & {
  skipSessionCheck?: boolean;
};

export type JsonResult<T> = { data: T | null; error: string | null; status: number };

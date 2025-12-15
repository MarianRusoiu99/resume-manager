import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';
import type { TemplateBase } from '@/lib/types/template';

export type ListTemplatesResult = {
  templates: TemplateBase[];
  count: number;
};

export async function listTemplates(): Promise<{ data: ListTemplatesResult | null; error: string | null }> {
  const result = await apiJson<ListTemplatesResult>(API_V1.TEMPLATE.LIST);
  return { data: result.data, error: result.error };
}

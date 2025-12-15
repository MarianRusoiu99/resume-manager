import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';

export type ProfileListItem = {
  id: string;
  name: string;
  isDefault: boolean;
};

export async function listProfiles(): Promise<{ data: ProfileListItem[] | null; error: string | null }> {
  const result = await apiJson<ProfileListItem[]>(API_V1.PROFILE.LIST);
  return { data: result.data, error: result.error };
}

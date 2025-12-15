import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';

export type GenerateCoverLetterInput = {
  jobDescription: string;
  personalInstructions?: string;
  profileId: string;
  modelId?: string;
};

export type GenerateCoverLetterResult = {
  coverLetter: string;
  coverLetterId?: string;
  metadata?: unknown;
};

export async function generateCoverLetter(
  input: GenerateCoverLetterInput
): Promise<{ data: GenerateCoverLetterResult | null; error: string | null }> {
  const result = await apiJson<GenerateCoverLetterResult>(API_V1.COVER_LETTER.GENERATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDescription: input.jobDescription,
      personalInstructions: input.personalInstructions?.trim() || undefined,
      profileId: input.profileId,
      modelId: input.modelId,
    }),
  });

  return { data: result.data, error: result.error };
}

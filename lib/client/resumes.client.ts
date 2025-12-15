import { API_V1 } from '@/lib/constants';
import { apiFetch } from '@/lib/utils/api-client';

export type GenerateResumeStreamInput = {
  jobDescription: string;
  profileId: string;
  templateId?: string;
  workflowType?: string;
  customSteps?: string[];
};

export async function generateResumeStream(input: GenerateResumeStreamInput): Promise<Response> {
  return apiFetch(API_V1.RESUME.GENERATE_STREAM, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobDescription: input.jobDescription,
      profileId: input.profileId,
      templateId: input.templateId,
      workflowType: input.workflowType,
      customSteps: input.customSteps,
    }),
  });
}

import type { CreateTemplateInput, UpdateTemplateInput } from '@/lib/validations/api-schemas';
import { createTemplateSchema, updateTemplateSchema } from '@/lib/validations/api-schemas';

export function validateCreateTemplateInput(input: CreateTemplateInput): CreateTemplateInput {
  return createTemplateSchema.parse(input);
}

export function validateUpdateTemplateInput(input: UpdateTemplateInput): UpdateTemplateInput {
  return updateTemplateSchema.parse(input);
}

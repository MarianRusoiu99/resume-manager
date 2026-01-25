"use client";

import { ManagedForm } from "@/components/forms/ManagedForm";
import { FieldConfig } from "@/lib/forms/form-schema";
import { addApiProviderInputSchema, type AddApiProviderInput } from '@/lib/validations/shared-inputs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToastAction } from '@/hooks';
import { addApiProvider } from '@/app/actions/api-provider';

interface ApiKeyFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  initialData?: Partial<AddApiProviderInput>;
}

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google AI' },
];

const API_KEY_FIELDS: FieldConfig<AddApiProviderInput>[] = [
  {
    key: 'name',
    label: 'Provider Name',
    type: 'text',
    placeholder: 'e.g., My OpenAI Key',
    required: true,
    colSpan: 2,
  },
  {
    key: 'provider',
    label: 'Provider Type',
    type: 'select',
    options: PROVIDER_OPTIONS,
    required: true,
  },
  {
    key: 'apiKey',
    label: 'API Key',
    type: 'password',
    placeholder: 'Enter your API key',
    required: true,
    description: 'Your key is encrypted before storage.',
  },
];

export function ApiKeyForm({ onSuccess, onCancel, submitLabel = 'Add Provider', initialData }: ApiKeyFormProps) {
  const { runWithToast } = useToastAction();

  const onSubmit = async (data: AddApiProviderInput) => {
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('provider', data.provider);
    fd.append('apiKey', data.apiKey);

    const result = await runWithToast(
      () => addApiProvider(fd),
      {
        successMessage: 'API provider added successfully',
        errorMessage: 'Failed to add provider',
      }
    );

    if (result) {
      onSuccess?.();
    }
  };

  return (
    <ManagedForm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ManagedForm schema typing with Zod requires any cast
      schema={addApiProviderInputSchema as any}
      defaultValues={{
        name: initialData?.name || '',
        provider: initialData?.provider || 'openai',
        apiKey: initialData?.apiKey || '',
      }}
      fields={API_KEY_FIELDS as any}
      onSubmit={onSubmit as any}
    >
      {(form) => (
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      )}
    </ManagedForm>
  );
}

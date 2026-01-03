'use client';

import { useAutoSaveForm } from '@/hooks/useAutoSaveForm';
import { addApiProviderSchema, type AddApiProviderInput } from '@/lib/validations/api-schemas';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addApiProvider } from '@/app/actions/api-provider';
import { GenericForm } from '@/components/forms/GenericForm';
import { FieldConfig } from '@/lib/forms/form-schema';

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google AI' },
];

interface ApiKeyFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  initialData?: Partial<AddApiProviderInput>;
}

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
  const form = useAutoSaveForm<AddApiProviderInput>({
    schema: addApiProviderSchema,
    defaultValues: {
      name: initialData?.name || '',
      provider: initialData?.provider || 'openai',
      apiKey: initialData?.apiKey || '',
    },
    onSave: async (data) => {
      // Logic for background auto-save if editing
      // For now, we mainly use it for state management
    }
  });

  const { handleSubmit, formState: { isSubmitting }, watch, setValue } = form;
  const formData = watch();

  const onSubmit = async (data: AddApiProviderInput) => {
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('provider', data.provider);
    fd.append('apiKey', data.apiKey);

    const result = await addApiProvider(fd);
    if (result.success) {
      toast.success('API provider added successfully');
      onSuccess?.();
    } else {
      toast.error(result.error || 'Failed to add provider');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <GenericForm
        fields={API_KEY_FIELDS}
        data={formData}
        onChange={(newData) => {
          Object.entries(newData).forEach(([key, value]) => {
            setValue(key as any, value, { shouldDirty: true });
          });
        }}
        disabled={isSubmitting}
      />

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

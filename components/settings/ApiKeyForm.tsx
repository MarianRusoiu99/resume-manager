'use client';

import { useActionState, useEffect, useState } from 'react';
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
}

interface ApiKeyFormData {
  name: string;
  provider: string;
  apiKey: string;
}

const API_KEY_FIELDS: FieldConfig<ApiKeyFormData>[] = [
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

export function ApiKeyForm({ onSuccess, onCancel, submitLabel = 'Add Provider' }: ApiKeyFormProps) {
  const [formData, setFormData] = useState<ApiKeyFormData>({
    name: '',
    provider: 'openai',
    apiKey: '',
  });

  const [state, action, isPending] = useActionState(async (prevState: any, fd: FormData) => {
    // Ensure all fields from the state are in FormData if they aren't already
    // GenericForm with SimpleFormField uses native inputs with names
    const result = await addApiProvider(fd);
    return result;
  }, null);

  useEffect(() => {
    if (state?.success) {
      toast.success('API provider added successfully');
      onSuccess?.();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  return (
    <form action={action} className="space-y-4">
      <GenericForm
        fields={API_KEY_FIELDS}
        data={formData}
        onChange={setFormData}
        disabled={isPending}
      />

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
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

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const apiKeySchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .refine((val) => val.trim().length > 0, 'API key cannot be empty'),
});

type APIKeyFormData = z.infer<typeof apiKeySchema>;

interface APIKeyFormProps {
  onSubmit: (provider: string, apiKey: string) => void;
  onCancel: () => void;
}

export default function APIKeyForm({ onSubmit, onCancel }: APIKeyFormProps) {
  const [showKey, setShowKey] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const form = useForm<APIKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      provider: 'openai',
      apiKey: '',
    },
  });

  const handleFormSubmit = async (data: APIKeyFormData) => {
    setSubmitting(true);
    try {
      await onSubmit(data.provider, data.apiKey);
      form.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const currentProvider = form.watch('provider');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Provider Selection */}
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Provider</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={submitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic" disabled>
                    Anthropic (Coming Soon)
                  </SelectItem>
                  <SelectItem value="google" disabled>
                    Google (Coming Soon)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* API Key Input */}
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showKey ? 'text' : 'password'}
                    placeholder={
                      currentProvider === 'openai'
                        ? 'sk-...'
                        : 'Enter your API key'
                    }
                    disabled={submitting}
                    className="pr-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                    disabled={submitting}
                    className="absolute right-0 top-0 h-full px-3"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </FormControl>
              {currentProvider === 'openai' && (
                <FormDescription>
                  OpenAI API keys start with &ldquo;sk-&rdquo;
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Key'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

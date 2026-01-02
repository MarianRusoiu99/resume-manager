'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { apiV1 } from '@/lib/client';
import { toast } from 'sonner';

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
};

interface ApiKeyFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ApiKeyForm({ onSuccess, onCancel, submitLabel = 'Add Provider' }: ApiKeyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    apiKey: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.apiKey) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await apiV1.SETTINGS.API_PROVIDERS.post<unknown>({
        name: formData.name,
        provider: formData.provider,
        apiKey: formData.apiKey,
      });

      if (!result.error) {
        toast.success('API provider added successfully');
        onSuccess?.();
      } else {
        toast.error(result.error ?? 'Failed to add provider');
      }
    } catch (error) {
      toast.error('Failed to add provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider-name">Provider Name</Label>
        <Input
          id="provider-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., My OpenAI Key"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider-type">Provider Type</Label>
        <Select
          value={formData.provider}
          onValueChange={(value) => setFormData({ ...formData, provider: value })}
        >
          <SelectTrigger id="provider-type">
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROVIDER_NAMES).map(([key, name]) => (
              <SelectItem key={key} value={key}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key">API Key</Label>
        <div className="relative">
          <Input
            id="api-key"
            type={showApiKey ? 'text' : 'password'}
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder={`Enter your ${PROVIDER_NAMES[formData.provider]} API key`}
            className="pr-10 font-mono text-sm"
            autoComplete="off"
            required
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Your key is encrypted before storage.
        </p>
      </div>

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
          {isSubmitting ? 'Adding...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

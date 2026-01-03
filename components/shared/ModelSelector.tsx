'use client';

import { useState, useEffect } from 'react';
import { Cpu, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type ApiProvider } from '@/lib/actions/types';
import { getApiProviders } from '@/app/actions/api-provider';

interface ModelOption {
  id: string;
  name: string;
  providerName: string;
}

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  align?: 'start' | 'end' | 'center';
}

export function ModelSelector({
  value,
  onValueChange,
  className,
  align = 'end',
}: Readonly<ModelSelectorProps>) {
  const [options, setOptions] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      try {
        const result = await getApiProviders();
        if (result.success && result.data) {
          const allModels: ModelOption[] = [];
          (result.data as unknown as ApiProvider[]).filter(p => p.isActive).forEach(provider => {
            (provider.models || []).forEach(model => {
              allModels.push({
                id: model.id,
                name: model.name || model.id,
                providerName: provider.name,
              });
            });
          });
          setOptions(allModels);
        }
      } catch (err) {
        console.error('Failed to load models for selector', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadModels();
  }, []);

  const selectedModel = options.find(o => o.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-2 bg-background/50 hover:bg-background border-dashed px-3 transition-all",
            className
          )}
          disabled={isLoading}
        >
          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex flex-col items-start leading-none gap-0.5">
            {/* <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AI Model</span> */}
            <span className="text-xs font-semibold">
              {isLoading ? 'Loading...' : selectedModel?.name || 'Select Model'}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64">
        <DropdownMenuLabel>Available AI Models</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {options.length === 0 && !isLoading && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No models configured. Check your API settings.
            </div>
          )}
          {options.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onValueChange(option.id)}
              className="flex flex-col items-start py-2 gap-0.5"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{option.name}</span>
                {value === option.id && <Check className="h-4 w-4 text-primary" />}
              </div>
              <span className="text-xs text-muted-foreground">{option.providerName}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

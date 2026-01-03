'use client';

import { useState, useMemo, useEffect } from 'react';
import { Cpu, ChevronRight, Sparkles, Box, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ModelSelectionModal } from './ModelSelectionModal';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { getAllAvailableModels } from '@/app/actions/api-provider';

const logger = createComponentLogger('ModelSelector');

interface ModelSelectorProps {
    value: string;
    onValueChange: (modelId: string, providerId: string) => void;
    className?: string;
    showProvider?: boolean;
}

const PROVIDER_ICONS: Record<string, any> = {
    openai: Sparkles,
    anthropic: Box,
    google: Zap,
};

export function ModelSelector({
    value,
    onValueChange,
    className,
    showProvider = true,
}: Readonly<ModelSelectorProps>) {
    const [open, setOpen] = useState(false);
    const [modelName, setModelName] = useState<string>('');
    const [providerName, setProviderName] = useState<string>('');
    const [providerId, setProviderId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch model details if we only have the ID
    useEffect(() => {
        let cancelled = false;

        const fetchDetails = async () => {
            // If we don't have a value, just stop loading
            if (!value) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const result = await getAllAvailableModels();
                if (cancelled) return;

                if (result.success && result.data?.byProvider) {
                    // Find the model
                    for (const p of result.data.byProvider) {
                        const found = p.models?.find((m: any) => m.id === value);
                        if (found) {
                            setModelName(found.name);
                            setProviderName(p.name);
                            setProviderId(p.provider);
                            break;
                        }
                    }
                }
            } catch (error) {
                logger.error('Failed to resolve model details', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchDetails();
        return () => { cancelled = true; };
    }, [value]);

    const ProviderIcon = PROVIDER_ICONS[providerId] || Cpu;

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                className={cn(
                    "h-9 gap-2 bg-background/50 border-dashed hover:bg-background hover:border-primary/30 transition-all font-normal",
                    className
                )}
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                    <ProviderIcon className={cn(
                        "h-3.5 w-3.5",
                        providerId === 'openai' && "text-green-500",
                        providerId === 'anthropic' && "text-orange-500",
                        providerId === 'google' && "text-blue-500",
                        !providerId && "text-muted-foreground"
                    )} />
                )}

                <div className="flex flex-col items-start text-xs leading-none gap-0.5">
                    <span className="font-medium text-foreground">
                        {modelName || value || 'Select Model'}
                    </span>
                    {showProvider && providerName && (
                        <span className="text-[10px] text-muted-foreground">
                            {providerName}
                        </span>
                    )}
                </div>

                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 ml-1" />
            </Button>

            <ModelSelectionModal
                open={open}
                onOpenChange={setOpen}
                selectedModelId={value}
                onModelSelect={(mid, pid) => {
                    onValueChange(mid, pid);
                    setOpen(false);
                }}
            />
        </>
    );
}

'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { Cpu, ChevronRight, Sparkles, Box, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModelSelectionModal } from './ModelSelectionModal';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { getAllAvailableModels } from '@/app/actions/api-provider';
import type { AIFeatureType } from '@/lib/repositories/interfaces';
import type { ProviderWithModels } from '@/lib/services/api-providers/types';

const logger = createComponentLogger('ModelSelector');

interface ModelSelectorProps {
    value: string;
    onValueChange: (modelId: string, providerId: string) => void;
    feature?: AIFeatureType;
    requiresVision?: boolean;
    requiresStructuredOutput?: boolean;
    className?: string;
    showProvider?: boolean;
}

const PROVIDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    openai: Sparkles,
    anthropic: Box,
    google: Zap,
};

interface SimplifiedModelInfo {
    id: string;
    modelKey: string;
    name: string;
    providerId: string;
    providerName: string;
    providerType: string;
    capabilities?: {
        vision?: boolean;
        structuredOutput?: boolean;
    };
}

export const ModelSelector = memo(function ModelSelector({
    value,
    onValueChange,
    feature,
    className,
    showProvider = true,
    isLoading: externalLoading = false,
}: Readonly<ModelSelectorProps & { isLoading?: boolean }>) {
    const [open, setOpen] = useState(false);
    const [modelName, setModelName] = useState<string>('');
    const [providerName, setProviderName] = useState<string>('');
    const [providerId, setProviderId] = useState<string>('');
    const [isResolving, setIsResolving] = useState(false);

    // Derived loading state
    const isLoading = externalLoading || isResolving;

    // Resolve model details when value changes
    useEffect(() => {
        logger.info('ModelSelector value changed:', { value, feature });
        
        if (!value) {
            setModelName('');
            setProviderName('');
            setProviderId('');
            return;
        }

        let cancelled = false;

        const fetchDetails = async () => {
            setIsResolving(true);
            try {
                const result = await getAllAvailableModels();
                if (cancelled || !result.success || !result.data) {
                    if (!cancelled && !result.success) {
                        logger.error('Failed to resolve model details', result.error);
                    }
                    return;
                }

                // Flatten all models to find the matching one
                let found = false;
                for (const p of (result.data.byProvider as ProviderWithModels[])) {
                    const model = p.models?.find((m) => m.id === value);
                    if (model) {
                        logger.info('Model resolved:', {
                            modelId: model.id,
                            modelKey: model.modelKey,
                            modelName: model.name,
                            providerId: p.id,
                            providerName: p.name
                        });
                        setModelName(model.name);
                        setProviderName(p.name);
                        setProviderId(p.provider);
                        found = true;
                        break;
                    }
                }

                if (!found && !cancelled) {
                    logger.warn(`Model ${value} not found in available models`);
                    setModelName('Unknown Model');
                    setProviderName('');
                    setProviderId('');
                }
            } catch (error) {
                if (!cancelled) {
                    logger.error('Failed to resolve model details', error);
                    setModelName('Error loading model');
                    setProviderName('');
                    setProviderId('');
                }
            } finally {
                if (!cancelled) setIsResolving(false);
            }
        };

        fetchDetails();
        return () => { cancelled = true; };
    }, [value, feature]);

    const handleModelSelect = useCallback(async (mid: string, pid: string) => {
        logger.info('handleModelSelect called:', { modelId: mid, providerId: pid, feature });
        // Update UI and notify parent
        onValueChange(mid, pid);
        setOpen(false);
    }, [onValueChange, feature]);

    const ProviderIcon = PROVIDER_ICONS[providerId] || Cpu;

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                disabled={isLoading}
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
                        {isLoading ? 'Loading...' : (modelName || 'Select Model')}
                    </span>
                    {showProvider && providerName && !isLoading && (
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
                onModelSelect={handleModelSelect}
            />
        </>
    );
});

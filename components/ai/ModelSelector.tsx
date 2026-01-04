'use client';

import { useState, useEffect } from 'react';
import { Cpu, ChevronRight, Sparkles, Box, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModelSelectionModal } from './ModelSelectionModal';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { getAllAvailableModels } from '@/app/actions/api-provider';
import { updateFeaturePreference, getAISettings } from '@/app/actions/ai-settings';
import type { AIFeatureType } from '@/lib/repositories/interfaces';
import type { ProviderWithModels, ConfiguredModelInfo } from '@/lib/services/api-providers/types';

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

export function ModelSelector({
    value,
    onValueChange,
    feature,
    requiresVision = false,
    requiresStructuredOutput = false,
    className,
    showProvider = true,
}: Readonly<ModelSelectorProps>) {
    const [open, setOpen] = useState(false);
    const [modelName, setModelName] = useState<string>('');
    const [providerName, setProviderName] = useState<string>('');
    const [providerId, setProviderId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Initial load: fetch preferences and set defaults if needed
    useEffect(() => {
        let cancelled = false;

        const initModel = async () => {
            setIsLoading(true);
            try {
                const modelsResult = await getAllAvailableModels();
                if (cancelled || !modelsResult.success || !modelsResult.data) return;

                const { byProvider } = modelsResult.data;
                let activeModelId = value;
                let activeProviderId = '';

                // If no value provided and we have a feature, load from preferences
                if (!activeModelId && feature) {
                    const settingsResult = await getAISettings();
                    if (settingsResult.success && settingsResult.data) {
                        const feat = settingsResult.data.features.find(f => f.feature.id === feature);
                        if (feat?.modelId && feat?.providerId) {
                            activeModelId = feat.modelId;
                            activeProviderId = feat.providerId;
                        }
                    }
                }

                // If still no model, find a smart default
                if (!activeModelId) {
                    const allModels: SimplifiedModelInfo[] = (byProvider as ProviderWithModels[]).flatMap((p) => 
                        (p.models as ConfiguredModelInfo[]).map((m) => ({ 
                            ...m, 
                            providerId: p.id, 
                            providerName: p.name, 
                            providerType: p.provider 
                        }))
                    );
                    
                    const filtered = allModels.filter((m) => {
                        // Only apply capability filters for OpenAI as requested
                        if (m.providerType === 'openai') {
                            const caps = m.capabilities || {};
                            if (requiresVision && caps.vision === false) return false;
                            if (requiresStructuredOutput && caps.structuredOutput === false) return false;
                        }
                        return true;
                    });

                    // Priority 1: GPT-4o
                    let defaultModel = filtered.find((m) => m.modelKey === 'gpt-4o' || m.id === 'gpt-4o');
                    // Priority 2: GPT-4o-mini
                    if (!defaultModel) defaultModel = filtered.find((m) => m.modelKey === 'gpt-4o-mini' || m.id === 'gpt-4o-mini');
                    // Priority 3: Any GPT-4
                    if (!defaultModel) defaultModel = filtered.find((m) => m.id.includes('gpt-4'));
                    // Priority 4: Claude 3.5 Sonnet
                    if (!defaultModel) defaultModel = filtered.find((m) => m.id.includes('claude-3-5-sonnet'));
                    // Priority 5: Gemini 1.5 Pro
                    if (!defaultModel) defaultModel = filtered.find((m) => m.id.includes('gemini-1.5-pro'));
                    // Fallback: First available
                    if (!defaultModel) defaultModel = filtered[0];

                    if (defaultModel) {
                        activeModelId = defaultModel.id;
                        activeProviderId = defaultModel.providerId;
                    }
                }

                // Resolve display names
                if (activeModelId) {
                    for (const p of byProvider as ProviderWithModels[]) {
                        const found = (p.models as ConfiguredModelInfo[]).find((m) => m.id === activeModelId || m.modelKey === activeModelId);
                        if (found) {
                            setModelName(found.name);
                            setProviderName(p.name);
                            setProviderId(p.provider);
                            if (!activeProviderId) activeProviderId = p.id;
                            break;
                        }
                    }
                }

                // Notify parent if we chose a default
                if (activeModelId && activeModelId !== value) {
                    onValueChange(activeModelId, activeProviderId);
                }
            } catch (error) {
                logger.error('Failed to initialize model', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        initModel();
        return () => { cancelled = true; };
    }, [feature, requiresVision, requiresStructuredOutput, onValueChange, value]);

    // Update details when value changes externally
    useEffect(() => {
        if (!value) return;
        let cancelled = false;

        const fetchDetails = async () => {
            try {
                const result = await getAllAvailableModels();
                if (cancelled || !result.success || !result.data) return;

                for (const p of (result.data.byProvider as ProviderWithModels[])) {
                    const found = p.models?.find((m) => m.id === value);
                    if (found) {
                        setModelName(found.name);
                        setProviderName(p.name);
                        setProviderId(p.provider);
                        break;
                    }
                }
            } catch (error) {
                logger.error('Failed to resolve model details', error);
            }
        };

        fetchDetails();
        return () => { cancelled = true; };
    }, [value, onValueChange]);

    const handleModelSelect = async (mid: string, pid: string) => {
        onValueChange(mid, pid);
        setOpen(false);

        // Persist preference if feature is provided
        if (feature) {
            try {
                await updateFeaturePreference({
                    feature,
                    providerId: pid,
                    modelId: mid
                });
            } catch (error) {
                logger.error('Failed to persist model preference', error);
            }
        }
    };

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
                onModelSelect={handleModelSelect}
                requiresVision={requiresVision}
                requiresStructuredOutput={requiresStructuredOutput}
            />
        </>
    );
}

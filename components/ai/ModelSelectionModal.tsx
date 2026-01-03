'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Cpu,
    Check,
    X,
    Sparkles,
    Zap,
    Box
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getAllAvailableModels } from '@/app/actions/api-provider';
import { createComponentLogger } from '@/lib/utils/client-logger';

const logger = createComponentLogger('ModelSelectionModal');

// --- Types ---

interface ModelInfo {
    id: string;
    modelKey: string;
    name: string;
    description?: string;
    contextWindow?: number;
    maxOutputTokens?: number;
}

interface ProviderWithModels {
    id: string;
    name: string;
    provider: string;
    isActive: boolean;
    models: ModelInfo[];
}

export interface ModelSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedModelId: string;
    onModelSelect: (modelId: string, providerId: string) => void;
}

// --- Constants ---

const PROVIDER_CONFIG: Record<string, { name: string; color: string; icon: any }> = {
    openai: { name: 'OpenAI', color: 'text-green-500', icon: Sparkles },
    anthropic: { name: 'Anthropic', color: 'text-orange-500', icon: Box },
    google: { name: 'Google', color: 'text-blue-500', icon: Zap },
};

export function ModelSelectionModal({
    open,
    onOpenChange,
    selectedModelId,
    onModelSelect,
}: Readonly<ModelSelectionModalProps>) {
    const [providers, setProviders] = useState<ProviderWithModels[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProviderFilter, setSelectedProviderFilter] = useState<string | 'all'>('all');

    // Load models
    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        const loadModels = async () => {
            setIsLoading(true);
            try {
                const result = await getAllAvailableModels();
                if (cancelled) return;

                if (result.success && result.data?.byProvider) {
                    const active = result.data.byProvider.filter(
                        (p: ProviderWithModels) => p.isActive && p.models?.length > 0
                    );
                    setProviders(active);
                }
            } catch (err) {
                logger.error('Failed to load models', err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadModels();
        return () => { cancelled = true; };
    }, [open]);

    // Filter models
    const filteredModels = useMemo(() => {
        return providers.flatMap(provider => {
            if (selectedProviderFilter !== 'all' && provider.provider !== selectedProviderFilter) {
                return [];
            }

            return provider.models
                .filter(model => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                        model.name.toLowerCase().includes(q) ||
                        model.id.toLowerCase().includes(q)
                    );
                })
                .map(model => ({ ...model, provider }));
        });
    }, [providers, searchQuery, selectedProviderFilter]);

    // Group by provider for display if showing all
    const groupedModels = useMemo(() => {
        const groups: Record<string, typeof filteredModels> = {};
        filteredModels.forEach(item => {
            const pid = item.provider.id;
            if (!groups[pid]) groups[pid] = [];
            groups[pid].push(item);
        });
        return groups;
    }, [filteredModels]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-background/80 backdrop-blur-xl border-primary/10 shadow-2xl">
                <div className="flex h-[600px]">

                    {/* Sidebar - Provider Filters */}
                    <div className="w-64 border-r border-border/40 bg-muted/10 p-4 flex flex-col gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2">
                            Providers
                        </h3>

                        <Button
                            variant={selectedProviderFilter === 'all' ? 'secondary' : 'ghost'}
                            className={cn(
                                "justify-start gap-3 h-10 w-full",
                                selectedProviderFilter === 'all' && "bg-primary/10 text-primary hover:bg-primary/15"
                            )}
                            onClick={() => setSelectedProviderFilter('all')}
                        >
                            <Box className="h-4 w-4" />
                            All Models
                        </Button>

                        {providers.map(p => {
                            const Config = PROVIDER_CONFIG[p.provider] || { name: p.name, color: 'text-foreground', icon: Cpu };
                            const Icon = Config.icon;

                            return (
                                <Button
                                    key={p.id}
                                    variant={selectedProviderFilter === p.provider ? 'secondary' : 'ghost'}
                                    className={cn(
                                        "justify-start gap-3 h-10 w-full transition-all",
                                        selectedProviderFilter === p.provider && "bg-background shadow-sm ring-1 ring-border"
                                    )}
                                    onClick={() => setSelectedProviderFilter(p.provider)}
                                >
                                    <Icon className={cn("h-4 w-4", Config.color)} />
                                    {Config.name}
                                    <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1.5 bg-background/50">
                                        {p.models.length}
                                    </Badge>
                                </Button>
                            );
                        })}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="p-4 border-b border-border/40 flex items-center gap-4 bg-background/40">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search models..."
                                    className="pl-9 bg-background/50 border-primary/10 h-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* List */}
                        <ScrollArea className="flex-1 p-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-4 text-muted-foreground">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                    <p className="text-sm">Loading models...</p>
                                </div>
                            ) : filteredModels.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                                    <Search className="h-8 w-8 opacity-20" />
                                    <p className="text-sm">No models found</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(groupedModels).map(([providerId, models]) => {
                                        if (models.length === 0) return null;
                                        const provider = models[0].provider;
                                        const Config = PROVIDER_CONFIG[provider.provider];

                                        return (
                                            <div key={providerId} className="space-y-3">
                                                {selectedProviderFilter === 'all' && (
                                                    <div className="flex items-center gap-2 px-1">
                                                        {Config?.icon && <Config.icon className={cn("h-4 w-4", Config.color)} />}
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                            {Config?.name || provider.name}
                                                        </h4>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {models.map((item) => {
                                                        const isSelected = selectedModelId === item.id;

                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => onModelSelect(item.id, item.provider.id)}
                                                                className={cn(
                                                                    "group relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all",
                                                                    "hover:border-primary/30 hover:bg-primary/5",
                                                                    isSelected
                                                                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                                        : "border-border/40 bg-background/40"
                                                                )}
                                                            >
                                                                <div className="flex items-center justify-between w-full">
                                                                    <span className={cn(
                                                                        "font-semibold text-sm",
                                                                        isSelected ? "text-primary" : "text-foreground"
                                                                    )}>
                                                                        {item.name}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                                                                            <Check className="h-3 w-3" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-muted-foreground font-mono opacity-70">
                                                                    {item.id}
                                                                </span>
                                                                {item.description && (
                                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                        {item.description}
                                                                    </p>
                                                                )}
                                                                {(item.contextWindow || item.maxOutputTokens) && (
                                                                    <div className="flex gap-2 mt-2">
                                                                        {item.contextWindow && (
                                                                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal bg-background/50">
                                                                                CTX: {Math.round(item.contextWindow / 1000)}k
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

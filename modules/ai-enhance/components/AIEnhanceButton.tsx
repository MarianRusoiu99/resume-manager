'use client';

/**
 * AI Enhance Button
 * A sparkle button that triggers AI text enhancement modal
 */

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIEnhanceButtonProps {
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'default' | 'lg' | 'icon';
    variant?: 'default' | 'outline' | 'ghost';
}

export function AIEnhanceButton({
    onClick,
    disabled = false,
    className,
    size = 'icon',
    variant = 'ghost',
}: Readonly<AIEnhanceButtonProps>) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant={variant}
                        size={size}
                        onClick={onClick}
                        disabled={disabled}
                        className={cn(
                            'group relative rounded-lg transition-all duration-200',
                            'hover:bg-primary/10 hover:text-primary',
                            'focus-visible:ring-2 focus-visible:ring-primary/50',
                            size === 'icon' && 'h-8 w-8',
                            className
                        )}
                    >
                        <Sparkles
                            className={cn(
                                'h-4 w-4 transition-transform duration-200',
                                'group-hover:scale-110 group-hover:rotate-12'
                            )}
                        />
                        <span className="sr-only">Enhance with AI</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Enhance with AI</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

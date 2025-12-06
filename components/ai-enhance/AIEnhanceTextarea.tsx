'use client';

/**
 * AI Enhance Textarea
 * Wrapper component that adds AI enhancement capability to textareas
 */

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { AIEnhanceButton } from './AIEnhanceButton';
import { AIEnhanceModal } from './AIEnhanceModal';
import { cn } from '@/lib/utils';

interface AIEnhanceTextareaProps extends React.ComponentProps<typeof Textarea> {
    onEnhanced?: (enhancedValue: string) => void;
    contentType?: 'text' | 'html' | 'css' | 'markdown';
    context?: string;
    showEnhanceButton?: boolean;
}

export function AIEnhanceTextarea({
    className,
    value,
    onChange,
    onEnhanced,
    contentType = 'text',
    context,
    showEnhanceButton = true,
    ...props
}: Readonly<AIEnhanceTextareaProps>) {
    const [modalOpen, setModalOpen] = useState(false);

    const handleEnhanced = (enhancedContent: string) => {
        // If onEnhanced is provided, use it
        if (onEnhanced) {
            onEnhanced(enhancedContent);
        }
        // Also trigger onChange with synthetic event if available
        if (onChange) {
            const syntheticEvent = {
                target: { value: enhancedContent },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(syntheticEvent);
        }
    };

    const currentValue = typeof value === 'string' ? value : '';

    return (
        <div className="relative">
            <Textarea
                className={cn('pr-12', className)}
                value={value}
                onChange={onChange}
                {...props}
            />

            {showEnhanceButton && (
                <div className="absolute top-2 right-2">
                    <AIEnhanceButton
                        onClick={() => setModalOpen(true)}
                        disabled={!currentValue.trim()}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 bg-background/80 backdrop-blur-sm shadow-sm border"
                    />
                </div>
            )}

            <AIEnhanceModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                originalContent={currentValue}
                onAccept={handleEnhanced}
                contentType={contentType}
                context={context}
            />
        </div>
    );
}

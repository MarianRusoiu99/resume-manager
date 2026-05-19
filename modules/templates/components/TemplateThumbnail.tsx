'use client';

import { useState, useEffect, useRef } from 'react';
import { renderTemplateServerSide } from '@/components/core/data-display/rendering/client-renderer';
import { sampleResume } from '@/lib/templates/constants/sample-resume';
import { useIframeResize } from '@/components/preview/useIframeResize';
import { cn } from '@/lib/utils';

interface TemplateThumbnailProps {
    templateHtml: string;
    name: string;
    isSelected?: boolean;
    onClick?: () => void;
    className?: string;
}

export function TemplateThumbnail({
    templateHtml,
    name,
    isSelected,
    onClick,
    className,
}: TemplateThumbnailProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const render = async () => {
            setIsLoading(true);
            try {
                const html = await renderTemplateServerSide({
                    htmlTemplate: templateHtml,
                    resumeData: sampleResume as Record<string, unknown>,
                });
                if (!cancelled) setHtmlContent(html);
            } catch (err) {
                if (!cancelled) setHtmlContent(`<div style="padding: 20px; text-align: center; color: #666;">Preview Error</div>`);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void render();

        return () => {
            cancelled = true;
        };
    }, [templateHtml]);

    useIframeResize({
        iframeRef,
        htmlContent,
    });

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative aspect-[1/1.414] w-full cursor-pointer overflow-hidden rounded-md border-2 bg-white transition-all hover:ring-2 hover:ring-primary/50",
                isSelected ? "border-primary ring-2 ring-primary" : "border-muted",
                className
            )}
        >
            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Scaled Preview Surface */}
            <div className="absolute inset-0 pointer-events-none origin-top-left scale-[0.2] overflow-hidden"
                style={{ width: '500%', height: '500%' }}>
            <iframe
                ref={iframeRef}
                title={`Preview of ${name}`}
                srcDoc={htmlContent}
                className="w-full h-full border-none pointer-events-none"
                sandbox="allow-same-origin"
                scrolling="no"
            />
            </div>

            {/* Overlay for Name */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 translate-y-full transition-transform group-hover:translate-y-0">
                <p className="text-[10px] font-bold text-white truncate">{name}</p>
            </div>

            {isSelected && (
                <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </div>
    );
}

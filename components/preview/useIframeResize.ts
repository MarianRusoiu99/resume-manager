import { RefObject, useEffect } from 'react';
import { A4_HEIGHT } from '@/lib/utils/pagination';
import { createComponentLogger } from '@/lib/utils/client-logger';

const logger = createComponentLogger('useIframeResize');

interface UseIframeResizeProps {
    iframeRef: RefObject<HTMLIFrameElement | null>;
    htmlContent: string | null;
}

export function useIframeResize({ iframeRef, htmlContent }: UseIframeResizeProps) {
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !htmlContent) return;

        const resizeIframe = () => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (doc?.body) {
                    // Reset height to min to allow shrinking if content reduced
                    iframe.style.height = `${A4_HEIGHT}px`;

                    const scrollHeight = doc.documentElement.scrollHeight || doc.body.scrollHeight;
                    const newHeight = Math.max(scrollHeight, A4_HEIGHT);

                    iframe.style.height = `${newHeight}px`;

                    // Also update the parent container if it exists and has style
                    if (iframe.parentElement) {
                        iframe.parentElement.style.height = `${newHeight}px`;
                    }
                }
            } catch (error) {
                logger.error('Error resizing iframe', error);
            }
        };

        // Resize on load
        iframe.addEventListener('load', resizeIframe);

        // Resize immediately if already loaded
        if (iframe.contentDocument?.readyState === 'complete') {
            resizeIframe();
        }

        // Resize on window resize (in case of responsive content)
        window.addEventListener('resize', resizeIframe);

        return () => {
            iframe.removeEventListener('load', resizeIframe);
            window.removeEventListener('resize', resizeIframe);
        };
    }, [iframeRef, htmlContent]);
}

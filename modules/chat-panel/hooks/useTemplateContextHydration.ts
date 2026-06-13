'use client';

import { useEffect } from 'react';
import { fetchTemplate } from '../adapters/artifact-actions';
import type { ConversationContext } from '@/modules/ai-enhance/hooks/useConversation';
import type { Template } from '@/lib/types/template';
import type { GenerationType } from './useSessionManager';
import type { ArtifactReference } from './useArtifactCatalog';

interface UseTemplateContextHydrationOptions {
  generationType: GenerationType;
  selectedTemplateArtifact: ArtifactReference | null;
  currentTemplateFromContext: ConversationContext['template'] | undefined;
  updateContext: (context: Partial<ConversationContext>) => void;
}

export function useTemplateContextHydration({
  generationType,
  selectedTemplateArtifact,
  currentTemplateFromContext,
  updateContext,
}: UseTemplateContextHydrationOptions): void {
  useEffect(() => {
    let cancelled = false;

    const hydrateTemplateContextFromReference = async () => {
      if (generationType !== 'template') return;
      if (!selectedTemplateArtifact) return;

      const templateResult = await fetchTemplate(selectedTemplateArtifact.id);
      if (cancelled) return;
      if (!templateResult.success || !templateResult.data) return;

      const template = templateResult.data as Template;
      if (
        currentTemplateFromContext?.name === template.name
        && currentTemplateFromContext?.htmlTemplate === template.htmlTemplate
      ) {
        return;
      }

      updateContext({
        template: {
          name: template.name,
          htmlTemplate: template.htmlTemplate,
        },
      });
    };

    void hydrateTemplateContextFromReference();

    return () => {
      cancelled = true;
    };
  }, [generationType, selectedTemplateArtifact, currentTemplateFromContext, updateContext]);
}

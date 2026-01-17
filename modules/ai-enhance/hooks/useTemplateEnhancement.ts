'use client';

import { useAITask } from './useAITask';
import { ConversationAttachment } from './useConversation';
import { useCallback, useState } from 'react';
import type { TemplateEnhancementOutput } from '@/lib/ai/modes/types';
import { TEMPLATE_REFINEMENT_USER_MESSAGE, DUMMY_RESUME_DATA } from '@/lib/ai/prompts/template-extraction';

/**
 * useTemplateEnhancement - Hook for generating or enhancing resume templates.
 */
export function useTemplateEnhancement() {
  const { runTask, isLoading, error, output, reset, hasOutput } = useAITask<TemplateEnhancementOutput>({
    mode: 'template-enhancement',
  });

  const [instructions, setInstructions] = useState('');
  const [template, setTemplate] = useState('');

  const generate = useCallback(async (file: File, modelId?: string) => {
    // Read file as base64 for attachment
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    return runTask({
      message: "Extract template from file",
      modelId,
      attachments: [{
        content: fileContent,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        mimeType: file.type
      }]
    });
  }, [runTask]);

  const refine = useCallback(async (originalFile: File, currentTemplate: string, modelId?: string) => {
    // Read file as base64 for attachment (the AI needs the image again for comparison)
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(originalFile);
    });

    return runTask({
      message: TEMPLATE_REFINEMENT_USER_MESSAGE,
      modelId,
      attachments: [
        {
          content: fileContent,
          type: originalFile.type.startsWith('image/') ? 'image' : 'document',
          name: originalFile.name,
          mimeType: originalFile.type
        },
        {
          content: JSON.stringify(DUMMY_RESUME_DATA, null, 2),
          type: 'document',
          name: 'dummy-data.json',
          mimeType: 'application/json'
        }
      ],
      context: { currentTemplate }
    });
  }, [runTask]);

  const enhance = useCallback(async (attachments?: ConversationAttachment[], overrideModelId?: string) => {
    return runTask({
      message: instructions,
      attachments,
      modelId: overrideModelId,
      context: { currentTemplate: template }
    });
  }, [runTask, instructions, template]);

  const htmlTemplate = output?.htmlTemplate;

  return {
    enhance,
    generate,
    refine,
    reset,
    template: htmlTemplate || '',
    enhancedContent: htmlTemplate ? { html: htmlTemplate } : null,
    isLoading,
    error,
    hasEnhancement: hasOutput,
    instructions,
    setInstructions,
    setTemplate,
  };
}

export { useTemplateEnhancement as useTemplateGeneration };

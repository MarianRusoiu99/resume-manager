'use client';

import { useAITask } from './useAITask';
import { ConversationAttachment } from './useConversation';
import { useCallback, useState } from 'react';

interface TemplateOutput {
  template?: string;
  html?: string;
}

/**
 * useTemplateEnhancement - Hook for generating or enhancing resume templates.
 */
export function useTemplateEnhancement() {
  const { runTask, isLoading, error, output, partialOutput, reset, hasOutput } = useAITask({
    mode: 'template-enhancement',
  });

  const [instructions, setInstructions] = useState('');
  const [template, setTemplate] = useState('');

  const generate = useCallback(async (file: File) => {
    // Read file as base64 for attachment
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    return runTask({
      message: "Extract template from file",
      attachments: [{
        content: fileContent,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        mimeType: file.type
      }]
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

  const typedOutput = output as TemplateOutput | null;

  return {
    enhance,
    generate,
    reset,
    template: typedOutput?.template || partialOutput,
    enhancedContent: typedOutput?.html ? { html: typedOutput.html } : null,
    isLoading,
    error,
    hasEnhancement: hasOutput,
    instructions,
    setInstructions,
    setTemplate,
  };
}

export { useTemplateEnhancement as useTemplateGeneration };

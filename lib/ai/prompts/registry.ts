export interface PromptDefinition {
  id: string;
  system: string;
  template: string;
  version: string;
  description?: string;
}

export class PromptRegistry {
  private static prompts: Map<string, PromptDefinition> = new Map();

  static register(prompt: PromptDefinition) {
    this.prompts.set(prompt.id, prompt);
  }

  static get(id: string): PromptDefinition | undefined {
    return this.prompts.get(id);
  }

  static render(id: string, variables: Record<string, string>): { system: string; prompt: string } {
    const definition = this.get(id);
    if (!definition) {
      throw new Error(`Prompt with ID "${id}" not found in registry.`);
    }

    let renderedPrompt = definition.template;
    for (const [key, value] of Object.entries(variables)) {
      renderedPrompt = renderedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return {
      system: definition.system,
      prompt: renderedPrompt,
    };
  }
}

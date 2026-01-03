import type { AIMode } from '../../modes/types';

/**
 * Parses AI output using mode configuration
 */
export function parseOutput<T>(text: string, mode: AIMode): T {
  const trimmed = text.trim();

  // Try to extract JSON from markdown blocks
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonString = jsonMatch ? jsonMatch[1] : trimmed;

  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate against schema
    const validated = mode.outputSchema.parse(parsed);
    
    // Post-process if available
    return (mode.postprocessOutput ? mode.postprocessOutput(validated) : validated) as T;
  } catch (error) {
    // If parsing fails and we just want text, return as-is
    if (mode.id === 'text-enhancement') {
      return trimmed as unknown as T;
    }
    
    throw new Error(`Failed to parse AI output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

import { logger } from '@/lib/utils/logger';
import type { AIMode } from '../../modes/types';

/**
 * Attempts to extract JSON from text, trying multiple strategies
 */
function extractJSON(text: string): string {
  const trimmed = text.trim();

  // Strategy 1: Extract from markdown code blocks
  const markdownMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }

  // Strategy 2: If text starts with [ or {, use it directly
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    // Try to find the matching closing bracket
    if (trimmed.startsWith('[')) {
      const match = trimmed.match(/\[[\s\S]*\]/);
      if (match) return match[0];
    } else {
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (match) return match[0];
    }
  }

  // Strategy 3: Find embedded JSON object
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  // Strategy 4: Find embedded JSON array
  const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  // Fallback: return original text
  return trimmed;
}

/**
 * Attempts to fix common JSON issues
 */
function attemptJSONRepair(jsonString: string): string {
  let fixed = jsonString;

  // Remove trailing commas before closing brackets
  fixed = fixed.replace(/,\s*([\]}])/g, '$1');

  // Fix unquoted keys (simple cases)
  fixed = fixed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

  // Remove control characters
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n' || char === '\r' || char === '\t') return char;
    return '';
  });

  return fixed;
}

/**
 * Parses AI output using mode configuration
 */
export function parseOutput<T>(text: string, mode: AIMode): T {
  const trimmed = text.trim();

  // For text enhancement, we can return the raw text if it's not JSON
  if (mode.id === 'text-enhancement') {
    try {
      const jsonString = extractJSON(trimmed);
      const parsed = JSON.parse(jsonString);
      if (parsed.content) {
        return (mode.postprocessOutput ? mode.postprocessOutput(parsed) : parsed) as T;
      }
    } catch {
      return { content: trimmed } as unknown as T;
    }
  }

  // Try to extract and parse JSON
  const jsonString = extractJSON(trimmed);
  
  try {
    const parsed = JSON.parse(jsonString);
    const validated = mode.outputSchema.parse(parsed);
    return (mode.postprocessOutput ? mode.postprocessOutput(validated) : validated) as T;
  } catch (error) {
    logger.error('Failed to parse AI output', {
      mode: mode.id,
      error: error instanceof Error ? error.message : String(error),
      textPreview: trimmed.slice(0, 200),
    });
    
    throw new Error(`AI service returned an invalid structure for mode ${mode.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


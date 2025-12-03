/**
 * Shared Utilities for AI Agents
 * 
 * Common utility functions used across all agents
 */

/**
 * Extract JSON from AI response text
 * 
 * Handles various response formats:
 * - JSON wrapped in markdown code blocks
 * - Raw JSON objects
 * - JSON with surrounding text
 */
export function extractJSON(text: string): string {
  // Try to extract JSON from markdown code block (```json ... ``` or ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find a JSON object directly
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return jsonObjectMatch[0];
  }
  
  // Return trimmed text as fallback
  return text.trim();
}

/**
 * Safely parse JSON with error handling
 * Returns null if parsing fails
 */
export function safeParseJSON<T = unknown>(text: string): T | null {
  try {
    const jsonStr = extractJSON(text);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Parse JSON with a Zod schema for validation
 * Returns the parsed and validated object, or null if parsing/validation fails
 */
export function parseWithSchema<T>(
  text: string,
  schema: { parse: (data: unknown) => T }
): T | null {
  try {
    const jsonStr = extractJSON(text);
    const parsed = JSON.parse(jsonStr);
    return schema.parse(parsed);
  } catch {
    return null;
  }
}

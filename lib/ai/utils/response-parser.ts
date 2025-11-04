/**
 * Response Parser Utilities
 * 
 * Robust utilities for parsing AI responses, especially JSON
 */

/**
 * Extract JSON from a text response that might include markdown code blocks
 */
export function extractJsonFromText(text: string): string {
  // Remove markdown code blocks if present
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  
  // If no code block, return trimmed text
  return text.trim();
}

/**
 * Parse JSON with better error messages
 */
export function parseJSON<T = unknown>(jsonString: string): T | null {
  try {
    const cleanedJson = extractJsonFromText(jsonString);
    return JSON.parse(cleanedJson) as T;
  } catch (error) {
    console.error('[parseJSON] Failed to parse JSON:', error);
    console.error('[parseJSON] Input string (first 200 chars):', jsonString.substring(0, 200));
    return null;
  }
}

/**
 * Parse agent JSON response with validation
 */
export function parseAgentJSON<T>(response: string): T | null {
  const parsed = parseJSON<T>(response);
  
  if (!parsed) {
    return null;
  }
  
  // Basic validation: ensure it's an object
  if (typeof parsed !== 'object' || parsed === null) {
    console.error('[parseAgentJSON] Parsed value is not an object');
    return null;
  }
  
  return parsed;
}

/**
 * Safe JSON stringify with fallback
 */
export function safeStringify(value: unknown, pretty: boolean = false): string {
  try {
    return JSON.stringify(value, null, pretty ? 2 : 0);
  } catch (error) {
    console.error('[safeStringify] Failed to stringify value:', error);
    return String(value);
  }
}

/**
 * Validate that a parsed object has required fields
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      missingFields.push(String(field));
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Clean and normalize JSON string before parsing
 * Removes common issues like trailing commas, unescaped quotes, etc.
 */
export function normalizeJsonString(jsonString: string): string {
  let normalized = jsonString.trim();
  
  // Remove BOM if present
  if (normalized.charCodeAt(0) === 0xFEFF) {
    normalized = normalized.slice(1);
  }
  
  // Remove trailing commas before closing braces/brackets
  normalized = normalized.replace(/,(\s*[}\]])/g, '$1');
  
  return normalized;
}

/**
 * Try parsing JSON with multiple strategies
 */
export function robustParseJSON<T>(text: string): T | null {
  // Strategy 1: Direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // Continue to next strategy
  }
  
  // Strategy 2: Extract from markdown and parse
  try {
    const extracted = extractJsonFromText(text);
    return JSON.parse(extracted) as T;
  } catch {
    // Continue to next strategy
  }
  
  // Strategy 3: Normalize and parse
  try {
    const normalized = normalizeJsonString(text);
    return JSON.parse(normalized) as T;
  } catch {
    // Continue to next strategy
  }
  
  // Strategy 4: Extract, normalize, and parse
  try {
    const extracted = extractJsonFromText(text);
    const normalized = normalizeJsonString(extracted);
    return JSON.parse(normalized) as T;
  } catch (error) {
    console.error('[robustParseJSON] All parsing strategies failed:', error);
    return null;
  }
}

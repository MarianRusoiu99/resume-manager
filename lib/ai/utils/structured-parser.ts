/**
 * Structured Output Parser
 * 
 * Leverages LangChain's built-in parsers for robust, type-safe JSON parsing.
 * Follows SOLID principles:
 * - Single Responsibility: Each parser has one job
 * - Open/Closed: Extensible through Zod schemas
 * - Dependency Inversion: Depends on LangChain abstractions
 */

import { JsonOutputParser, StructuredOutputParser } from '@langchain/core/output_parsers';
import { z, type ZodType } from 'zod';

/**
 * Generic structured output parser factory
 * Creates a parser that validates against a Zod schema
 * 
 * @example
 * const parser = createStructuredParser(JobAnalysisResultSchema);
 * const result = await parser.parse(llmResponse);
 */
export function createStructuredParser<Output = unknown>(
  schema: ZodType<Output>
) {
  return StructuredOutputParser.fromZodSchema(schema);
}

/**
 * Simple JSON output parser for unstructured JSON
 * Use when you don't have a predefined schema
 */
export function createJsonParser() {
  return new JsonOutputParser();
}

/**
 * Parse with fallback strategies
 * Attempts multiple parsing strategies before failing
 * 
 * @param text - Raw text to parse
 * @param parser - LangChain parser to use
 * @returns Parsed and validated data
 */
export async function parseWithFallback<T>(
  text: string,
  parser: JsonOutputParser | StructuredOutputParser<ZodType<T>>
): Promise<T> {
  const strategies = [
    // Strategy 1: Direct parse
    async () => parser.parse(text) as Promise<T>,
    
    // Strategy 2: Extract from markdown code block
    async () => {
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return parser.parse(jsonMatch[1]) as Promise<T>;
      }
      throw new Error('No JSON code block found');
    },
    
    // Strategy 3: Find JSON object in text
    async () => {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return parser.parse(jsonMatch[0]) as Promise<T>;
      }
      throw new Error('No JSON object found');
    },
  ];

  let lastError: Error | null = null;

  for (const strategy of strategies) {
    try {
      return await strategy();
    } catch (error) {
      lastError = error as Error;
      // Continue to next strategy
    }
  }

  throw new Error(
    `All parsing strategies failed. Last error: ${lastError?.message || 'Unknown'}`
  );
}

/**
 * Get format instructions for a structured parser
 * Returns instructions to include in prompts
 */
export function getFormatInstructions<T>(
  parser: StructuredOutputParser<ZodType<T>>
): string {
  return parser.getFormatInstructions();
}

/**
 * Validate parsed data against schema
 * Useful for runtime validation of external data
 */
export function validateAgainstSchema<Output>(
  data: unknown,
  schema: ZodType<Output>
): Output {
  return schema.parse(data);
}

/**
 * Safe parse that returns success/error result
 * Doesn't throw, returns result object instead
 */
export function safeParseWithSchema<Output>(
  data: unknown,
  schema: ZodType<Output>
): { success: true; data: Output } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

/**
 * Format Zod errors for user-friendly display
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join('; ');
}

/**
 * Create parser with custom error handling
 */
export class RobustStructuredParser<T> {
  private parser: StructuredOutputParser<ZodType<T>> | JsonOutputParser;
  private schema?: ZodType<T>;

  constructor(schema?: ZodType<T>) {
    if (schema) {
      this.schema = schema;
      this.parser = StructuredOutputParser.fromZodSchema(schema);
    } else {
      this.parser = new JsonOutputParser();
    }
  }

  /**
   * Parse with detailed error information
   */
  async parse(text: string): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
      const data = await parseWithFallback<T>(text, this.parser as StructuredOutputParser<ZodType<T>>);
      
      // Additional validation if schema provided
      if (this.schema) {
        const validated = this.schema.parse(data);
        return { success: true, data: validated };
      }
      
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validation failed: ${formatZodError(error)}`
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  /**
   * Get format instructions for prompts
   */
  getFormatInstructions(): string {
    if (this.parser instanceof StructuredOutputParser) {
      return this.parser.getFormatInstructions();
    }
    return 'Return a valid JSON object.';
  }
}

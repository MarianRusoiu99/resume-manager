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
 * Creates a minimal valid output for the mode when parsing completely fails
 */
function createFallbackOutput(mode: AIMode, rawText: string): unknown {
  // Try to extract any useful information from the raw text
  const cleanText = rawText.replace(/[\x00-\x1F\x7F]/g, ' ').trim();
  const textPreview = cleanText.slice(0, 500);
  
  switch (mode.id) {
    case 'resume-generation':
      return {
        resume: {
          basics: {
            name: 'Candidate',
            label: 'Professional',
            summary: textPreview 
              ? `Note: The AI response could not be fully parsed. Here is the raw response: ${textPreview}`
              : 'Unable to generate resume. Please provide your profile information and a clear job description.',
          },
          work: [],
          education: [],
          skills: [],
        },
        jobTitle: 'Position',
        companyName: 'Company',
        matchScore: 0,
        suggestions: [
          'The AI response could not be parsed into a valid resume format.',
          'Please try again with clearer input.',
          'Make sure your profile includes: name, work experience, skills, and education.',
          'Ensure the job description is a real job posting with clear requirements.',
        ],
      };

    case 'resume-enhancement':
      return {
        resume: {
          basics: {
            name: 'Candidate',
            summary: textPreview || 'Unable to enhance resume. Please try again.',
          },
          work: [],
          education: [],
          skills: [],
        },
        changes: [
          'Failed to parse AI response',
          'Please try again with a valid resume',
        ],
      };

    case 'cover-letter-generation':
      return {
        content: textPreview || 'Unable to generate cover letter. Please provide your resume and a job description, then try again.',
        subject: 'Job Application',
        recipientName: 'Hiring Manager',
        companyName: 'Company',
        jobTitle: 'Position',
      };

    case 'template-generation':
      return {
        htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .error { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; }
    .error h2 { color: #dc2626; margin-top: 0; }
    .error p { color: #7f1d1d; }
  </style>
</head>
<body>
  <div class="error">
    <h2>Template Generation Failed</h2>
    <p>Unable to generate a valid template from the AI response.</p>
    <p>Please try again with clearer instructions about the template design you want.</p>
  </div>
</body>
</html>`,
        name: 'Error Template',
        description: 'Placeholder template - generation failed',
      };

    case 'template-enhancement':
      return {
        htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .notice { background: #fffbeb; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="notice">
    <h2>Enhancement Failed</h2>
    <p>Unable to enhance the template. Please try again.</p>
  </div>
</body>
</html>`,
        changes: ['Failed to parse AI response - please try again'],
      };

    case 'text-enhancement':
      return {
        content: textPreview || 'Unable to enhance text. Please try again.',
      };

    default:
      // For unknown modes, return a generic structure
      return { 
        error: 'Unable to parse AI response',
        message: 'Please try again with clearer input.',
        rawText: textPreview,
      };
  }
}

/**
 * Parses AI output using mode configuration with multiple fallback strategies
 */
export function parseOutput<T>(text: string, mode: AIMode): T {
  const trimmed = text.trim();

  // For text enhancement, we can return the raw text
  if (mode.id === 'text-enhancement') {
    // Still try to parse as JSON first
    try {
      const jsonString = extractJSON(trimmed);
      const parsed = JSON.parse(jsonString);
      if (parsed.content) {
        return (mode.postprocessOutput ? mode.postprocessOutput(parsed) : parsed) as T;
      }
    } catch {
      // Not JSON, return as content object
      return { content: trimmed } as unknown as T;
    }
  }

  // Try to extract and parse JSON
  let jsonString = extractJSON(trimmed);
  let parsed: unknown;

  // Attempt 1: Direct parse
  try {
    parsed = JSON.parse(jsonString);
  } catch (firstError) {
    // Attempt 2: Try to repair common JSON issues
    try {
      const repaired = attemptJSONRepair(jsonString);
      parsed = JSON.parse(repaired);
      logger.debug('JSON repaired successfully');
    } catch (secondError) {
      // Attempt 3: Use fallback output
      logger.warn('Failed to parse AI output, using fallback', {
        mode: mode.id,
        firstError: firstError instanceof Error ? firstError.message : String(firstError),
        textPreview: trimmed.slice(0, 200),
      });

      const fallback = createFallbackOutput(mode, trimmed);
      return (mode.postprocessOutput ? mode.postprocessOutput(fallback) : fallback) as T;
    }
  }

  // Validate against schema
  try {
    const validated = mode.outputSchema.parse(parsed);
    return (mode.postprocessOutput ? mode.postprocessOutput(validated) : validated) as T;
  } catch (validationError) {
    logger.warn('AI output failed schema validation, attempting partial recovery', {
      mode: mode.id,
      error: validationError instanceof Error ? validationError.message : String(validationError),
    });

    // Try to use safeParse for partial data
    const safeResult = mode.outputSchema.safeParse(parsed);
    if (safeResult.success) {
      return (mode.postprocessOutput ? mode.postprocessOutput(safeResult.data) : safeResult.data) as T;
    }

    // If validation completely fails, use fallback
    const fallback = createFallbackOutput(mode, trimmed);
    return (mode.postprocessOutput ? mode.postprocessOutput(fallback) : fallback) as T;
  }
}

/**
 * Output Parser Tests
 * 
 * Tests for parsing AI output with edge cases including gibberish inputs
 */

import { describe, it, expect, vi } from 'vitest';
import { parseOutput } from '../chat/orchestrator/output-parser';
import { z } from 'zod';
import type { AIMode } from '../modes/types';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Create test mode schemas
const resumeGenerationSchema = z.object({
  resume: z.object({
    basics: z.object({
      name: z.string().optional(),
      summary: z.string().optional(),
    }).optional(),
  }),
  jobTitle: z.string(),
  companyName: z.string(),
  matchScore: z.number().optional(),
  suggestions: z.array(z.string()).optional(),
});

const textEnhancementSchema = z.object({
  content: z.string(),
});

const coverLetterSchema = z.object({
  content: z.string(),
  subject: z.string().optional(),
});

// Test mode definitions
function createTestMode(id: string, schema: z.ZodSchema): AIMode {
  return {
    id,
    name: id,
    description: `Test mode: ${id}`,
    outputSchema: schema,
    buildSystemPrompt: () => 'Test system prompt',
    getTools: () => [],
  } as AIMode;
}

const resumeMode = createTestMode('resume-generation', resumeGenerationSchema);
const textMode = createTestMode('text-enhancement', textEnhancementSchema);
const coverLetterMode = createTestMode('cover-letter-generation', coverLetterSchema);

describe('parseOutput', () => {
  describe('valid JSON parsing', () => {
    it('parses valid JSON directly', () => {
      const input = JSON.stringify({
        resume: { basics: { name: 'John Doe' } },
        jobTitle: 'Engineer',
        companyName: 'Acme',
      });

      const result = parseOutput(input, resumeMode);

      expect(result).toEqual({
        resume: { basics: { name: 'John Doe' } },
        jobTitle: 'Engineer',
        companyName: 'Acme',
      });
    });

    it('extracts JSON from markdown code blocks', () => {
      const input = `Here is the result:
\`\`\`json
{
  "resume": { "basics": { "name": "Jane Doe" } },
  "jobTitle": "Designer",
  "companyName": "Design Co"
}
\`\`\`
Hope this helps!`;

      const result = parseOutput(input, resumeMode);

      expect(result).toEqual({
        resume: { basics: { name: 'Jane Doe' } },
        jobTitle: 'Designer',
        companyName: 'Design Co',
      });
    });

    it('extracts JSON from code blocks without language specifier', () => {
      const input = `\`\`\`
{
  "resume": { "basics": { "name": "Test" } },
  "jobTitle": "Dev",
  "companyName": "Tech"
}
\`\`\``;

      const result = parseOutput(input, resumeMode);

      expect(result).toEqual({
        resume: { basics: { name: 'Test' } },
        jobTitle: 'Dev',
        companyName: 'Tech',
      });
    });

    it('extracts embedded JSON from mixed content', () => {
      const input = `I've analyzed the job and here's the resume: {"resume": {"basics": {"name": "Bob"}}, "jobTitle": "Manager", "companyName": "Corp"} Let me know if you need changes.`;

      const result = parseOutput(input, resumeMode);

      expect(result).toEqual({
        resume: { basics: { name: 'Bob' } },
        jobTitle: 'Manager',
        companyName: 'Corp',
      });
    });
  });

  describe('text enhancement mode', () => {
    it('returns raw text as content for plain text input', () => {
      const input = 'This is enhanced text without any JSON formatting.';

      const result = parseOutput(input, textMode);

      expect(result).toEqual({ content: input });
    });

    it('parses JSON content object for text enhancement', () => {
      const input = '{"content": "Enhanced professional text"}';

      const result = parseOutput(input, textMode);

      expect(result).toEqual({ content: 'Enhanced professional text' });
    });
  });

  describe('edge cases with gibberish input', () => {
    it('throws error for completely gibberish input', () => {
      const input = 'asdfghjkl qwertyuiop zxcvbnm 12345 !@#$%';

      expect(() => parseOutput(input, resumeMode)).toThrow(/AI service returned an invalid structure/);
    });

    it('throws error for empty input', () => {
      const input = '';

      expect(() => parseOutput(input, resumeMode)).toThrow(/AI service returned an invalid structure/);
    });

    it('throws error for whitespace-only input', () => {
      const input = '   \n\t   \n   ';

      expect(() => parseOutput(input, resumeMode)).toThrow(/AI service returned an invalid structure/);
    });

    it('throws error for partial/truncated JSON', () => {
      const input = '{"resume": {"basics": {"name": "John"';

      expect(() => parseOutput(input, resumeMode)).toThrow(/AI service returned an invalid structure/);
    });

    it('throws error for JSON with invalid characters if parsing fails', () => {
      const input = '{"resume": {"basics": {"name": "John\x00Doe"}}, "jobTitle": "Dev", "companyName": "Co"}';

      expect(() => parseOutput(input, resumeMode)).toThrow(/AI service returned an invalid structure/);
    });

    it('throws error for mixed language gibberish', () => {
      const input = '这是中文 这是日本語 это русский مرحبا 🎉🚀';

      expect(() => parseOutput(input, resumeMode)).toThrow(/AI service returned an invalid structure/);
    });
  });

  describe('schema validation failures', () => {
    it('throws error for missing required fields', () => {
      const input = '{"resume": {"basics": {"name": "Test"}}}';

      expect(() => parseOutput(input, resumeMode)).toThrow(/AI service returned an invalid structure/);
    });

    it('throws error for wrong data types', () => {
      const input = '{"resume": {}, "jobTitle": 123, "companyName": "Co"}';

      expect(() => parseOutput(input, resumeMode)).toThrow(/AI service returned an invalid structure/);
    });

    it('handles extra unexpected fields gracefully (Zod behavior)', () => {
      const input = JSON.stringify({
        resume: { basics: { name: 'Test' } },
        jobTitle: 'Dev',
        companyName: 'Co',
        unexpectedField: 'should be ignored',
      });

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('jobTitle', 'Dev');
      expect(result).toHaveProperty('companyName', 'Co');
    });
  });

  describe('array extraction', () => {
    const arrayMode = createTestMode('array-test', z.array(z.object({ id: z.number() })));

    it('extracts JSON arrays from direct input', () => {
      const input = '[{"id": 1}, {"id": 2}]';

      const result = parseOutput(input, arrayMode);

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('nested markdown and JSON', () => {
    it('handles multiple code blocks (uses first)', () => {
      const input = `First block:
\`\`\`json
{"resume": {}, "jobTitle": "First", "companyName": "Co1"}
\`\`\`

Second block:
\`\`\`json
{"resume": {}, "jobTitle": "Second", "companyName": "Co2"}
\`\`\``;

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('jobTitle', 'First');
    });
  });

  describe('performance with large inputs', () => {
    it('handles large valid JSON', () => {
      const largeResume = {
        resume: {
          basics: { name: 'Test', summary: 'x'.repeat(5000) },
          work: Array(10).fill({
            name: 'Company',
            position: 'Role',
          }),
        },
        jobTitle: 'Engineer',
        companyName: 'BigCorp',
      };

      const input = JSON.stringify(largeResume);

      const start = Date.now();
      const result = parseOutput(input, resumeMode);
      const duration = Date.now() - start;

      expect(result).toHaveProperty('jobTitle', 'Engineer');
      expect(duration).toBeLessThan(1000);
    });
  });
});

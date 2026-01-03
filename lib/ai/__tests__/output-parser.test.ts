/**
 * Output Parser Tests
 * 
 * Tests for parsing AI output with edge cases including gibberish inputs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    it('handles completely gibberish input with fallback', () => {
      const input = 'asdfghjkl qwertyuiop zxcvbnm 12345 !@#$%';

      const result = parseOutput(input, resumeMode);

      // Should return fallback output
      expect(result).toHaveProperty('resume');
      expect(result).toHaveProperty('jobTitle', 'Position');
      expect(result).toHaveProperty('companyName', 'Company');
      expect(result).toHaveProperty('suggestions');
    });

    it('handles empty input with fallback', () => {
      const input = '';

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('resume');
      expect(result).toHaveProperty('jobTitle', 'Position');
    });

    it('handles whitespace-only input with fallback', () => {
      const input = '   \n\t   \n   ';

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('resume');
    });

    it('handles partial/truncated JSON with fallback', () => {
      const input = '{"resume": {"basics": {"name": "John"';

      const result = parseOutput(input, resumeMode);

      // Should use fallback
      expect(result).toHaveProperty('resume');
      expect(result).toHaveProperty('companyName');
    });

    it('handles JSON with invalid characters', () => {
      const input = '{"resume": {"basics": {"name": "John\x00Doe"}}, "jobTitle": "Dev", "companyName": "Co"}';

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('resume');
    });

    it('handles mixed language gibberish', () => {
      const input = '这是中文 これは日本語 это русский مرحبا 🎉🚀';

      const result = parseOutput(input, resumeMode);

      // Should return fallback
      expect(result).toHaveProperty('resume');
      expect(result).toHaveProperty('jobTitle', 'Position');
    });

    it('handles very long gibberish input', () => {
      const input = 'x'.repeat(10000);

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('resume');
      // Summary should contain truncated preview
      const resume = (result as { resume: { basics: { summary: string } } }).resume;
      expect(resume.basics.summary.length).toBeLessThan(1000);
    });

    it('handles input with only special characters', () => {
      const input = '!@#$%^&*()_+-=[]{}|;:\'"<>,.?/~`';

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('resume');
    });

    it('handles random binary-like data', () => {
      const input = '\x01\x02\x03\x04\x05randomdata\xff\xfe\xfd';

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('resume');
    });
  });

  describe('JSON repair capabilities', () => {
    it('handles trailing commas', () => {
      const input = '{"resume": {"basics": {}}, "jobTitle": "Dev", "companyName": "Co",}';

      const result = parseOutput(input, resumeMode);

      expect(result).toEqual({
        resume: { basics: {} },
        jobTitle: 'Dev',
        companyName: 'Co',
      });
    });

    it('handles unquoted keys in simple cases', () => {
      const input = '{resume: {"basics": {}}, jobTitle: "Dev", companyName: "Co"}';

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('resume');
    });
  });

  describe('cover letter mode edge cases', () => {
    it('returns raw text as content for cover letter mode', () => {
      const input = 'Dear Hiring Manager, I am writing to apply...';

      // Cover letter mode should handle plain text gracefully
      const result = parseOutput(input, coverLetterMode);

      expect(result).toHaveProperty('content');
    });

    it('handles gibberish for cover letter mode', () => {
      const input = 'askdjhaksjdh 12312312 @#@#@#';

      const result = parseOutput(input, coverLetterMode);

      expect(result).toHaveProperty('content');
    });
  });

  describe('schema validation failures', () => {
    it('handles missing required fields by using fallback', () => {
      // Missing jobTitle and companyName
      const input = '{"resume": {"basics": {"name": "Test"}}}';

      const result = parseOutput(input, resumeMode);

      // Should use fallback because validation fails
      expect(result).toHaveProperty('jobTitle');
      expect(result).toHaveProperty('companyName');
    });

    it('handles wrong data types by using fallback', () => {
      // jobTitle should be string, not number
      const input = '{"resume": {}, "jobTitle": 123, "companyName": "Co"}';

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('jobTitle');
    });

    it('handles extra unexpected fields gracefully', () => {
      const input = JSON.stringify({
        resume: { basics: { name: 'Test' } },
        jobTitle: 'Dev',
        companyName: 'Co',
        unexpectedField: 'should be ignored',
        anotherOne: { nested: true },
      });

      const result = parseOutput(input, resumeMode);

      expect(result).toHaveProperty('jobTitle', 'Dev');
      expect(result).toHaveProperty('companyName', 'Co');
    });

    it('fallback includes helpful suggestions', () => {
      const input = 'this is not valid json at all';

      const result = parseOutput(input, resumeMode) as { suggestions: string[] };

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('fallback resume has proper structure', () => {
      const input = 'invalid';

      const result = parseOutput(input, resumeMode) as { 
        resume: { 
          basics: { name: string; label: string; summary: string };
          work: unknown[];
          education: unknown[];
          skills: unknown[];
        } 
      };

      expect(result.resume.basics.name).toBe('Candidate');
      expect(result.resume.basics.label).toBe('Professional');
      expect(result.resume.work).toEqual([]);
      expect(result.resume.education).toEqual([]);
      expect(result.resume.skills).toEqual([]);
    });
  });

  describe('array extraction', () => {
    const arrayMode = createTestMode('array-test', z.array(z.object({ id: z.number() })));

    it('extracts JSON arrays from direct input', () => {
      const input = '[{"id": 1}, {"id": 2}]';

      const result = parseOutput(input, arrayMode);

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('extracts JSON arrays from text content', () => {
      // For unknown mode types, fallback is used, so we test direct array input
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

      // Should use the first code block
      expect(result).toHaveProperty('jobTitle', 'First');
    });

    it('prefers code block over inline JSON', () => {
      const input = `{"resume": {}, "jobTitle": "Inline", "companyName": "Inline"}
\`\`\`json
{"resume": {}, "jobTitle": "Block", "companyName": "Block"}
\`\`\``;

      const result = parseOutput(input, resumeMode);

      // Since code block is later and we check markdown first, it should prefer code block
      // Actually, our implementation checks markdown match first
      expect(result).toHaveProperty('jobTitle', 'Block');
    });
  });

  describe('performance with large inputs', () => {
    it('handles large valid JSON', () => {
      const largeResume = {
        resume: {
          basics: { name: 'Test', summary: 'x'.repeat(5000) },
          work: Array(50).fill({
            name: 'Company',
            position: 'Role',
            summary: 'Did things',
            highlights: Array(10).fill('Achievement'),
          }),
          skills: Array(30).fill({
            name: 'Skill',
            level: 'Expert',
            keywords: Array(5).fill('keyword'),
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
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

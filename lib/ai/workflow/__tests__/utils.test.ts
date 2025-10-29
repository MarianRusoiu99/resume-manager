/**
 * Tests for AI Workflow Utilities
 * 
 * Tests the parseAgentJSON utility function that handles both
 * markdown-wrapped and plain JSON responses from AI agents.
 */

import { describe, it, expect } from 'vitest';
import { parseAgentJSON } from '../utils';

describe('parseAgentJSON', () => {
  describe('Markdown-wrapped JSON', () => {
    it('should parse JSON from markdown code block', () => {
      const input = '```json\n{"key": "value", "number": 42}\n```';
      const result = parseAgentJSON<{ key: string; number: number }>(input);
      
      expect(result).not.toBeNull();
      expect(result?.key).toBe('value');
      expect(result?.number).toBe(42);
    });

    it('should parse JSON with extra whitespace in markdown', () => {
      const input = '```json  \n\n  {"key": "value"}  \n\n```';
      const result = parseAgentJSON<{ key: string }>(input);
      
      expect(result).not.toBeNull();
      expect(result?.key).toBe('value');
    });

    it('should parse complex nested JSON from markdown', () => {
      const input = `\`\`\`json
{
  "data": {
    "nested": true,
    "items": [1, 2, 3]
  }
}
\`\`\``;
      const result = parseAgentJSON<{ data: { nested: boolean; items: number[] } }>(input);
      
      expect(result).not.toBeNull();
      expect(result?.data.nested).toBe(true);
      expect(result?.data.items).toEqual([1, 2, 3]);
    });
  });

  describe('Plain JSON', () => {
    it('should parse plain JSON without markdown', () => {
      const input = '{"key": "value", "number": 42}';
      const result = parseAgentJSON<{ key: string; number: number }>(input);
      
      expect(result).not.toBeNull();
      expect(result?.key).toBe('value');
      expect(result?.number).toBe(42);
    });

    it('should parse plain JSON with whitespace', () => {
      const input = '  \n  {"key": "value"}  \n  ';
      const result = parseAgentJSON<{ key: string }>(input);
      
      expect(result).not.toBeNull();
      expect(result?.key).toBe('value');
    });

    it('should parse complex nested plain JSON', () => {
      const input = JSON.stringify({
        data: {
          nested: true,
          items: [1, 2, 3],
          obj: { a: 1, b: 2 }
        }
      });
      const result = parseAgentJSON<{ data: { nested: boolean; items: number[]; obj: { a: number; b: number } } }>(input);
      
      expect(result).not.toBeNull();
      expect(result?.data.nested).toBe(true);
      expect(result?.data.items).toEqual([1, 2, 3]);
      expect(result?.data.obj).toEqual({ a: 1, b: 2 });
    });
  });

  describe('Error handling', () => {
    it('should return null for invalid JSON', () => {
      const input = 'not valid json at all';
      const result = parseAgentJSON(input);
      
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const input = '';
      const result = parseAgentJSON(input);
      
      expect(result).toBeNull();
    });

    it('should return null for malformed markdown', () => {
      const input = '```json\n{invalid json\n```';
      const result = parseAgentJSON(input);
      
      expect(result).toBeNull();
    });

    it('should return null for incomplete markdown block', () => {
      const input = '```json\n{"key": "value"}';
      const result = parseAgentJSON(input);
      
      expect(result).toBeNull();
    });

    it('should return null for markdown without json tag', () => {
      const input = '```\n{"key": "value"}\n```';
      const result = parseAgentJSON(input);
      
      // Without 'json' tag, the regex won't match, so it will try to parse the whole string
      // including backticks, which will fail
      expect(result).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle JSON with special characters', () => {
      const input = '```json\n{"key": "value with \\"quotes\\" and \\n newlines"}\n```';
      const result = parseAgentJSON<{ key: string }>(input);
      
      expect(result).not.toBeNull();
      expect(result?.key).toBe('value with "quotes" and \n newlines');
    });

    it('should handle JSON with unicode characters', () => {
      const input = '```json\n{"emoji": "🎨", "chinese": "你好"}\n```';
      const result = parseAgentJSON<{ emoji: string; chinese: string }>(input);
      
      expect(result).not.toBeNull();
      expect(result?.emoji).toBe('🎨');
      expect(result?.chinese).toBe('你好');
    });

    it('should handle arrays at root level', () => {
      const input = '```json\n[1, 2, 3, 4, 5]\n```';
      const result = parseAgentJSON<number[]>(input);
      
      expect(result).not.toBeNull();
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle null values in JSON', () => {
      const input = '```json\n{"key": null, "other": "value"}\n```';
      const result = parseAgentJSON<{ key: null; other: string }>(input);
      
      expect(result).not.toBeNull();
      expect(result?.key).toBeNull();
      expect(result?.other).toBe('value');
    });

    it('should handle empty objects', () => {
      const input = '```json\n{}\n```';
      const result = parseAgentJSON<Record<string, never>>(input);
      
      expect(result).not.toBeNull();
      expect(result).toEqual({});
    });

    it('should handle empty arrays', () => {
      const input = '```json\n[]\n```';
      const result = parseAgentJSON<never[]>(input);
      
      expect(result).not.toBeNull();
      expect(result).toEqual([]);
    });
  });

  describe('Real-world scenarios', () => {
    it('should parse content optimization response format', () => {
      const input = `\`\`\`json
{
  "summary": "Experienced software engineer with 5+ years",
  "experience": [
    {
      "company": "Tech Corp",
      "title": "Senior Engineer",
      "startDate": "2020-01",
      "endDate": "2023-12",
      "current": false,
      "description": "Led team of 5 developers",
      "bulletPoints": ["Improved performance by 50%", "Reduced bugs by 30%"]
    }
  ],
  "prioritizedSkills": ["JavaScript", "TypeScript", "React"]
}
\`\`\``;
      
      type ContentResponse = {
        summary: string;
        experience: Array<{
          company: string;
          title: string;
          startDate: string;
          endDate: string;
          current: boolean;
          description: string;
          bulletPoints: string[];
        }>;
        prioritizedSkills: string[];
      };
      
      const result = parseAgentJSON<ContentResponse>(input);
      
      expect(result).not.toBeNull();
      expect(result?.summary).toContain('software engineer');
      expect(result?.experience).toHaveLength(1);
      expect(result?.experience[0].company).toBe('Tech Corp');
      expect(result?.prioritizedSkills).toEqual(['JavaScript', 'TypeScript', 'React']);
    });

    it('should parse format validation response format', () => {
      const input = `\`\`\`json
{
  "atsCompliant": true,
  "issues": [
    {
      "severity": "warning",
      "message": "Consider adding more keywords",
      "location": "summary"
    }
  ],
  "recommendations": ["Add more action verbs", "Quantify achievements"]
}
\`\`\``;
      
      type ValidationResponse = {
        atsCompliant: boolean;
        issues: Array<{
          severity: string;
          message: string;
          location: string;
        }>;
        recommendations: string[];
      };
      
      const result = parseAgentJSON<ValidationResponse>(input);
      
      expect(result).not.toBeNull();
      expect(result?.atsCompliant).toBe(true);
      expect(result?.issues).toHaveLength(1);
      expect(result?.recommendations).toHaveLength(2);
    });
  });
});

/**
 * Template Generation Mode
 *
 * Mode for generating HTML/CSS resume templates from images
 */

import { defineMode } from './types';
import { templateGenerationOutputSchema } from '../schemas';
import { BASE_SYSTEM_PROMPT, TEMPLATE_EXPERT_PROMPT, TEMPLATE_OUTPUT_INSTRUCTIONS, HANDLEBARS_REFERENCE } from '../prompts/system';
import { MASTER_RESUME_DATA } from '../prompts/template-extraction';
import type { ConversationContext } from '../chat/context';

export const templateGenerationMode = defineMode({
  id: 'template-generation',
  name: 'Template Generation',
  description: 'Generate HTML/CSS resume templates from design images',

  outputSchema: templateGenerationOutputSchema,
  primaryResultKey: 'htmlTemplate',

  useStructuredOutput: true,
  requiresVision: true,
  maxTokens: 12000,

  buildSystemPrompt(_context: ConversationContext): string {
    const parts: string[] = [
      BASE_SYSTEM_PROMPT,
      '',
      TEMPLATE_EXPERT_PROMPT,
      '',
      HANDLEBARS_REFERENCE,
      '',
      '## YOUR TASK',
      'Analyze the provided resume design image and recreate it as an HTML/CSS template.',
      '',
      '### STRESS TEST MANDATE',
      'The template MUST be designed to handle all 12 sections of the JSON Resume schema gracefully. Use the provided MASTER JSON structure as your reference for data coverage and section naming.',
      '',
      '### REQUIREMENTS',
      '1. Match the visual design as closely as possible.',
      '2. Use Handlebars syntax for all dynamic content.',
      '3. EVERY section and optional field MUST be wrapped in Handlebars {{#if}} blocks to prevent empty headers or whitespace when data is missing.',
      '4. Create print-friendly CSS (A4 page size) with break-inside: avoid for list items.',
      '5. Use CSS Flexbox or Grid for a flexible layout that handles varying data density.',
      '',
      '### MASTER DATA REFERENCE (FOR SECTION COVERAGE)',
      '```json',
      JSON.stringify(MASTER_RESUME_DATA, null, 2),
      '```',
      '',
      TEMPLATE_OUTPUT_INSTRUCTIONS,
      '',
      'IMPORTANT: Always return a valid JSON object. Do not include any explanations or markdown blocks.',
    ];

    return parts.join('\n');
  },

  preprocessUserMessage(message: string, _context: ConversationContext): string {
    const parts: string[] = [];

    parts.push('## INSTRUCTIONS');
    if (message.trim()) {
      parts.push(message);
    } else {
      parts.push('Please analyze the attached resume design image and create an HTML/CSS template that replicates this design.');
      parts.push('Use Handlebars syntax for dynamic content and ensure it works with the JSON Resume schema.');
    }

    return parts.join('\n');
  },

  getTools() {
    return [];
  },

  validateOutput(output) {
    const warnings: string[] = [];

    // Validate HTML has Handlebars placeholders
    if (!output.htmlTemplate.includes('{{')) {
      // Don't error out, just warn. The user can fix it in the editor.
      warnings.push('HTML template might be missing Handlebars placeholders');
    }

    // Check for required sections
    const requiredPlaceholders = ['basics.name', 'work', 'education', 'skills'];
    for (const placeholder of requiredPlaceholders) {
      if (!output.htmlTemplate.includes(placeholder)) {
        warnings.push(`Template may be missing the ${placeholder} section`);
      }
    }

    // Validate HTML has style tag
    if (!output.htmlTemplate.includes('<style>')) {
      warnings.push('HTML template is missing a <style> tag. Styles should be embedded in the HTML.');
    }

    return {
      valid: true, // Always return valid so the first attempt doesn't fail the extraction
      errors: undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
});

/**
 * Template Extraction Prompt & Schema
 * Prompt and validation schema for AI-powered template extraction from images
 */

import { z } from 'zod';

/**
 * Response schema for template extraction
 */
export const templateExtractionSchema = z.object({
    htmlTemplate: z.string().min(1, 'HTML template is required'),
    cssStyles: z.string().min(1, 'CSS styles are required'),
    name: z.string().optional(),
    category: z.enum(['PROFESSIONAL', 'MODERN', 'CREATIVE', 'ATS_OPTIMIZED', 'MINIMAL']).optional(),
    description: z.string().optional(),
});

export type ExtractedTemplateData = z.infer<typeof templateExtractionSchema>;

/**
 * System prompt for template extraction
 * Instructs the AI to analyze a resume template image and recreate it as Handlebars HTML + CSS
 */
export const TEMPLATE_EXTRACTION_PROMPT = `You are an expert resume template designer and HTML/CSS developer. Your task is to analyze a resume template image and recreate it as a Handlebars HTML template with matching CSS.

## YOUR GOAL
Accurately recreate the visual design from the image. You have FULL CREATIVE FREEDOM to structure the HTML and CSS however best matches what you see.

## JSON RESUME DATA STRUCTURE
The template will receive this data structure. Use these Handlebars placeholders:

\`\`\`
{
  "basics": {
    "name": "John Doe",
    "label": "Software Engineer",
    "email": "john@example.com",
    "phone": "+1 555-1234",
    "url": "https://johndoe.com",
    "summary": "Professional summary text...",
    "location": { "city": "San Francisco", "region": "CA", "countryCode": "US" },
    "profiles": [{ "network": "LinkedIn", "username": "johndoe", "url": "..." }]
  },
  "work": [{ "name": "Company", "position": "Job Title", "startDate": "2020-01", "endDate": "2023-12", "summary": "...", "highlights": ["Achievement 1"] }],
  "education": [{ "institution": "University", "studyType": "Bachelor", "area": "CS", "startDate": "2016", "endDate": "2020", "score": "3.8" }],
  "skills": [{ "name": "Programming", "level": "Expert", "keywords": ["JavaScript", "Python"] }],
  "projects": [{ "name": "...", "description": "...", "highlights": [...], "url": "..." }],
  "certificates": [{ "name": "...", "issuer": "...", "date": "..." }],
  "languages": [{ "language": "English", "fluency": "Native" }],
  "awards": [{ "title": "...", "awarder": "...", "date": "...", "summary": "..." }],
  "volunteer": [{ "organization": "...", "position": "...", ... }],
  "publications": [{ "name": "...", "publisher": "...", "releaseDate": "..." }],
  "references": [{ "name": "...", "reference": "..." }],
  "interests": [{ "name": "...", "keywords": [...] }]
}
\`\`\`

## HANDLEBARS SYNTAX
- Simple value: {{basics.name}}
- Conditional: {{#if basics.summary}}...{{/if}}
- Loop: {{#each work}}...{{/each}} (use {{this}} for array items)
- Nested: {{#if endDate}}{{endDate}}{{else}}Present{{/if}}

## REQUIREMENTS
1. **MATCH THE IMAGE** - Recreate the exact visual design (layout, colors, typography)
2. **EXACT COLORS** - Extract hex colors from the image
3. **INCLUDE ALL SECTIONS** - Template for all JSON Resume sections
4. **PROFESSIONAL CSS** - Include @media print rules

## OUTPUT FORMAT
Return a JSON object:
{
  "htmlTemplate": "<main>...</main>",
  "cssStyles": "/* your CSS */",
  "name": "Descriptive name based on the design",
  "category": "PROFESSIONAL|MODERN|CREATIVE|ATS_OPTIMIZED|MINIMAL",
  "description": "Brief description of the visual style"
}

Return ONLY valid JSON, no markdown code blocks or explanations.`;

/**
 * User message for template extraction
 */
export const TEMPLATE_EXTRACTION_USER_MESSAGE =
    "Analyze this resume template image carefully. Recreate its exact visual design as a Handlebars HTML template with CSS. Pay close attention to layout, colors, typography, spacing, and unique design elements:";

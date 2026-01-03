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
    name: z.string().optional(),
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
  "htmlTemplate": "<style>...</style><main>...</main>",
  "name": "Descriptive name based on the design",
  "description": "Brief description of the visual style"
}

Return ONLY valid JSON, no markdown code blocks or explanations.`;

/**
 * User message for template extraction
 */
export const TEMPLATE_EXTRACTION_USER_MESSAGE =
    "Analyze this resume template image carefully. Recreate its exact visual design as a Handlebars HTML template with CSS. Pay close attention to layout, colors, typography, spacing, and unique design elements:";

/**
 * Dummy data for template refinement
 */
export const DUMMY_RESUME_DATA = {
    basics: {
        name: "JONATHAN SMITH",
        label: "Senior Full Stack Engineer",
        email: "jonathan.smith@example.com",
        phone: "+1 (555) 000-1111",
        url: "https://jonathansmith.dev",
        summary: "Innovative Full Stack Engineer with 10+ years of experience in building scalable web applications. Expert in React, Node.js, and cloud architecture. Proven track record of leading teams and delivering high-impact projects on time and within budget.",
        location: {
            city: "New York",
            region: "NY",
            countryCode: "US"
        },
        profiles: [
            {
                network: "LinkedIn",
                username: "jsmith",
                url: "https://linkedin.com/in/jsmith"
            },
            {
                network: "GitHub",
                username: "jsmith-dev",
                url: "https://github.com/jsmith-dev"
            }
        ]
    },
    work: [
        {
            name: "Tech Solutions Inc.",
            position: "Senior Software Engineer",
            startDate: "2018-03",
            endDate: "Present",
            summary: "Leading the core platform team in migrating legacy services to a microservices architecture.",
            highlights: [
                "Reduced system latency by 40% through Redis caching implementation",
                "Mentored 5 junior developers and improved team velocity by 25%",
                "Architected a new real-time analytics dashboard using WebSocket and D3.js"
            ]
        },
        {
            name: "Web Innovations",
            position: "Software Developer",
            startDate: "2014-06",
            endDate: "2018-02",
            summary: "Developed and maintained various client-facing web applications.",
            highlights: [
                "Implemented responsive UI components using Styled Components",
                "Streamlined CI/CD pipelines reducing deployment time by 50%"
            ]
        }
    ],
    education: [
        {
            institution: "State University of Technology",
            area: "Computer Science",
            studyType: "Bachelor of Science",
            startDate: "2010",
            endDate: "2014",
            score: "3.9/4.0"
        }
    ],
    skills: [
        {
            name: "Frontend",
            level: "Expert",
            keywords: ["React", "TypeScript", "Next.js", "Tailwind CSS"]
        },
        {
            name: "Backend",
            level: "Expert",
            keywords: ["Node.js", "PostgreSQL", "GraphQL", "Docker"]
        }
    ],
    projects: [
        {
            name: "Open Source CRM",
            description: "A lightweight, customizable CRM for small businesses.",
            highlights: [
                "1000+ stars on GitHub",
                "Used by over 50 companies worldwide"
            ],
            url: "https://github.com/jsmith-dev/crm"
        }
    ],
    languages: [
        {
            language: "English",
            fluency: "Native"
        },
        {
            language: "Spanish",
            fluency: "Intermediate"
        }
    ]
};

/**
 * Prompt for refining an extracted template
 */
export const TEMPLATE_REFINEMENT_USER_MESSAGE = 
    "I have extracted a Handlebars template from the attached image. Now, I want you to refine it. I'm providing dummy resume data as a JSON document. Please compare the current template structure and CSS with the original image. Ensure that using this dummy data would result in a pixel-perfect (or as close as possible) recreation of the original design. Fix any layout issues, improve CSS selectors, ensure all sections from the JSON Resume schema are handled, and make sure typography and spacing match the image exactly.";


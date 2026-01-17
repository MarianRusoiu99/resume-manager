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
 * Master JSON Resume Data - Every field from schema populated
 * Used to ensure the AI creates a robust template that handles all possible data.
 */
export const MASTER_RESUME_DATA = {
  basics: {
    name: "Alex Rivers",
    label: "Lead System Architect",
    image: "https://example.com/photo.jpg",
    email: "alex.rivers@example.com",
    phone: "+1 (555) 123-4567",
    url: "https://alexrivers.dev",
    summary: "Multi-disciplinary architect with 15+ years experience in building high-scale distributed systems and leading cross-functional engineering teams. Expert in cloud native architectures and digital transformation.",
    location: {
      address: "123 Tech Lane",
      postalCode: "94105",
      city: "San Francisco",
      countryCode: "US",
      region: "California"
    },
    profiles: [
      { network: "LinkedIn", username: "arivers", url: "https://linkedin.com/in/arivers" },
      { network: "GitHub", username: "arivers-code", url: "https://github.com/arivers-code" }
    ]
  },
  work: [
    {
      name: "Global Tech Corp",
      position: "Senior Architect",
      url: "https://gtc.com",
      startDate: "2018-01-01",
      endDate: "Present",
      summary: "Leading global infrastructure optimization for Fortune 500 clients.",
      highlights: [
        "Reduced system latency by 30% across core banking services",
        "Managed $2M annual cloud infrastructure budget with 15% cost savings",
        "Orchestrated migration of 200+ microservices to Kubernetes"
      ]
    },
    {
      name: "DataStream Systems",
      position: "Systems Engineer",
      url: "https://datastream.io",
      startDate: "2014-06-01",
      endDate: "2017-12-31",
      summary: "Developed real-time data processing pipelines using Apache Kafka and Spark.",
      highlights: [
        "Processed 5TB of data daily with 99.99% uptime",
        "Implemented automated disaster recovery protocols"
      ]
    }
  ],
  volunteer: [
    {
      organization: "Code for Good",
      position: "Technical Mentor",
      url: "https://codeforgood.org",
      startDate: "2015-06-01",
      endDate: "2017-12-01",
      summary: "Taught web development and cloud concepts to underprivileged youth.",
      highlights: ["Mentored 20+ students now working in tech"]
    }
  ],
  education: [
    {
      institution: "Massachusetts Institute of Technology (MIT)",
      url: "https://mit.edu",
      area: "Computer Science",
      studyType: "Master of Science",
      startDate: "2012-09-01",
      endDate: "2014-06-01",
      score: "4.0/4.0",
      courses: ["Advanced Algorithms", "Distributed Systems", "Cloud Computing"]
    }
  ],
  awards: [
    {
      title: "Innovator of the Year",
      date: "2022",
      awarder: "Tech Weekly",
      summary: "Recognized for outstanding contributions to cloud optimization frameworks."
    }
  ],
  certificates: [
    {
      name: "AWS Certified Solutions Architect – Professional",
      date: "2021-05-15",
      issuer: "Amazon Web Services",
      url: "https://aws.amazon.com/verification"
    }
  ],
  publications: [
    {
      name: "The Future of Edge Computing",
      publisher: "IEEE Software",
      releaseDate: "2023-03-15",
      url: "https://ieee.org/publications/edge-future"
    }
  ],
  skills: [
    {
      name: "Cloud Architecture",
      level: "Expert",
      keywords: ["AWS", "GCP", "Azure", "Terraform"]
    },
    {
      name: "Distributed Systems",
      level: "Expert",
      keywords: ["Kafka", "Kubernetes", "gRPC", "Redis"]
    }
  ],
  languages: [
    { language: "English", fluency: "Native" },
    { language: "German", fluency: "Professional" }
  ],
  interests: [
    {
      name: "Open Source",
      keywords: ["Linux Kernel", "Rust Ecosystem", "eBPF"]
    }
  ],
  references: [
    {
      name: "Dr. Sarah Chen",
      reference: "Alex is a brilliant strategist with a rare combination of deep technical expertise and leadership vision."
    }
  ],
  projects: [
    {
      name: "Nebula Cloud",
      description: "A serverless framework designed for sub-millisecond cold starts.",
      highlights: ["10k+ stars on GitHub", "Adopted by 3 major financial institutions"],
      startDate: "2020-01-01",
      endDate: "Present",
      url: "https://github.com/nebula/nebula-cloud",
      roles: ["Founder", "Lead Maintainer"]
    }
  ]
};

/**
 * System prompt for template extraction
 * Instructs the AI to analyze a resume template image and recreate it as Handlebars HTML + CSS
 */
export const TEMPLATE_EXTRACTION_PROMPT = `You are an expert resume template designer and HTML/CSS developer. Your task is to analyze a resume template image and recreate it as a Handlebars HTML template with matching CSS.

## YOUR GOAL
Accurately recreate the visual design from the image while ensuring the template is ROBUST and handles the ENTIRE JSON Resume schema.

## STRESS TEST MANDATE
The template MUST be designed to handle all 12 sections of the JSON Resume schema gracefully. Use the provided MASTER JSON structure as your reference for data coverage.

## DESIGN & LOGIC REQUIREMENTS
1. **MATCH THE IMAGE** - Recreate the exact layout, colors, typography, and spacing.
2. **CONDITIONAL RENDERING** - EVERY section and optional field MUST be wrapped in Handlebars {{#if}} blocks. Do not render empty containers or headers if data is missing.
3. **FLEXIBLE LAYOUT** - Use CSS Flexbox or Grid. Ensure the design looks good with both minimal data and high-density data. 
4. **PRINT QUALITY** - Use @media print rules. Ensure page breaks don't cut through work/education items (use break-inside: avoid).
5. **JSON RESUME DATA STRUCTURE** - Use these Handlebars placeholders (refer to MASTER JSON for full list):
   - basics (name, label, email, phone, url, summary, location, profiles)
   - work, volunteer, education, awards, certificates, publications, skills, languages, interests, references, projects

## HANDLEBARS SYNTAX & SAFETY
- Simple value: {{basics.name}}
- Conditional: {{#if basics.summary}}...{{/if}}
- Loop: {{#each work}}...{{/each}}
- Lists: {{#each highlights}}<li>{{this}}</li>{{/each}}
- **LOGICAL OPERATORS**: Use the "or" and "and" helpers for complex conditions. 
  - CORRECT: {{#if (or this.startDate this.endDate)}}
  - INCORRECT: {{#if this.startDate || this.endDate}} (This will crash the renderer)
- **QUOTES**: Avoid escaping quotes in the HTML/CSS (e.g., use <div class="container"> NOT <div class="\\&quot;container\\&quot;">).

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
  "Analyze this resume template image carefully. Recreate its exact visual design as a Handlebars HTML template with CSS. Ensure it handles ALL JSON Resume sections defined in the MASTER DATA structure provided in the system context. Pay close attention to typography, spacing, and conditional logic.";

/**
 * Prompt for refining an extracted template
 */
export const TEMPLATE_REFINEMENT_USER_MESSAGE =
  "I have extracted a Handlebars template from the attached image. Now, I want you to refine it. Use the provided MASTER RESUME DATA (populated with every possible field) to stress-test the layout. Compare the result with the original image. " +
  "Refinement checklist:\n" +
  "1. Ensure ALL sections from the MASTER DATA are styled and visible if present.\n" +
  "2. Fix any layout breakage caused by long text or many list items.\n" +
  "3. Perfect the spacing and typography to match the image exactly.\n" +
  "4. Ensure robust conditional logic ({{#if}}) for every field.\n" +
  "5. Improve CSS structure (use variables for colors/fonts).";

// Legacy exports for compatibility if needed, though replaced by MASTER_RESUME_DATA
export const DUMMY_RESUME_DATA = MASTER_RESUME_DATA;

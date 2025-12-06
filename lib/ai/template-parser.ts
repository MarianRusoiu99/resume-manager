/**
 * AI-powered Template Parser
 * Extracts resume template structure from images using vision API
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * Default model configuration
 */
const DEFAULT_CONFIG = {
    defaultVisionModel: 'gpt-5.1',
};

/**
 * Extracted template data
 */
export interface ExtractedTemplate {
    htmlTemplate: string;
    cssStyles: string;
    name?: string;
    category?: 'PROFESSIONAL' | 'MODERN' | 'CREATIVE' | 'ATS_OPTIMIZED' | 'MINIMAL';
    description?: string;
}

/**
 * Create OpenAI client with the provided API key
 */
const getOpenAIClient = (apiKey: string) => {
    if (!apiKey) {
        throw new Error(
            'No API key provided. Please configure an API provider in Settings → API Keys'
        );
    }

    return createOpenAI({
        apiKey,
    });
};

const TEMPLATE_EXTRACTION_PROMPT = `You are an expert resume template designer and HTML/CSS developer. Your task is to analyze a resume template image and recreate it as a Handlebars HTML template with matching CSS.

## YOUR GOAL
Accurately recreate the visual design from the image. You have FULL CREATIVE FREEDOM to structure the HTML and CSS however best matches what you see. The example below is just a reference - feel free to deviate from it to match the image more accurately.

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
  "work": [{
    "name": "Company Name",
    "position": "Job Title",
    "startDate": "2020-01",
    "endDate": "2023-12",
    "summary": "Job description...",
    "highlights": ["Achievement 1", "Achievement 2"]
  }],
  "education": [{
    "institution": "University Name",
    "studyType": "Bachelor of Science",
    "area": "Computer Science",
    "startDate": "2016",
    "endDate": "2020",
    "score": "3.8"
  }],
  "skills": [{
    "name": "Programming",
    "level": "Expert",
    "keywords": ["JavaScript", "Python", "TypeScript"]
  }],
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
- Nested conditional: {{#if endDate}}{{endDate}}{{else}}Present{{/if}}

## REFERENCE EXAMPLE (adapt freely to match the image!)

**HTML Template:**
\`\`\`html
<main>
<header>
  <h1>{{basics.name}}</h1>
  {{#if basics.label}}<h2>{{basics.label}}</h2>{{/if}}
  <div class="contact">
    {{#if basics.phone}}<span class="contact-item">{{basics.phone}}</span>{{/if}}
    {{#if basics.email}}<span class="contact-item"><a href="mailto:{{basics.email}}">{{basics.email}}</a></span>{{/if}}
    {{#if basics.url}}<span class="contact-item"><a href="{{basics.url}}">{{basics.url}}</a></span>{{/if}}
    {{#if basics.profiles}}
      {{#each basics.profiles}}<span class="contact-item"><a href="{{url}}">{{network}}{{#if username}} ({{username}}){{/if}}</a></span>{{/each}}
    {{/if}}
  </div>
</header>

{{#if basics.summary}}
<section>
  <h3>Summary</h3>
  <article>
    <p>{{basics.summary}}</p>
  </article>
</section>
{{/if}}

{{#if work}}
<section>
  <h3>Experience</h3>
  {{#each work}}
  <article>
    <div class="article-header">
      <div class="title-company">
        <strong>{{position}}</strong>
        <span class="company">{{name}}</span>
      </div>
      {{#if startDate}}
        <time>{{startDate}}{{#if endDate}} – {{endDate}}{{else}} – Present{{/if}}</time>
      {{/if}}
    </div>
    {{#if summary}}<p>{{summary}}</p>{{/if}}
    {{#if highlights}}
      <ul>
        {{#each highlights}}<li>{{this}}</li>{{/each}}
      </ul>
    {{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if education}}
<section>
  <h3>Education</h3>
  {{#each education}}
  <article>
    <div class="article-header">
      <div class="title-company">
        <strong>{{studyType}}{{#if area}} in {{area}}{{/if}}</strong>
        <span class="company">{{institution}}</span>
      </div>
      {{#if startDate}}<time>{{startDate}}{{#if endDate}} – {{endDate}}{{/if}}</time>{{/if}}
    </div>
    {{#if score}}<div class="meta">GPA: {{score}}</div>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if skills}}
<section>
  <h3>Skills</h3>
  <article class="skills-grid">
    {{#each skills}}
      <div class="skill-group">
        <strong>{{name}}</strong>{{#if level}} <span class="level">{{level}}</span>{{/if}}
        {{#if keywords}}
          <div class="keywords">
            {{#each keywords}}<span class="keyword">{{this}}</span>{{/each}}
          </div>
        {{/if}}
      </div>
    {{/each}}
  </article>
</section>
{{/if}}

{{#if languages}}
<section>
  <h3>Languages</h3>
  <article>
    <div class="inline-list">
      {{#each languages}}<span class="inline-item">{{language}}{{#if fluency}} <span class="level">({{fluency}})</span>{{/if}}</span>{{/each}}
    </div>
  </article>
</section>
{{/if}}

{{#if certificates}}
<section>
  <h3>Certificates</h3>
  {{#each certificates}}
  <article>
    <div class="article-header">
      <strong>{{#if url}}<a href="{{url}}">{{name}}</a>{{else}}{{name}}{{/if}}</strong>
      <time>{{date}}</time>
    </div>
    {{#if issuer}}<div class="meta">{{issuer}}</div>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if projects}}
<section>
  <h3>Projects</h3>
  {{#each projects}}
  <article>
    <div class="article-header">
      <strong>{{#if url}}<a href="{{url}}">{{name}}</a>{{else}}{{name}}{{/if}}</strong>
      {{#if startDate}}<time>{{startDate}}{{#if endDate}} – {{endDate}}{{/if}}</time>{{/if}}
    </div>
    {{#if description}}<p>{{description}}</p>{{/if}}
    {{#if highlights}}<ul>{{#each highlights}}<li>{{this}}</li>{{/each}}</ul>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if awards}}
<section>
  <h3>Awards</h3>
  {{#each awards}}
  <article>
    <div class="article-header">
      <strong>{{title}}</strong>
      <time>{{date}}</time>
    </div>
    {{#if awarder}}<div class="meta">{{awarder}}</div>{{/if}}
    {{#if summary}}<p>{{summary}}</p>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if volunteer}}
<section>
  <h3>Volunteer</h3>
  {{#each volunteer}}
  <article>
    <div class="article-header">
      <div class="title-company">
        <strong>{{position}}</strong>
        <span class="company">{{organization}}</span>
      </div>
      {{#if startDate}}<time>{{startDate}}{{#if endDate}} – {{endDate}}{{else}} – Present{{/if}}</time>{{/if}}
    </div>
    {{#if summary}}<p>{{summary}}</p>{{/if}}
    {{#if highlights}}<ul>{{#each highlights}}<li>{{this}}</li>{{/each}}</ul>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if references}}
<section>
  <h3>References</h3>
  {{#each references}}
  <article>
    <strong>{{name}}</strong>
    {{#if reference}}<p class="quote">{{reference}}</p>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

</main>
\`\`\`

**CSS Styles:**
\`\`\`css
html, body { color: #1a1a1a; }

main {
  padding: 18mm 20mm;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 11px;
  line-height: 1.5;
  color: #1a1a1a;
}

header { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #2563eb; }
header h1 { font-size: 32px; margin: 0 0 4px 0; font-weight: 700; letter-spacing: -0.5px; }
header h2 { font-size: 16px; color: #2563eb; margin: 0 0 8px 0; font-weight: 500; }
header .contact { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 11px; color: #4b5563; }
header a { color: #2563eb; text-decoration: none; }

section > h3 {
  font-size: 13px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; margin-top: 14px; margin-bottom: 8px;
  padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; color: #2563eb;
}

article { margin-bottom: 10px; }
.article-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
.title-company { display: flex; flex-direction: column; }
article strong { font-size: 12px; font-weight: 600; color: #1a1a1a; }
.company { font-size: 11px; color: #4b5563; font-weight: 400; }
article time { font-size: 10px; color: #6b7280; white-space: nowrap; }
article > p { margin: 4px 0; font-size: 11px; color: #374151; }

ul { margin: 4px 0 0 16px; padding: 0; }
li { margin-bottom: 2px; font-size: 11px; color: #374151; }
li::marker { color: #2563eb; }

.skills-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.skill-group { flex: 1 1 45%; min-width: 140px; }
.keyword { display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 6px; font-size: 9px; color: #1e40af; margin-right: 4px; margin-top: 2px; }
.level { font-size: 10px; color: #6b7280; font-weight: 400; }
.meta { font-size: 10px; color: #6b7280; }
.inline-list { display: flex; flex-wrap: wrap; gap: 8px; }
.inline-item { font-size: 11px; color: #374151; }
.quote { font-style: italic; color: #4b5563; border-left: 2px solid #2563eb; padding-left: 8px; margin: 4px 0; }
article a { color: #2563eb; text-decoration: none; }

@media print { main { padding: 16mm 18mm; } }
\`\`\`

## IMPORTANT INSTRUCTIONS

1. **MATCH THE IMAGE** - The example above is just a starting point. Completely restructure the HTML/CSS if needed to match what you see in the image:
   - Different layouts (sidebar, columns, grids)
   - Different color schemes
   - Different typography and fonts
   - Different section arrangements
   - Icons, borders, backgrounds as shown

2. **BE ACCURATE WITH COLORS** - Extract exact colors from the image (use hex codes)

3. **RECREATE THE LAYOUT** - If the image shows a two-column layout, sidebar, or unique structure, implement that exactly

4. **INCLUDE ALL SECTIONS** - Make sure to include templates for all JSON Resume sections (work, education, skills, etc.) even if the image only shows some. Style unused sections consistently.

5. **ONLY SECTIONS VISIBLE** - If certain sections don't appear in the image, still include them but style them to match the overall design

## OUTPUT FORMAT
Return a JSON object:
{
  "htmlTemplate": "<main>...</main>",
  "cssStyles": "/* your CSS */",
  "name": "Descriptive name based on the design",
  "category": "PROFESSIONAL|MODERN|CREATIVE|ATS_OPTIMIZED|MINIMAL",
  "description": "Brief description of the visual style and best use cases"
}

Return ONLY valid JSON, no markdown code blocks or explanations.`;

/**
 * Clean JSON response from LLM (remove markdown code blocks if present)
 */
function cleanJsonResponse(text: string): string {
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    return jsonText.trim();
}

/**
 * Extract template from image using vision API
 * 
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - Image MIME type (image/png, image/jpeg, etc.)
 * @param apiKey - OpenAI API key
 * @returns Extracted template with HTML and CSS
 */
export async function parseTemplateFromImage(
    imageBase64: string,
    mimeType: string,
    apiKey: string
): Promise<ExtractedTemplate> {
    try {
        const openaiClient = getOpenAIClient(apiKey);
        const { text: responseText } = await generateText({
            model: openaiClient(DEFAULT_CONFIG.defaultVisionModel),
            messages: [
                {
                    role: "system",
                    content: TEMPLATE_EXTRACTION_PROMPT,
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this resume template image carefully. Recreate its exact visual design as a Handlebars HTML template with CSS. Pay close attention to the layout structure, colors, typography, spacing, and any unique design elements. You have full freedom to structure the code however best matches the image:",
                        },
                        {
                            type: "image",
                            image: `data:${mimeType};base64,${imageBase64}`,
                        },
                    ],
                },
            ],
            temperature: 0.3, // Slightly higher for more creative flexibility
        });

        // Clean and parse the response
        const jsonText = cleanJsonResponse(responseText);
        const extractedData = JSON.parse(jsonText);

        // Validate required fields
        if (!extractedData.htmlTemplate || typeof extractedData.htmlTemplate !== 'string') {
            throw new Error('Invalid response: missing or invalid htmlTemplate');
        }
        if (!extractedData.cssStyles || typeof extractedData.cssStyles !== 'string') {
            throw new Error('Invalid response: missing or invalid cssStyles');
        }

        // Validate category if present
        const validCategories = ['PROFESSIONAL', 'MODERN', 'CREATIVE', 'ATS_OPTIMIZED', 'MINIMAL'];
        if (extractedData.category && !validCategories.includes(extractedData.category)) {
            extractedData.category = 'PROFESSIONAL'; // Default fallback
        }

        return {
            htmlTemplate: extractedData.htmlTemplate,
            cssStyles: extractedData.cssStyles,
            name: extractedData.name || undefined,
            category: extractedData.category || 'PROFESSIONAL',
            description: extractedData.description || undefined,
        };
    } catch (error) {
        console.error("Template parsing error:", error);
        throw error;
    }
}

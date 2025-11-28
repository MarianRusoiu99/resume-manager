/**
 * AI-powered Resume Parser
 * Extracts resume data from various file formats and maps to JSON Resume schema
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { Resume } from "@/lib/validations/jsonresume";
import { resumeSchema } from "@/lib/validations/jsonresume";

/**
 * Default API Configuration
 * 
 * IMPORTANT: This is a fallback configuration for development/testing purposes.
 * In production, always use the OPENAI_API_KEY environment variable.
 * 
 * To override, set OPENAI_API_KEY in your environment or .env file.
 */
const DEFAULT_CONFIG = {
    // Replace with your development API key or leave empty to require environment variable
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-4o-mini',
    defaultVisionModel: 'gpt-4o',
};

// Create OpenAI client with configuration
const getOpenAIClient = () => {
    if (!DEFAULT_CONFIG.apiKey) {
        throw new Error(
            'No OpenAI API key configured. Please set OPENAI_API_KEY environment variable or configure DEFAULT_CONFIG.apiKey in resume-parser.ts'
        );
    }

    return createOpenAI({
        apiKey: DEFAULT_CONFIG.apiKey,
    });
};

const EXTRACTION_PROMPT = `You are a resume parser. Extract ALL information from the provided resume and convert it to JSON Resume format.

JSON Resume Schema structure:
{
  "basics": {
    "name": string,
    "label": string (job title),
    "email": string,
    "phone": string,
    "url": string (personal website),
    "summary": string,
    "location": { "city": string, "region": string, "countryCode": string },
    "profiles": [{ "network": string, "username": string, "url": string }]
  },
  "work": [{
    "name": string (company),
    "position": string,
    "startDate": string (YYYY-MM-DD or YYYY-MM or YYYY format ONLY),
    "endDate": string (YYYY-MM-DD or YYYY-MM or YYYY format ONLY),
    "summary": string,
    "highlights": [string]
  }],
  "education": [{
    "institution": string,
    "area": string (field of study),
    "studyType": string (degree),
    "startDate": string (YYYY-MM-DD or YYYY-MM or YYYY format ONLY),
    "endDate": string (YYYY-MM-DD or YYYY-MM or YYYY format ONLY),
    "score": string (GPA),
    "courses": [string]
  }],
  "skills": [{
    "name": string,
    "level": string,
    "keywords": [string]
  }],
  "projects": [{
    "name": string,
    "description": string,
    "highlights": [string],
    "keywords": [string],
    "startDate": string (YYYY-MM-DD or YYYY-MM or YYYY format ONLY),
    "endDate": string (YYYY-MM-DD or YYYY-MM or YYYY format ONLY),
    "url": string
  }],
  "certificates": [{
    "name": string,
    "date": string (YYYY-MM-DD or YYYY-MM or YYYY format ONLY),
    "issuer": string,
    "url": string
  }],
  "languages": [{
    "language": string,
    "fluency": string
  }]
}

CRITICAL DATE FORMAT RULES:
- ALL dates MUST be in YYYY-MM-DD, YYYY-MM, or YYYY format
- Examples: "2023-01-15", "2023-01", "2023"
- NEVER use formats like "Jan 2023", "2023-2024", "January 2023"
- If you see "2020-2023", use "2020" for startDate and "2023" for endDate
- If only year is available, use YYYY format (e.g., "2023")

IMPORTANT:
- Extract ALL information, don't omit anything
- Use ONLY the date formats specified above
- For work experience, include detailed highlights/achievements
- Return ONLY valid JSON, no markdown or explanations
- If a field is not present, omit it (don't use null or empty strings)`;

// Helper function to normalize dates to JSON Resume format
function normalizeDates(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        return data.map(normalizeDates);
    }

    const normalized: any = {};
    for (const [key, value] of Object.entries(data)) {
        if ((key === 'startDate' || key === 'endDate' || key === 'date') && typeof value === 'string') {
            // Try to extract year from various formats
            const yearMatch = value.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
                // Check if it's already in correct format
                if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(value)) {
                    normalized[key] = value;
                } else {
                    // Just use the year
                    normalized[key] = yearMatch[0];
                }
            } else {
                normalized[key] = value; // Keep as is and let validation catch it
            }
        } else if (typeof value === 'object') {
            normalized[key] = normalizeDates(value);
        } else {
            normalized[key] = value;
        }
    }
    return normalized;
}

export async function parseResumeFromText(
    text: string
): Promise<Resume> {
    try {
        const openaiClient = getOpenAIClient();
        const { text: responseText } = await generateText({
            model: openaiClient(DEFAULT_CONFIG.defaultModel),
            system: EXTRACTION_PROMPT,
            prompt: `Extract resume data from this text:\n\n${text}`,
            temperature: 0.1,
        });

        // Try to extract JSON from the response
        let jsonText = responseText.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const extractedData = JSON.parse(jsonText);

        // Normalize dates before validation
        const normalizedData = normalizeDates(extractedData);

        const validation = resumeSchema.safeParse(normalizedData);

        if (!validation.success) {
            console.error("Validation errors:", validation.error.issues);

            // Provide more helpful error message
            const errorDetails = validation.error.issues
                .map(issue => `${issue.path.join('.')}: ${issue.message}`)
                .join(', ');

            throw new Error(`Resume data validation failed: ${errorDetails}`);
        }

        return validation.data;
    } catch (error) {
        console.error("Resume parsing error:", error);
        throw error;
    }
}

export async function parseResumeFromImage(
    imageBase64: string,
    mimeType: string
): Promise<Resume> {
    try {
        const openaiClient = getOpenAIClient();
        const { text: responseText } = await generateText({
            model: openaiClient(DEFAULT_CONFIG.defaultVisionModel),
            messages: [
                {
                    role: "system",
                    content: EXTRACTION_PROMPT,
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract all resume data from this image:",
                        },
                        {
                            type: "image",
                            image: `data:${mimeType};base64,${imageBase64}`,
                        },
                    ],
                },
            ],
            temperature: 0.1,
        });

        // Try to extract JSON from the response
        let jsonText = responseText.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const extractedData = JSON.parse(jsonText);

        // Normalize dates before validation
        const normalizedData = normalizeDates(extractedData);

        const validation = resumeSchema.safeParse(normalizedData);

        if (!validation.success) {
            console.error("Validation errors:", validation.error.issues);

            // Provide more helpful error message
            const errorDetails = validation.error.issues
                .map(issue => `${issue.path.join('.')}: ${issue.message}`)
                .join(', ');

            throw new Error(`Resume data validation failed: ${errorDetails}`);
        }

        return validation.data;
    } catch (error) {
        console.error("Image parsing error:", error);
        throw error;
    }
}

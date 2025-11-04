import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import OpenAI from "openai";
import { resumeSchema } from "@/lib/validations/jsonresume";
import { z } from "zod";
import { env } from "process";

/**
 * POST /api/resume-parser/parse
 * Parse extracted resume text using OpenAI GPT-4
 * 
 * @body text - Extracted text from resume file
 * @body model - OpenAI model to use (default: gpt-4o-mini)
 * @returns Parsed resume data in JSON Resume format
 * 
 * 
 */

const requestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  model: z.string().default("gpt-4o-mini"),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = requestSchema.parse(body);
    const { text, model } = validatedData;

    // Fetch user's OpenAI API key from database
    const apiKey = env.OPENAI_API_KEY;
    

    // Validate text length
    if (text.length > 50000) {
      return NextResponse.json(
        { error: "Text too long. Maximum 50,000 characters." },
        { status: 400 }
      );
    }

    // Initialize OpenAI client with user's API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Create the parsing prompt
    const systemPrompt = `You are a professional resume parser. Extract structured resume data from the provided text and return it in JSON Resume v1.0.0 format.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no explanations, no extra text
2. Use ISO 8601 date format (YYYY-MM-DD) for all dates
3. Extract all available information - be thorough and comprehensive
4. For date ranges, use startDate and endDate fields
5. If a field has no data, omit it entirely (do not include empty strings or null values)
6. Focus on accuracy over completeness - only include information you can extract with confidence
7. Structure the output exactly according to the JSON Resume schema provided below

JSON Resume Schema (fill this template with extracted data):
{
  "basics": {
    "name": "string (required if found)",
    "label": "string (job title/professional label)",
    "email": "string (valid email)",
    "phone": "string",
    "url": "string (personal website URL)",
    "summary": "string (professional summary)",
    "location": {
      "address": "string",
      "city": "string",
      "countryCode": "string (ISO country code)",
      "region": "string (state/province)"
    },
    "profiles": [
      {
        "network": "string (e.g., LinkedIn, GitHub)",
        "username": "string",
        "url": "string (profile URL)"
      }
    ]
  },
  "work": [
    {
      "name": "string (company name)",
      "position": "string (job title)",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD (omit if current position)",
      "summary": "string (brief description)",
      "highlights": ["string (achievements and responsibilities)"]
    }
  ],
  "education": [
    {
      "institution": "string (school name)",
      "area": "string (field of study)",
      "studyType": "string (degree type)",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "score": "string (GPA or grade)"
    }
  ],
  "skills": [
    {
      "name": "string (skill category or name)",
      "level": "string (Expert/Advanced/Intermediate/Beginner)",
      "keywords": ["string (specific skills)"]
    }
  ],
  "certificates": [
    {
      "name": "string (certification name)",
      "issuer": "string (issuing organization)",
      "date": "YYYY-MM-DD"
    }
  ],
  "languages": [
    {
      "language": "string (language name)",
      "fluency": "string (Native/Fluent/Conversational/Basic)"
    }
  ],
  "projects": [
    {
      "name": "string (project name)",
      "description": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "highlights": ["string (key achievements)"]
    }
  ],
  "volunteer": [
    {
      "organization": "string",
      "position": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "summary": "string",
      "highlights": ["string"]
    }
  ],
  "awards": [
    {
      "title": "string (award name)",
      "date": "string (YYYY-MM-DD or YYYY)",
      "awarder": "string (awarding organization)",
      "summary": "string"
    }
  ],
  "publications": [
    {
      "name": "string (publication title)",
      "publisher": "string",
      "releaseDate": "YYYY-MM-DD"
    }
  ],
  "interests": [
    {
      "name": "string (interest area)",
      "keywords": ["string"]
    }
  ],
  "references": [
    {
      "name": "string (reference name)",
      "reference": "string (reference statement or contact)"
    }
  ]
}

IMPORTANT NOTES:
- Only include sections that have data - omit empty arrays
- Dates must be in YYYY-MM-DD format (use YYYY-MM or YYYY if day/month unknown)
- URLs must be valid and complete (include https://)
- Return ONLY the JSON object - no markdown code blocks or explanations`;

    const userPrompt = `Parse this resume text and return structured data in JSON Resume format:\n\n${text}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent parsing
      response_format: { type: "json_object" }, // Ensure JSON response
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON response from AI" },
        { status: 500 }
      );
    }

    // Validate against resume schema AFTER AI has filled the template
    // This is the only place we check schema compliance
    const validationResult = resumeSchema.safeParse(parsedData);
    
    if (!validationResult.success) {
      console.warn("Schema validation has warnings:", validationResult.error);
      
      // Return the data anyway, with a warning about validation issues
      // The client can decide whether to use it or not
      return NextResponse.json({
        resume: parsedData,
        tokensUsed: completion.usage?.total_tokens || 0,
        warning: "Some fields may not match the expected format. The data has been returned as-is.",
        validationErrors: validationResult.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Return successfully parsed and validated resume
    return NextResponse.json({
      resume: validationResult.data,
      tokensUsed: completion.usage?.total_tokens || 0,
    });

  } catch (error: unknown) {
    console.error("Resume parsing error:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    // Handle OpenAI API errors
    if (error && typeof error === "object" && "status" in error) {
      const apiError = error as { status?: number; message?: string };
      if (apiError.status === 401) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key" },
          { status: 401 }
        );
      }
      if (apiError.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}

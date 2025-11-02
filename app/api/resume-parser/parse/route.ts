import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import OpenAI from "openai";
import { resumeSchema } from "@/lib/validations/jsonresume";
import { z } from "zod";
import { apiKeyService } from "@/lib/services/apikey.service";

/**
 * POST /api/resume-parser/parse
 * Parse extracted resume text using OpenAI GPT-4
 * 
 * @body text - Extracted text from resume file
 * @body model - OpenAI model to use (default: gpt-4o-mini)
 * @returns Parsed resume data in JSON Resume format
 * 
 * Note: API key is fetched server-side from user's settings for security
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
    const apiKey = await apiKeyService.getDecryptedKey(session.user.id, "openai");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "No OpenAI API key configured. Please add one in Settings." },
        { status: 400 }
      );
    }

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
3. Infer reasonable values for missing fields when possible
4. For date ranges, use startDate and endDate (or null if still ongoing)
5. Extract all sections: basics, summary, work, education, skills, certificates, languages, projects, volunteer, awards, publications, interests, references
6. Be thorough and extract as much information as possible

JSON Resume Schema Structure:
{
  "basics": {
    "name": "Full Name",
    "label": "Professional Title",
    "email": "email@example.com",
    "phone": "+1234567890",
    "url": "https://website.com",
    "summary": "Brief professional summary",
    "location": {
      "address": "Street Address",
      "city": "City",
      "countryCode": "US",
      "region": "State"
    },
    "profiles": [
      {
        "network": "LinkedIn",
        "username": "username",
        "url": "https://linkedin.com/in/username"
      }
    ]
  },
  "work": [
    {
      "name": "Company Name",
      "position": "Job Title",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "summary": "Brief description",
      "highlights": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "area": "Field of Study",
      "studyType": "Degree",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "score": "GPA or grade"
    }
  ],
  "skills": [
    {
      "name": "Skill Name",
      "level": "Expert/Advanced/Intermediate/Beginner",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "certificates": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "YYYY-MM-DD",
      "url": "https://..."
    }
  ],
  "languages": [
    {
      "language": "Language Name",
      "fluency": "Native/Fluent/Conversational/Basic"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "url": "https://...",
      "highlights": ["Achievement 1"]
    }
  ],
  "volunteer": [
    {
      "organization": "Organization Name",
      "position": "Role",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "summary": "Description",
      "highlights": ["Achievement 1"]
    }
  ],
  "awards": [
    {
      "title": "Award Title",
      "date": "YYYY-MM-DD",
      "awarder": "Awarding Organization",
      "summary": "Description"
    }
  ],
  "publications": [
    {
      "name": "Publication Title",
      "publisher": "Publisher Name",
      "releaseDate": "YYYY-MM-DD",
      "url": "https://...",
      "summary": "Description"
    }
  ],
  "interests": [
    {
      "name": "Interest Name",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "references": [
    {
      "name": "Reference Name",
      "reference": "Reference statement"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object. No markdown code blocks, no explanations.`;

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

    // Validate against resume schema
    const validationResult = resumeSchema.safeParse(parsedData);
    if (!validationResult.success) {
      console.error("Schema validation failed:", validationResult.error);
      
      // Try to return partial data if possible
      return NextResponse.json({
        resume: parsedData,
        tokensUsed: completion.usage?.total_tokens || 0,
        warning: "Some fields may not match the expected format",
        validationErrors: validationResult.error.issues,
      });
    }

    // Return successfully parsed resume
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

import swaggerJsdoc from 'swagger-jsdoc';
import { UserSchemas } from './schemas/user.swagger';
import { ResumeSchemas } from './schemas/resume.swagger';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Resume Manager API',
      version: '1.0.0',
      description: `
# AI Resume Manager API Documentation

Complete API reference for the AI-Powered Resume Manager platform. 
This platform uses AI (GPT-4) to analyze job descriptions and optimize resumes for Applicant Tracking Systems (ATS).

## Features

- **User Authentication**: Secure registration and login with NextAuth.js
- **Profile Management**: Comprehensive user profile with experience, education, skills, certifications, languages
- **AI Resume Generation**: 5-agent LangGraph workflow for intelligent resume optimization
- **Template System**: Multiple professional templates with customization
- **PDF Export**: ATS-friendly PDF generation
- **Cover Letter Generation**: AI-powered personalized cover letters
- **API Key Management**: Secure encrypted storage of OpenAI API keys

## Authentication

Most endpoints require authentication via NextAuth.js session cookies. Protected routes will return 401 if not authenticated.

## Rate Limiting

All endpoints are rate-limited to 5 requests per minute per endpoint to prevent abuse and manage OpenAI API costs.

## Error Responses

All endpoints return consistent error responses:

\`\`\`json
{
  "error": "Error message",
  "details": ["Validation error 1", "Validation error 2"]
}
\`\`\`

Common HTTP status codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (not logged in)
- **404**: Not Found
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error
      `,
      contact: {
        name: 'API Support',
        url: 'https://github.com/yourusername/resume-optimizer',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://your-production-domain.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User registration and authentication endpoints',
      },
      {
        name: 'Profile',
        description: 'User profile management (experience, education, skills)',
      },
      {
        name: 'Resumes',
        description: 'Resume generation, management, and export',
      },
      {
        name: 'Cover Letters',
        description: 'AI-powered cover letter generation',
      },
      {
        name: 'Templates',
        description: 'Resume template management and customization',
      },
      {
        name: 'Settings',
        description: 'User settings and API key management',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints for template management',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'NextAuth.js session cookie (automatically set after login)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Detailed error messages',
              example: ['Email is required', 'Password must be at least 8 characters'],
            },
          },
        },
        ...UserSchemas,
        ...ResumeSchemas,
        APIKey: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            provider: {
              type: 'string',
              enum: ['OPENAI'],
              example: 'OPENAI',
            },
            keyPreview: {
              type: 'string',
              example: 'sk-...xyz',
              description: 'Masked API key (first 3 and last 4 characters)',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            lastUsedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./app/api/v1/**/*.ts', './lib/swagger-docs.ts'], // Path to the API routes
};

// Generate spec lazily at runtime to avoid build-time issues
let cachedSpec: ReturnType<typeof swaggerJsdoc> | null = null;

export function getSwaggerSpec() {
  if (!cachedSpec) {
    cachedSpec = swaggerJsdoc(options);
  }
  return cachedSpec;
}

// Deprecated: Use getSwaggerSpec() instead
export const swaggerSpec = typeof window === 'undefined' ? {} : {};

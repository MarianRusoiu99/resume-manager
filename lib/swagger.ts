import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Resume Optimizer API',
      version: '1.0.0',
      description: `
# AI Resume Optimizer API Documentation

Complete API reference for the AI-Powered Resume Optimizer platform. 
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
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            fullName: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              example: '+1 (555) 123-4567',
              nullable: true,
            },
            location: {
              type: 'string',
              example: 'San Francisco, CA',
              nullable: true,
            },
            linkedinUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://linkedin.com/in/johndoe',
              nullable: true,
            },
            githubUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://github.com/johndoe',
              nullable: true,
            },
            portfolioUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://johndoe.com',
              nullable: true,
            },
            summary: {
              type: 'string',
              example: 'Experienced software engineer with 5+ years...',
              nullable: true,
            },
            experience: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: 'exp-1',
                  },
                  company: {
                    type: 'string',
                    example: 'Tech Corp',
                  },
                  title: {
                    type: 'string',
                    example: 'Senior Software Engineer',
                  },
                  startDate: {
                    type: 'string',
                    example: '2020-01',
                  },
                  endDate: {
                    type: 'string',
                    example: '2023-12',
                    nullable: true,
                  },
                  current: {
                    type: 'boolean',
                    example: false,
                  },
                  description: {
                    type: 'string',
                    example: '• Led development of microservices architecture\\n• Improved performance by 40%',
                  },
                },
              },
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: 'edu-1',
                  },
                  school: {
                    type: 'string',
                    example: 'University of California',
                  },
                  degree: {
                    type: 'string',
                    example: 'Bachelor of Science in Computer Science',
                  },
                  field: {
                    type: 'string',
                    example: 'Computer Science',
                  },
                  startDate: {
                    type: 'string',
                    example: '2015-09',
                  },
                  endDate: {
                    type: 'string',
                    example: '2019-05',
                  },
                  gpa: {
                    type: 'string',
                    example: '3.8',
                    nullable: true,
                  },
                },
              },
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'],
            },
            certifications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: 'cert-1',
                  },
                  name: {
                    type: 'string',
                    example: 'AWS Certified Solutions Architect',
                  },
                  issuer: {
                    type: 'string',
                    example: 'Amazon Web Services',
                  },
                  date: {
                    type: 'string',
                    example: '2023-06',
                  },
                  credentialUrl: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://aws.amazon.com/certification/verify/...',
                    nullable: true,
                  },
                },
              },
            },
            languages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: 'lang-1',
                  },
                  language: {
                    type: 'string',
                    example: 'English',
                  },
                  proficiency: {
                    type: 'string',
                    enum: ['NATIVE', 'FLUENT', 'PROFESSIONAL', 'INTERMEDIATE', 'BASIC'],
                    example: 'NATIVE',
                  },
                },
              },
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        GeneratedResume: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            jobDescription: {
              type: 'string',
              example: 'We are looking for a Senior Software Engineer...',
            },
            companyName: {
              type: 'string',
              example: 'Tech Corp',
              nullable: true,
            },
            jobTitle: {
              type: 'string',
              example: 'Senior Software Engineer',
              nullable: true,
            },
            optimizedContent: {
              type: 'object',
              description: 'Structured resume content generated by AI',
            },
            coverLetter: {
              type: 'string',
              nullable: true,
            },
            templateId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            templateCustomization: {
              type: 'object',
              nullable: true,
            },
            sectionOrder: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['summary', 'experience', 'education', 'skills', 'certifications', 'languages'],
            },
            pdfUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'GENERATED', 'EXPORTED'],
              example: 'GENERATED',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ResumeTemplate: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Professional',
            },
            description: {
              type: 'string',
              example: 'Clean, professional template optimized for ATS',
            },
            structure: {
              type: 'object',
              description: 'Template layout and section configuration',
            },
            styling: {
              type: 'object',
              description: 'Template colors, fonts, and styling options',
            },
            previewImage: {
              type: 'string',
              format: 'uri',
              nullable: true,
            },
            category: {
              type: 'string',
              enum: ['PROFESSIONAL', 'MODERN', 'CREATIVE', 'MINIMAL', 'TECHNICAL', 'EXECUTIVE'],
              example: 'PROFESSIONAL',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
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
  apis: ['./app/api/**/*.ts', './lib/swagger-docs.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);

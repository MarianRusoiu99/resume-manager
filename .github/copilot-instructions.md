# AI Resume Optimizer - Copilot Instructions

## Architecture Overview

**Framework**: Next.js 16 with App Router, TypeScript 5, Tailwind CSS 4
**Database**: PostgreSQL with Prisma ORM (schema-first approach)
**Authentication**: NextAuth.js v5 with session management
**AI Orchestration**: LangGraph multi-agent workflow (6 specialized agents)
**Security Model**: BYOK (Bring Your Own Key) - users provide their own OpenAI API keys

### Core Architecture Patterns

- **Repository Pattern**: Data access abstracted through repository classes (`lib/repositories/`)
- **Service Layer**: Business logic separated from API routes (`lib/services/`)
- **Agent Pattern**: LangGraph agents for AI workflow orchestration (`lib/ai/workflow/`)
- **Validation Layer**: Zod schemas for all input/output validation (`lib/validations/`)

### Key Directories & Files

- `/app` - Next.js App Router pages and API routes
- `/lib/ai/workflow/` - LangGraph state graph and agent orchestration
- `/lib/services/` - Business logic (resume, profile, API key management)
- `/lib/repositories/` - Database access layer with Prisma
- `/prisma/schema.prisma` - Database schema (JSON fields for complex data)
- `/components/` - Reusable React components organized by domain

## Critical Developer Workflows

### Database Setup & Management
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name descriptive_migration_name

# Reset database (⚠️ destroys all data)
npx prisma migrate reset

# View data in browser
npx prisma studio
```

### AI Provider Setup
- Users must provide their own OpenAI API keys (BYOK model)
- Keys are encrypted with AES-256-GCM before database storage
- API routes decrypt keys only during AI calls
- Test key validity before storing: `POST /api/settings/api-keys/[id]/validate`

### Resume Generation Workflow
6-agent LangGraph pipeline (`lib/ai/workflow/graph.ts`):
1. **Job Analysis Agent** - Extract requirements, keywords, ATS criteria
2. **Profile Matching Agent** - Score candidate-job fit, identify gaps
3. **Content Optimization Agent** - Tailor experience descriptions, optimize for ATS
4. **Format Validation Agent** - Ensure ATS compliance and proper formatting
5. **Output Generator** - Assemble final structured resume JSON
6. **Cover Letter Agent** (optional) - Generate personalized cover letter

### Testing Strategy
```bash
# Unit tests (Vitest)
npm test                    # Run all tests
npm run test:ui            # Interactive test UI
npm run test:coverage      # Coverage report

# E2E tests (Playwright)
npm run e2e                # Run all E2E tests
npm run e2e:ui            # Interactive E2E test UI
npm run e2e:headed        # Headed browser mode

# Load testing
npm run load-test:generate # Resume generation performance
npm run load-test:api      # API endpoint performance
```

## Project-Specific Patterns & Conventions

### Data Storage Patterns
- **JSON Fields**: Complex objects stored as JSON in PostgreSQL (experience, education, skills)
- **Encryption**: API keys encrypted at rest using `@noble/ciphers`
- **Session Management**: NextAuth.js handles secure session tokens
- **File Storage**: Generated PDFs stored as base64 blobs in database

### API Route Patterns
```typescript
// Standard API route structure (app/api/example/route.ts)
export async function GET() {
  const session = await auth(); // Always check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await service.method(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Operation failed", error, { userId: session.user.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Validation Patterns
```typescript
// Zod schemas for all data validation (lib/validations/)
import { z } from "zod";

export const exampleSchema = z.object({
  requiredField: z.string().min(1, "Field is required"),
  optionalField: z.string().optional(),
  arrayField: z.array(z.string()).default([]),
});

// Usage in API routes
const validatedData = exampleSchema.parse(requestBody);
```

### AI Workflow Patterns
```typescript
// LangGraph state management (lib/ai/workflow/types.ts)
interface WorkflowState {
  jobDescription: string;
  userProfile: UserProfile;
  jobAnalysis?: JobAnalysisResult;
  optimizedContent?: OptimizedContent;
  generatedResume?: ResumeOutput;
  errors: string[];
  tokensUsed: number;
}

// Agent implementation pattern
export async function analyzeJobAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const provider = await getProviderForUser(userId);
  const analysis = await provider.complete(jobAnalysisPrompt);
  return { jobAnalysis: parseAnalysis(analysis) };
}
```

### Error Handling Patterns
- **Service Results**: Services return `{ success: boolean, data?: T, error?: string }`
- **API Responses**: Consistent error format `{ error: string }` with appropriate HTTP status
- **Logging**: Structured logging with user context and operation timing
- **Validation Errors**: Zod schemas provide detailed field-level error messages

### Import Patterns
```typescript
// Absolute imports with @/ alias
import { profileService } from "@/lib/services/profile.service";

import { prisma } from "@/lib/db";

// Barrel exports for clean imports
export { profileService } from "./profile.service";
export { resumeService } from "./resume.service";
```

## Integration Points & Dependencies

### External Services
- **OpenAI API**: Primary LLM provider (GPT-4 recommended for resume generation)
- **PostgreSQL**: Database (local dev, Vercel Postgres/Neon in production)
- **Vercel**: Recommended deployment platform with integrated Postgres

### Key Dependencies
- **@langchain/langgraph**: Agent orchestration and state management
- **@prisma/client**: Type-safe database access
- **next-auth**: Authentication and session management
- **@react-pdf/renderer**: PDF generation from React components
- **zod**: Runtime type validation and schema definition

## Development Best Practices

### Code Organization
- **Components**: Group by domain (`components/profile/`, `components/resume/`)
- **Services**: One service per domain with clear interfaces
- **Repositories**: Thin data access layer, no business logic
- **AI Agents**: Separate agent implementations from workflow orchestration

### Security Considerations
- **API Keys**: Never log decrypted keys, validate before use
- **User Data**: Encrypt sensitive data at rest
- **Rate Limiting**: Respect OpenAI API limits (3 RPM free tier)
- **Input Validation**: Validate all user inputs with Zod schemas

### Performance Optimization
- **Token Management**: Track AI API usage, optimize prompts
- **Database Queries**: Use Prisma's query optimization features
- **Caching**: Implement in-memory caching for frequently accessed data
- **PDF Generation**: Optimize for ATS compatibility over visual appeal

### Testing Priorities
- **AI Agents**: Mock LLM responses to avoid API costs
- **API Routes**: Test authentication, validation, and error handling
- **Services**: Unit test business logic with isolated dependencies
- **E2E**: Critical user flows (auth → profile → generate → export)

## Common Pitfalls to Avoid

- **Direct Database Access**: Always use repository classes, never import Prisma directly in components
- **Unencrypted API Keys**: Use encryption service for all key storage operations
- **Missing Validation**: Apply Zod schemas to all API inputs and outputs
- **AI Cost Spikes**: Implement token limits and usage tracking
- **Session Handling**: Always check `auth()` before accessing user data
- **JSON Field Mutations**: Use Prisma's JSON field update syntax for complex objects

## Schema Resume Json Reference

```
{
  "basics": {
    "name": "John Doe",
    "label": "Programmer",
    "image": "",
    "email": "john@gmail.com",
    "phone": "(912) 555-4321",
    "url": "https://johndoe.com",
    "summary": "A summary of John Doe…",
    "location": {
      "address": "2712 Broadway St",
      "postalCode": "CA 94115",
      "city": "San Francisco",
      "countryCode": "US",
      "region": "California"
    },
    "profiles": [{
      "network": "Twitter",
      "username": "john",
      "url": "https://twitter.com/john"
    }]
  },
  "work": [{
    "name": "Company",
    "position": "President",
    "url": "https://company.com",
    "startDate": "2013-01-01",
    "endDate": "2014-01-01",
    "summary": "Description…",
    "highlights": [
      "Started the company"
    ]
  }],
  "volunteer": [{
    "organization": "Organization",
    "position": "Volunteer",
    "url": "https://organization.com/",
    "startDate": "2012-01-01",
    "endDate": "2013-01-01",
    "summary": "Description…",
    "highlights": [
      "Awarded 'Volunteer of the Month'"
    ]
  }],
  "education": [{
    "institution": "University",
    "url": "https://institution.com/",
    "area": "Software Development",
    "studyType": "Bachelor",
    "startDate": "2011-01-01",
    "endDate": "2013-01-01",
    "score": "4.0",
    "courses": [
      "DB1101 - Basic SQL"
    ]
  }],
  "awards": [{
    "title": "Award",
    "date": "2014-11-01",
    "awarder": "Company",
    "summary": "There is no spoon."
  }],
  "certificates": [{
    "name": "Certificate",
    "date": "2021-11-07",
    "issuer": "Company",
    "url": "https://certificate.com"
  }],
  "publications": [{
    "name": "Publication",
    "publisher": "Company",
    "releaseDate": "2014-10-01",
    "url": "https://publication.com",
    "summary": "Description…"
  }],
  "skills": [{
    "name": "Web Development",
    "level": "Master",
    "keywords": [
      "HTML",
      "CSS",
      "JavaScript"
    ]
  }],
  "languages": [{
    "language": "English",
    "fluency": "Native speaker"
  }],
  "interests": [{
    "name": "Wildlife",
    "keywords": [
      "Ferrets",
      "Unicorns"
    ]
  }],
  "references": [{
    "name": "Jane Doe",
    "reference": "Reference…"
  }],
  "projects": [{
    "name": "Project",
    "startDate": "2019-01-01",
    "endDate": "2021-01-01",
    "description": "Description...",
    "highlights": [
      "Won award at AIHacks 2016"
    ],
    "url": "https://project.com/"
  }]
}
```

## Spec-Driven Development

This project uses OpenSpec for specification management:
- **Specs**: `openspec/specs/` - Current system capabilities
- **Changes**: `openspec/changes/` - Pending modifications
- **Workflow**: Proposal → Design → Implementation → Archive
- **Commands**: `openspec list`, `openspec validate [id]`, `openspec archive [id]`

When making changes, check existing specs and create proposals for significant modifications.
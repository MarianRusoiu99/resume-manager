# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Resume Optimizer Platform - An intelligent resume generation system that uses LangGraph multi-agent workflows to create tailored, ATS-optimized resumes based on job descriptions. Built with Next.js 16, TypeScript, Prisma, and OpenAI.

**Security Model**: BYOK (Bring Your Own Key) - users provide their own OpenAI API keys, which are encrypted at rest using AES-256-GCM.

## Development Commands

### Running the Application
```bash
# Install dependencies (required due to Next.js 16 peer dependencies)
npm install --legacy-peer-deps

# Development server
npm run dev

# Production build and start
npm run build
npm start

# Linting
npm run lint
```

### Database Operations
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name descriptive_migration_name

# Reset database (⚠️ destroys all data)
npx prisma migrate reset

# View data in Prisma Studio
npx prisma studio

# Seed database (if seed script exists)
npm run db:seed
```

### Testing
```bash
# Unit tests (Vitest + React Testing Library)
npm test                    # Run all unit tests
npm test -- --watch        # Watch mode
npm run test:ui            # Interactive test UI
npm run test:coverage      # Generate coverage report

# E2E tests (Playwright)
npm run e2e                # Run all E2E tests
npm run e2e:ui             # Interactive E2E UI
npm run e2e:headed         # Run with visible browser
npm run e2e:chromium       # Chromium only
npm run e2e:firefox        # Firefox only
npm run e2e:webkit         # WebKit only
npm run e2e:report         # View test report

# Load testing
npm run load-test:generate # Resume generation performance
npm run load-test:api      # API endpoint performance
npm run load-test:all      # Run all load tests
```

## Architecture Overview

### Core Architecture Patterns

**Repository Pattern**: Data access abstracted through repository classes (`lib/repositories/`)
- `profile.repository.ts` - User profile CRUD operations
- `apikey.repository.ts` - Encrypted API key management
- `generated-resume.repository.ts` - Resume storage and retrieval
- `template.repository.ts` - Resume template operations

**Service Layer**: Business logic separated from API routes (`lib/services/`)
- `profile.service.ts` - Profile management and validation
- `apikey.service.ts` - API key encryption, validation, provider setup
- `resume.service.ts` - Resume generation orchestration and DB persistence

**Agent Pattern**: LangGraph multi-agent workflow for AI orchestration (`lib/ai/workflow/`)
- State-based workflow with 6 specialized agents
- Agents communicate through shared state graph
- Sequential pipeline: validate → analyze → match → optimize → validate → generate

**Validation Layer**: Zod schemas for all data validation (`lib/validations/`)
- Type-safe validation for API inputs/outputs
- Consistent error messages
- Runtime type checking

### Directory Structure

```
app/
├── api/                       # Next.js API routes
│   ├── auth/                 # NextAuth endpoints + registration
│   ├── profile/              # Profile management CRUD
│   ├── resumes/              # Resume generation & management
│   └── settings/             # API key management
├── (dashboard pages)         # Various UI pages
lib/
├── ai/workflow/              # LangGraph workflow
│   ├── agents/              # Individual AI agents
│   │   ├── job-analysis.agent.ts
│   │   ├── profile-matching.agent.ts
│   │   ├── content-optimization.agent.ts
│   │   ├── format-validation.agent.ts
│   │   ├── output-generator.agent.ts
│   │   └── cover-letter.node.ts
│   ├── graph.ts             # StateGraph definition
│   ├── types.ts             # State interfaces
│   ├── service.ts           # Workflow orchestration
│   └── checkpointing.ts     # State persistence
├── services/                # Business logic layer
├── repositories/            # Data access layer
├── validations/             # Zod schemas
├── encryption/              # API key encryption utilities
├── pdf/                     # PDF generation
└── db.ts                    # Prisma client singleton
prisma/
└── schema.prisma            # Database schema
```

## LangGraph AI Workflow

The resume generation uses a stateful multi-agent workflow defined in `lib/ai/workflow/graph.ts`:

### Workflow Nodes (Sequential Pipeline)

1. **validate_input** - Validates job description and user profile
2. **analyze_job** (`job-analysis.agent.ts`) - Extracts requirements, skills, ATS keywords
3. **match_profile** (`profile-matching.agent.ts`) - Scores profile-job fit, identifies gaps
4. **optimize_content** (`content-optimization.agent.ts`) - Tailors descriptions for ATS
5. **validate_format** (`format-validation.agent.ts`) - Ensures ATS compliance
6. **generate_output** (`output-generator.agent.ts`) - Assembles final structured resume
7. **generate_cover_letter** (`cover-letter.node.ts`) - Optional cover letter generation

### State Management

The workflow uses LangGraph's `StateGraph` with typed state annotations:
- State flows through nodes sequentially
- Each agent enriches the state with its output
- Errors are accumulated in `state.errors[]`
- Token usage tracked in `state.tokensUsed`

### Checkpointing

Workflow supports state persistence via `createMemoryCheckpointer()`:
- Enables resuming failed workflows
- Useful for debugging multi-step processes
- Configurable via `compileResumeWorkflow({ withCheckpointing: true })`

## Data Models and Patterns

### Database Schema (Prisma)

**JSON Fields**: Complex objects stored as JSON in PostgreSQL:
- `UserProfile.experience` - Array of work experiences
- `UserProfile.education` - Array of education entries
- `UserProfile.skills` - Object with technical/soft/language skills
- `GeneratedResume.resumeContent` - Structured resume data
- `GeneratedResume.metadata` - Generation metadata (tokens, model, timing)

**Encryption**: API keys encrypted at rest:
- `APIKey.encryptedKey` - AES-256-GCM encrypted key
- `APIKey.keyHash` - SHA-256 hash for validation without decryption
- Decryption only happens during AI API calls

**Cascade Deletes**: User deletion cascades to all related data (profiles, API keys, resumes, sessions)

### Import Path Aliases

TypeScript configured with `@/` alias for absolute imports:
```typescript
import { profileService } from '@/lib/services/profile.service';
import { prisma } from '@/lib/db';
import { Profile } from '@/lib/validations/profile';
```

## API Route Patterns

All API routes follow this structure:

```typescript
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function GET() {
  // 1. Always check authentication first
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Call service layer (never access Prisma directly)
    const result = await service.method(session.user.id);

    // 3. Return consistent JSON responses
    return NextResponse.json(result);
  } catch (error) {
    // 4. Log errors with context
    console.error('Operation failed', error, { userId: session.user.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Key API Endpoints

**Authentication**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers (login, logout, session)

**Profile**:
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Upsert profile (create or update)
- `DELETE /api/profile` - Delete profile

**API Keys**:
- `GET /api/settings/api-keys` - List keys (masked)
- `POST /api/settings/api-keys` - Add new key (encrypts before storage)
- `DELETE /api/settings/api-keys/[id]` - Remove key
- `POST /api/settings/api-keys/[id]/validate` - Validate key with provider

**Resumes**:
- `POST /api/resumes/generate` - Generate new resume (triggers workflow)
- `GET /api/resumes` - List user's resumes
- `GET /api/resumes/[id]` - Get resume details
- `DELETE /api/resumes/[id]` - Delete resume
- `POST /api/resumes/[id]/export` - Export resume as PDF

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/resume_optimizer"

# NextAuth.js
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# API Key Encryption
ENCRYPTION_KEY="<generate with: openssl rand -hex 32>"

# Optional
NODE_ENV="development"  # or "production"
```

**Security**: Never commit `.env` file. Always use `.env.example` for templates.

## Key Development Patterns

### Service Layer Results

Services return consistent result objects:
```typescript
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Validation with Zod

All inputs validated with Zod schemas:
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name required'),
});

// In API routes
const validated = schema.parse(requestBody);  // Throws on validation error
```

### AI Provider Setup

API keys are user-provided and encrypted:
```typescript
// 1. User adds key via settings UI
// 2. Key encrypted with ENCRYPTION_KEY before DB storage
// 3. During resume generation:
//    - Decrypt user's API key
//    - Initialize OpenAI client with decrypted key
//    - Make AI calls
//    - Never log decrypted keys
```

### Repository Pattern Usage

**Always** use repository classes for data access:
```typescript
// ✅ Correct
import { profileService } from '@/lib/services/profile.service';
const profile = await profileService.getProfile(userId);

// ❌ Wrong (don't import prisma directly in components/routes)
import { prisma } from '@/lib/db';
const profile = await prisma.userProfile.findUnique(...);
```

## Testing Priorities

### Unit Tests (Vitest)
- Repository layer: Test CRUD operations
- Services: Mock repositories, test business logic
- AI Agents: Mock LLM responses to avoid API costs
- Utilities: Encryption, validation functions

### E2E Tests (Playwright)
Critical user flows:
1. Registration → Login → Session management
2. Profile creation → Profile update
3. API key addition → Key validation
4. Resume generation → View resume → Export PDF

### Mocking AI Calls

Always mock LLM responses in tests:
```typescript
import { vi } from 'vitest';

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue({ content: 'mocked response' })
  }))
}));
```

## Common Pitfalls to Avoid

1. **Direct Prisma Access**: Always use repository classes, never import `prisma` directly in components or API routes
2. **Unencrypted API Keys**: Use encryption service for all key storage operations
3. **Missing Authentication**: Always call `await auth()` before accessing user data
4. **Validation Gaps**: Apply Zod schemas to all API inputs and outputs
5. **JSON Field Mutations**: Use Prisma's JSON field update syntax when modifying nested JSON data
6. **Token Costs**: Implement token limits and usage tracking to avoid AI API cost spikes
7. **Next.js 16 Dependencies**: Always use `npm install --legacy-peer-deps` due to peer dependency conflicts

## Deployment Considerations

### Recommended Platform: Vercel
1. Connect GitHub repository
2. Configure environment variables in dashboard
3. Vercel auto-detects Next.js and configures build

### Database Options
- **Vercel Postgres**: Integrated, serverless PostgreSQL
- **Neon**: Serverless Postgres with generous free tier
- **Supabase**: Postgres with additional features
- **Self-hosted**: Any PostgreSQL 12+ instance

### Production Checklist
- [ ] Set strong `NEXTAUTH_SECRET` and `ENCRYPTION_KEY`
- [ ] Use HTTPS (required for secure sessions)
- [ ] Configure CORS appropriately
- [ ] Set up database backups
- [ ] Monitor AI API usage and costs
- [ ] Enable error tracking (Sentry, etc.)

## Component Patterns

Components use shadcn/ui (Radix UI + Tailwind):
- UI components in `components/ui/` (button, card, input, etc.)
- Domain components in `components/profile/`, `components/resume/`
- Use `cn()` utility for conditional classes: `cn("base-class", condition && "additional")`

### Styling
- Tailwind CSS v4 with custom configuration
- Dark mode support via `next-themes`
- Responsive design patterns

## Important Files to Reference

When working on specific areas, consult these files:

**AI Workflow**: `lib/ai/workflow/graph.ts`, `lib/ai/workflow/types.ts`
**Authentication**: `app/api/auth/[...nextauth]/route.ts`
**Database Schema**: `prisma/schema.prisma`
**Service Layer**: `lib/services/*.service.ts`
**Repository Layer**: `lib/repositories/*.repository.ts`
**Validation Schemas**: `lib/validations/`
**Encryption**: `lib/encryption/`
**PDF Generation**: `lib/pdf/`

## Copilot Instructions Integration

This project includes comprehensive Copilot instructions in `.github/copilot-instructions.md` with:
- Detailed architecture patterns
- Service/repository/agent patterns
- Error handling conventions
- Testing strategies
- Security best practices

Refer to that file for additional context on development workflows and conventions.

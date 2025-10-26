# Project Context

## Purpose
AI-powered resume optimization platform that helps job seekers create tailored, ATS-compliant resumes using advanced agentic AI workflows. The platform enables users to store professional profiles, analyze job descriptions, and generate optimized resumes with optional cover letters, all while maintaining control of their AI API keys (BYOK model).

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **AI Orchestration**: LangGraph (@langchain/langgraph)
- **LLM Integration**: LangChain with OpenAI provider
- **PDF Generation**: react-pdf (diegomura/react-pdf)
- **Validation**: Zod schemas
- **Encryption**: @noble/ciphers (AES-256-GCM)

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled, no implicit any
- **Naming**: 
  - React components: PascalCase (`ProfileForm.tsx`)
  - Utilities/services: camelCase (`resumeService.ts`)
  - Constants: UPPER_SNAKE_CASE
  - Database models: PascalCase
- **File Organization**:
  - `/app` - Next.js pages and layouts
  - `/lib` - Business logic, services, utilities
  - `/components` - Reusable React components
  - `/prisma` - Database schema and migrations
- **Imports**: Use `@/` alias for absolute imports
- **Formatting**: Prettier with 2-space indentation

### Architecture Patterns
- **Repository Pattern**: Database access abstracted through repository classes
- **Service Layer**: Business logic separated from API routes
- **Factory Pattern**: AI provider instantiation and configuration
- **Agent Pattern**: LangGraph agents for AI workflow orchestration
- **CQRS Light**: Separate read and write operations where beneficial

### Testing Strategy
- **Unit Tests**: All service layer functions, utilities, and agents
- **Integration Tests**: API routes with test database
- **E2E Tests**: Critical user flows (auth, generation, export)
- **Coverage Target**: >70% for core business logic
- **Test Framework**: Jest for unit/integration, Playwright for E2E
- **Mocking**: Mock LLM responses in tests to avoid API costs

### Git Workflow
- **Branch Strategy**: Feature branches from main
- **Branch Naming**: `feature/capability-name`, `fix/issue-description`
- **Commits**: Conventional commits (feat:, fix:, docs:, etc.)
- **PR Requirements**: Tests pass, code review approved
- **Main Branch**: Protected, production-ready code only

## Domain Context

### Resume Optimization
- **ATS (Applicant Tracking Systems)**: Software used by employers to filter resumes
- **Keywords**: Terms from job descriptions that ATS looks for
- **Reverse Chronological**: Standard resume format (newest experience first)
- **Action Verbs**: Strong verbs that convey impact (achieved, implemented, led)

### AI Agent Workflow
- **Agents**: Specialized AI components that perform specific tasks
- **State Management**: LangGraph manages shared state across agents
- **Orchestration**: Coordinating multiple AI calls in sequence
- **Token Usage**: API calls charged per token (input + output)

### BYOK Model
- **Bring Your Own Key**: Users provide their own AI API keys
- **Benefits**: User controls costs, no platform API limits
- **Security**: Keys encrypted at rest, never exposed to client

## Important Constraints
- **API Costs**: Users responsible for their AI provider costs
- **Rate Limits**: Respect OpenAI rate limits (3 RPM for free tier)
- **Data Privacy**: User data encrypted, never shared
- **Profile Size**: Maximum 50KB per profile to manage token costs
- **Generation Time**: Target 15-30 seconds per resume
- **No Fabrication**: AI must not invent experiences or skills

## External Dependencies
- **OpenAI API**: Primary LLM provider (user-supplied keys)
- **PostgreSQL**: Database (local dev, Vercel Postgres/Neon in production)
- **Vercel**: Recommended deployment platform
- **Future**: Support for additional AI providers (Anthropic, local models)

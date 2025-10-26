# Design: AI Resume Optimizer Platform

## Architecture Overview

This document outlines the architectural decisions, patterns, and technical approach for building the AI Resume Optimizer Platform.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth UI    │  │  Profile UI  │  │  Resume UI   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│              Next.js API Routes / Server Actions             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Auth     │  │    Profile   │  │  Resume Gen  │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴───────┐   │
│  │            Database Layer (Prisma ORM)              │   │
│  └─────────────────────────┬───────────────────────────┘   │
└────────────────────────────┼─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────┴───────┐  ┌────────┴────────┐  ┌──────┴─────┐
│  PostgreSQL   │  │   LangGraph     │  │  OpenAI    │
│   Database    │  │   AI Agents     │  │    API     │
└───────────────┘  └─────────────────┘  └────────────┘
                            │
                   ┌────────┴────────┐
                   │  PDF Generator  │
                   │   (react-pdf)   │
                   └─────────────────┘
```

## Core Components

### 1. Authentication System

**Technology Choice**: NextAuth.js v5 (Auth.js)
- **Rationale**: Well-integrated with Next.js 16, supports credentials and OAuth, built-in session management
- **Pattern**: Session-based authentication with JWT tokens
- **Storage**: PostgreSQL with User and Session tables

**Flow**:
```
User Registration → Password Hashing (bcrypt) → DB Storage → Auto Login
User Login → Credential Validation → Session Creation → JWT Cookie
```

### 2. User Profile Management

**Data Model**:
```typescript
interface UserProfile {
  id: string;
  userId: string; // FK to User
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  certifications?: Certification[];
  languages?: Language[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}
```

**Storage Strategy**:
- Structured data in PostgreSQL for querying and relationships
- JSONB columns for flexible nested structures (experience, education)
- Full-text search on skills and experience for analysis

### 3. AI Agent Workflow (LangGraph)

**Architecture Decision**: Multi-agent system with specialized agents

**Agent Roles**:
```
1. Coordinator Agent (Entry Point)
   ↓
2. Job Analysis Agent → Extracts key requirements, skills, ATS keywords
   ↓
3. Profile Matching Agent → Maps user profile to job requirements
   ↓
4. Content Optimization Agent → Tailors experience descriptions
   ↓
5. Format Validation Agent → Ensures ATS compliance
   ↓
6. Output Generator Agent → Creates structured resume data
```

**LangGraph State Management**:
```typescript
interface ResumeGenerationState {
  jobDescription: string;
  userProfile: UserProfile;
  analyzedRequirements: JobRequirements;
  matchedSkills: string[];
  optimizedContent: OptimizedContent;
  validationResult: ValidationResult;
  finalResume: StructuredResume;
  coverLetter?: string;
}
```

**Implementation Pattern**:
```typescript
import { StateGraph, END } from "@langchain/langgraph";

const workflow = new StateGraph({
  channels: {
    jobDescription: String,
    userProfile: Object,
    // ... other state channels
  }
})
  .addNode("analyze_job", analyzeJobAgent)
  .addNode("match_profile", profileMatchingAgent)
  .addNode("optimize_content", contentOptimizationAgent)
  .addNode("validate_format", formatValidationAgent)
  .addNode("generate_output", outputGeneratorAgent)
  .addEdge("analyze_job", "match_profile")
  .addEdge("match_profile", "optimize_content")
  .addEdge("optimize_content", "validate_format")
  .addEdge("validate_format", "generate_output")
  .addEdge("generate_output", END);
```

### 4. AI Provider Configuration

**Modular Provider System**:
```typescript
interface AIProvider {
  id: string;
  name: string;
  requiresApiKey: boolean;
  supportedModels: string[];
  validateApiKey: (apiKey: string) => Promise<boolean>;
  createClient: (apiKey: string, model: string) => LLMClient;
}

class OpenAIProvider implements AIProvider {
  id = "openai";
  name = "OpenAI";
  requiresApiKey = true;
  supportedModels = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"];
  
  async validateApiKey(apiKey: string): Promise<boolean> {
    // Validate by making test API call
  }
  
  createClient(apiKey: string, model: string): LLMClient {
    return new ChatOpenAI({ apiKey, model });
  }
}
```

**Registry Pattern**:
```typescript
class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  
  register(provider: AIProvider) {
    this.providers.set(provider.id, provider);
  }
  
  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }
}
```

### 5. API Key Management

**Security Strategy**:
- **Encryption**: AES-256-GCM for API keys at rest
- **Storage**: Separate `APIKeys` table with user FK
- **Access**: Server-side only, never exposed to client
- **Rotation**: Support for multiple keys with active/inactive status

**Data Model**:
```typescript
interface APIKey {
  id: string;
  userId: string;
  provider: string; // 'openai', 'anthropic', etc.
  encryptedKey: string;
  keyHash: string; // For validation without decryption
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}
```

### 6. PDF Generation & Template System

**Technology Choice**: `react-pdf` (diegomura/react-pdf)
- **Rationale**: React component-based, works in Node.js, professional output
- **Alternative Considered**: pdf-lib (lower-level, more control but more complexity)

**Template Architecture**:
- **Template Definition**: JSON-based configuration for layout, typography, colors
- **Template Engine**: React components that consume template config
- **Customization Layer**: User-specific overrides applied to base templates
- **Preview System**: Server-side rendering with caching for quick previews

**Generation Flow**:
```
StructuredResume + Template → React PDF Components → PDF Document → Blob → Download/Store
```

**Template Structure**:
```typescript
interface ResumeTemplate {
  layout: {
    margins: { top, right, bottom, left };
    columns: 1 | 2;
    sectionOrder: string[];
  };
  typography: {
    fontFamily: string;
    fontSizes: { name, header, body, small };
  };
  colors: {
    primary: string;
    accent?: string;
  };
  styling: {
    sectionDivider: 'line' | 'space';
    bulletStyle: 'circle' | 'square';
  };
}
```

**Component Structure**:
```tsx
<Document>
  <Page size="A4" style={getPageStyle(template)}>
    <ResumeHeader 
      data={resume.personalInfo} 
      template={template}
    />
    <ResumeSummary 
      text={resume.summary} 
      template={template}
    />
    <ResumeExperience 
      items={resume.experience} 
      template={template}
    />
    <ResumeEducation 
      items={resume.education} 
      template={template}
    />
    <ResumeSkills 
      skills={resume.skills} 
      template={template}
    />
  </Page>
</Document>
```

**Template Management**:
- Templates stored as JSON in database
- Default templates included in v1 (Classic, Modern, ATS-Optimized)
- User customizations stored separately per resume
- Template versioning for backward compatibility

**Resume Editing**:
- Structured data editing before PDF generation
- Real-time preview of changes
- Version control (AI-generated vs manually edited)
- Section reordering and customization

### 7. Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  profile       UserProfile?
  apiKeys       APIKey[]
  resumes       GeneratedResume[]
  sessions      Session[]
}

model UserProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  personalInfo    Json     // JSONB
  summary         String   @db.Text
  experience      Json     // JSONB array
  education       Json     // JSONB array
  skills          Json     // JSONB array
  certifications  Json?    // JSONB array
  languages       Json?    // JSONB array
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model APIKey {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  provider      String    // 'openai', etc.
  encryptedKey  String
  keyHash       String
  isActive      Boolean   @default(true)
  lastUsedAt    DateTime?
  createdAt     DateTime  @default(now())
  
  @@index([userId, provider])
}

model GeneratedResume {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  jobDescription  String   @db.Text
  jobMetadata     Json?    // company, title, url
  resumeContent   Json     // Structured resume data
  templateId      String?
  template        ResumeTemplate? @relation(fields: [templateId], references: [id])
  templateCustomization Json? // User's template overrides
  pdfUrl          String?  // If stored
  coverLetter     String?  @db.Text
  
  isEdited        Boolean  @default(false)
  aiGeneratedContent Json? // Original AI version
  
  metadata        Json     // Generation metadata (model, tokens, score)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId, createdAt])
}

model ResumeTemplate {
  id          String   @id @default(cuid())
  name        String
  category    String   // 'professional', 'modern', 'creative', 'ats-optimized'
  description String
  definition  Json     // Template configuration JSON
  previewUrl  String?
  isPublic    Boolean  @default(true)
  version     String   @default("1.0.0")
  atsScore    Int      @default(8) // 1-10 ATS compatibility rating
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  resumes     GeneratedResume[]
  
  @@index([category])
  @@index([isPublic])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionToken String   @unique
  expires      DateTime
  createdAt    DateTime @default(now())
  
  @@index([userId])
}
```

## Key Design Patterns

### 1. Repository Pattern
- Abstract database access through repository classes
- Easier testing and potential database migration

### 2. Service Layer
- Business logic separated from API routes
- Reusable across different endpoints

### 3. Factory Pattern
- AI provider instantiation
- PDF generator configuration

### 4. Strategy Pattern
- Different optimization strategies based on job type
- Pluggable ATS compliance rules

## Performance Considerations

### 1. Caching Strategy
- User profiles cached in Redis for fast access during generation
- AI provider configurations cached in memory
- Generated resumes cached for 24 hours for regeneration requests

### 2. Async Processing
- Long-running AI generation as background job
- WebSocket or Server-Sent Events for progress updates
- Job queue (Bull or similar) for handling multiple concurrent generations

### 3. Rate Limiting
- Per-user rate limits on API routes
- Respect AI provider rate limits
- Queue system to prevent thundering herd

## Security Considerations

### 1. Input Validation
- Zod schemas for all user inputs
- Sanitization of job descriptions and profile data
- File size limits for uploads

### 2. Authorization
- Middleware to verify user owns resources
- API key validation before use
- Session validation on all protected routes

### 3. Data Protection
- HTTPS only in production
- Encrypted database connections
- API keys never logged or exposed
- Secure cookie settings (httpOnly, secure, sameSite)

## Error Handling

### 1. AI Provider Errors
```typescript
try {
  const result = await agent.invoke(state);
} catch (error) {
  if (error.code === 'insufficient_quota') {
    return { error: 'API key has insufficient quota' };
  } else if (error.code === 'invalid_api_key') {
    return { error: 'Invalid API key' };
  }
  // Generic error
  return { error: 'Generation failed' };
}
```

### 2. Graceful Degradation
- If AI generation fails, return partial results
- Save generation state for retry
- Clear error messages to users

## Testing Strategy

### 1. Unit Tests
- Service layer functions
- AI agent individual nodes
- Utility functions (encryption, validation)

### 2. Integration Tests
- API routes with test database
- Full LangGraph workflow with mock LLM
- PDF generation pipeline

### 3. E2E Tests
- Critical user flows (registration, profile creation, resume generation)
- Browser automation with Playwright

## Deployment Architecture

### Development
- Local PostgreSQL instance
- Next.js dev server
- Environment variables for secrets

### Production (Vercel)
- Serverless functions for API routes
- Vercel Postgres or Neon for database
- Edge config for provider settings
- Environment variables for encryption keys

## Migration Path

### Phase 1: Foundation (Weeks 1-4)
- Auth system
- Database setup
- Basic UI

### Phase 2: Core Features (Weeks 5-8)
- Profile management
- AI integration
- LangGraph workflow

### Phase 3: Polish (Weeks 9-11)
- PDF generation
- Cover letters
- Testing and refinement

## Future Extensibility

### Designed for Future Enhancements
1. **Additional AI Providers**: Anthropic, Google, local models
2. **Template System**: Multiple resume templates
3. **Collaboration**: Share profiles with recruiters
4. **Analytics**: Track application success rates
5. **Integration**: Job board API connections
6. **Mobile Apps**: React Native using same backend

## Trade-offs and Decisions

### ✅ Chosen: Server-Side Rendering for UI
- **Pro**: Better SEO, faster initial load
- **Con**: More complex state management
- **Decision**: Next.js App Router with Server Components

### ✅ Chosen: LangGraph over Simple Prompts
- **Pro**: Better control, observability, debugging
- **Con**: More complexity, longer development
- **Decision**: Benefits outweigh complexity for v1

### ✅ Chosen: BYOK over Centralized Keys
- **Pro**: User control, no platform cost burden
- **Con**: More complex UX, key management overhead
- **Decision**: Sustainable for MVP, better for users

### ✅ Chosen: PostgreSQL over NoSQL
- **Pro**: Structured data, relationships, ACID compliance
- **Con**: Less flexible schema
- **Decision**: Structured user data benefits from relational model

# AI Resume Generation & Optimization

This specification defines the core AI-powered resume generation capabilities using LangGraph agentic workflows.

## ADDED Requirements

### Requirement: Job Description Input

The system SHALL accept and process job descriptions as input for resume optimization.

#### Scenario: User submits job description
- **Given** an authenticated user with a complete profile
- **When** they navigate to the resume generation page
- **And** paste or type a job description
- **And** optionally add company name and job title
- **Then** the system accepts the input
- **And** validates minimum length (100 characters)
- **And** stores the job description for processing

####Scenario: Job description validation
- **Given** a user enters a job description
- **When** they submit the form
- **Then** the system validates minimum length of 100 characters
- **And** validates maximum length of 10,000 characters
- **And** checks for presence of key information (job title or responsibilities)
- **And** returns specific validation errors if requirements not met

#### Scenario: User provides additional context
- **Given** a user is entering a job description
- **When** they provide optional metadata
- **Then** they can specify:
  - Company name
  - Job title
  - Application deadline
  - Job posting URL
- **And** this metadata is stored with the generation request

### Requirement: LangGraph Workflow Orchestration

The system SHALL use LangGraph to orchestrate a multi-agent workflow for resume generation.

#### Scenario: Workflow initialized with user data
- **Given** a user requests resume generation
- **When** the workflow starts
- **Then** the system initializes StateGraph with:
  - User's profile data
  - Job description
  - Selected AI model
  - Generation preferences
- **And** creates workflow instance with unique ID

#### Scenario: Workflow executes agent sequence
- **Given** the workflow is initialized
- **When** execution begins
- **Then** agents execute in sequence:
  1. Job Analysis Agent
  2. Profile Matching Agent
  3. Content Optimization Agent
  4. Format Validation Agent
  5. Output Generator Agent
- **And** each agent updates shared state
- **And** failures trigger appropriate error handling

#### Scenario: Workflow state managed through execution
- **Given** the workflow is executing
- **When** each agent processes
- **Then** state is passed between agents
- **And** intermediate results are preserved
- **And** state can be inspected for debugging
- **And** workflow can be paused/resumed

### Requirement: Job Analysis Agent

The system SHALL analyze job descriptions to extract requirements and keywords.

#### Scenario: Extract required skills from job description
- **Given** a job description is provided
- **When** the Job Analysis Agent processes it
- **Then** the agent identifies required skills
- **And** identifies preferred/nice-to-have skills
- **And** categorizes skills by type (technical, soft, domain)
- **And** returns structured list of skills with priority levels

#### Scenario: Identify ATS keywords
- **Given** a job description is analyzed
- **When** the agent extracts keywords
- **Then** it identifies important industry terms
- **And** identifies role-specific terminology
- **And** identifies company-specific requirements
- **And** ranks keywords by importance for ATS scoring

#### Scenario: Extract job requirements
- **Given** a job description is analyzed
- **When** the agent processes requirements
- **Then** it extracts:
  - Years of experience required
  - Education requirements
  - Certification requirements
  - Key responsibilities
  - Required competencies
- **And** structures requirements into categorized lists

#### Scenario: Determine job seniority level
- **Given** a job description is analyzed
- **When** the agent evaluates the role
- **Then** it determines seniority (Entry, Mid, Senior, Lead, Executive)
- **And** adjusts optimization strategy accordingly
- **And** tailors language and emphasis to level

### Requirement: Profile Matching Agent

The system SHALL match user profile against job requirements to prioritize relevant content.

#### Scenario: Match user skills to job requirements
- **Given** job requirements are extracted
- **And** user's profile contains skills
- **When** the Profile Matching Agent executes
- **Then** it identifies skills that match requirements
- **And** calculates match percentage for each skill
- **And** identifies missing skills
- **And** prioritizes matched skills for inclusion

#### Scenario: Score profile relevance
- **Given** user profile and job requirements
- **When** the matching agent analyzes fit
- **Then** it calculates overall relevance score (0-100)
- **And** provides breakdown by category:
  - Skills match: X%
  - Experience match: Y%
  - Education match: Z%
- **And** identifies strongest match areas
- **And** identifies gaps to address

#### Scenario: Prioritize experience by relevance
- **Given** user has multiple experience entries
- **When** the agent evaluates relevance to job
- **Then** it scores each experience for relevance
- **And** prioritizes most relevant experiences
- **And** suggests emphasizing specific accomplishments
- **And** recommends de-emphasizing less relevant roles

#### Scenario: Identify transferable skills
- **Given** user's background differs from job requirements
- **When** the agent analyzes skills
- **Then** it identifies transferable skills
- **And** maps user's skills to job requirements
- **And** provides reasoning for skill transferability

### Requirement: Content Optimization Agent

The system SHALL optimize resume content to maximize relevance and ATS compatibility.

#### Scenario: Rewrite experience descriptions
- **Given** user's experience entries
- **And** job requirements
- **When** the Content Optimization Agent processes
- **Then** it rewrites bullet points to emphasize relevant achievements
- **And** incorporates ATS keywords naturally
- **And** uses action verbs appropriate to the role
- **And** quantifies accomplishments where possible

#### Scenario: Tailor professional summary
- **Given** user's original summary
- **And** job requirements
- **When** the agent optimizes summary
- **Then** it creates a tailored summary that:
  - Highlights most relevant skills
  - Matches the job's seniority level
  - Incorporates key requirements
  - Maintains user's authentic voice
- **And** stays within 3-5 sentences

#### Scenario: Optimize skill presentation
- **Given** user's skills and job requirements
- **When** the agent optimizes skills section
- **Then** it reorders skills by relevance to job
- **And** groups related skills together
- **And** includes variations of keywords (e.g., "JS" and "JavaScript")
- **And** ensures ATS-friendly formatting

#### Scenario: Add relevant keywords without stuffing
- **Given** ATS keywords are identified
- **When** the agent optimizes content
- **Then** it incorporates keywords naturally in context
- **And** avoids keyword stuffing or repetition
- **And** maintains readability and authenticity
- **And** ensures grammar and flow are preserved

#### Scenario: Adjust tone and language
- **Given** the job description's tone and company culture indicators
- **When** the agent optimizes content
- **Then** it matches the tone (formal, casual, technical, creative)
- **And** adjusts language complexity appropriately
- **And** uses industry-appropriate terminology

### Requirement: Format Validation Agent

The system SHALL validate resume format for ATS compatibility and best practices.

#### Scenario: Validate ATS-friendly formatting
- **Given** optimized resume content
- **When** the Format Validation Agent checks formatting
- **Then** it validates:
  - No tables or columns (ATS parsing issues)
  - Clear section headers
  - Consistent date formatting
  - Bullet point usage
  - No special characters that break parsing
- **And** returns list of issues if any

#### Scenario: Check resume length
- **Given** generated resume content
- **When** the validation agent checks length
- **Then** it estimates page count
- **And** ensures appropriate length for seniority (1 page for <5 years, 2 pages for 5+ years)
- **And** suggests content to expand or trim if needed

#### Scenario: Validate contact information
- **Given** resume contains contact info
- **When** the validation agent checks
- **Then** it ensures email is valid format
- **And** ensures phone number is formatted consistently
- **And** ensures LinkedIn/portfolio URLs are complete
- **And** flags any missing critical contact info

#### Scenario: Check section organization
- **Given** resume structure
- **When** the validation agent reviews
- **Then** it validates standard section order:
  - Contact Info
  - Professional Summary
  - Experience (reverse chronological)
  - Education
  - Skills
  - Additional sections (certifications, etc.)
- **And** flags any missing essential sections

### Requirement: Output Generator Agent

The system SHALL generate structured resume data in a consistent format.

#### Scenario: Generate structured resume JSON
- **Given** all agents have completed processing
- **When** the Output Generator Agent executes
- **Then** it produces structured JSON with:
  - Personal information
  - Professional summary
  - Experience entries (ordered)
  - Education entries (ordered)
  - Skills (categorized and ordered)
  - Optional sections
  - Metadata (generation date, model, version)

#### Scenario: Include generation metadata
- **Given** a resume is generated
- **When** the output is created
- **Then** metadata includes:
  - Generation timestamp
  - AI model used
  - Workflow version
  - Job description hash
  - Optimization score
  - Processing time
- **And** metadata stored with resume

#### Scenario: Preserve user's original data
- **Given** a resume is generated
- **When** the output is created
- **Then** the system maintains link to original profile
- **And** stores both optimized and original versions
- **And** allows viewing differences
- **And** enables regeneration with original profile

### Requirement: Error Handling & Recovery

The system SHALL handle failures gracefully throughout the AI workflow.

#### Scenario: Handle AI provider errors
- **Given** an AI agent makes an API call
- **When** the provider returns an error
- **Then** the system catches the error
- **And** logs error details
- **And** returns user-friendly error message
- **And** preserves partial progress if possible

#### Scenario: Retry failed agent executions
- **Given** an agent execution fails
- **When** the failure is retriable (network, timeout)
- **Then** the system retries up to 3 times
- **And** uses exponential backoff (2s, 4s, 8s)
- **And** if all retries fail, returns error to user

#### Scenario: Handle insufficient API key quota
- **Given** user's API key has no quota
- **When** generation is attempted
- **Then** the system detects quota error
- **And** displays "Insufficient API quota"
- **And** suggests adding credits to provider account
- **And** does not charge user or deduct credits

#### Scenario: Partial workflow completion
- **Given** workflow fails at intermediate step
- **When** failure occurs
- **Then** the system saves completed agent results
- **And** allows resuming from last successful agent
- **And** provides option to regenerate from scratch

### Requirement: Progress Tracking

The system SHALL provide real-time progress updates during generation.

#### Scenario: Display current agent execution
- **Given** a resume generation is in progress
- **When** an agent is executing
- **Then** the UI displays current agent name
- **And** shows progress percentage
- **And** displays estimated time remaining
- **And** shows which step (e.g., "Analyzing job description... 2/5")

#### Scenario: Stream progress updates
- **Given** generation is in progress
- **When** workflow state changes
- **Then** the system sends progress update to client
- **And** uses Server-Sent Events or WebSocket
- **And** updates UI in real-time without polling

### Requirement: Resume Storage

The system SHALL store generated resumes for user access and regeneration.

#### Scenario: Save generated resume
- **Given** a resume generation completes successfully
- **When** the output is created
- **Then** the system stores the resume in database
- **And** associates it with the user and job description
- **And** generates a unique ID
- **And** stores generation metadata

#### Scenario: List user's generated resumes
- **Given** a user has generated resumes
- **When** they view their resumes page
- **Then** the system displays all resumes in reverse chronological order
- **And** shows job title and company for each
- **And** shows generation date
- **And** shows optimization score
- **And** allows filtering and searching

#### Scenario: Regenerate resume with same job description
- **Given** a user has a previously generated resume
- **When** they click "Regenerate"
- **Then** the system uses current profile data
- **And** uses same job description
- **And** creates new resume version
- **And** preserves original for comparison

### Requirement: Quality Assurance

The system SHALL ensure generated resumes meet quality standards.

#### Scenario: Validate content coherence
- **Given** a resume is generated
- **When** content is validated
- **Then** the system checks for:
  - Grammatically correct sentences
  - Consistent tense usage
  - No contradictory information
  - Logical flow between sections
- **And** flags quality issues

#### Scenario: Ensure authenticity
- **Given** optimized content is generated
- **When** the system reviews output
- **Then** it ensures claims are based on user's actual profile
- **And** doesn't fabricate experiences or skills
- **And** maintains truthfulness while optimizing presentation

#### Scenario: Readability check
- **Given** generated resume content
- **When** quality is assessed
- **Then** the system checks readability metrics
- **And** ensures appropriate reading level for industry
- **And** avoids overly complex or simple language
- **And** maintains professional tone

## Implementation Notes

### Technology Stack
- **Orchestration**: LangGraph (@langchain/langgraph)
- **LLM Integration**: @langchain/openai
- **State Management**: LangGraph StateGraph
- **Progress Streaming**: Server-Sent Events (SSE)

### LangGraph State Schema
```typescript
interface ResumeGenerationState {
  // Inputs
  userProfile: UserProfile;
  jobDescription: string;
  jobMetadata: { company?: string; title?: string; url?: string };
  
  // Intermediate results
  analyzedJob: {
    requiredSkills: string[];
    preferredSkills: string[];
    keywords: string[];
    requirements: JobRequirement[];
    seniority: string;
  };
  profileMatch: {
    matchedSkills: string[];
    relevanceScore: number;
    gaps: string[];
    prioritizedExperience: string[];
  };
  optimizedContent: {
    summary: string;
    experience: ExperienceEntry[];
    skills: string[];
  };
  validationResult: {
    issues: ValidationIssue[];
    passed: boolean;
  };
  
  // Output
  finalResume: StructuredResume;
  metadata: GenerationMetadata;
}
```

### Agent Functions
```typescript
const analyzeJobAgent = async (state: ResumeGenerationState) => {
  // Use LLM to analyze job description
};

const profileMatchingAgent = async (state: ResumeGenerationState) => {
  // Match profile to job requirements
};

const contentOptimizationAgent = async (state: ResumeGenerationState) => {
  // Optimize content with LLM
};

const formatValidationAgent = async (state: ResumeGenerationState) => {
  // Validate format and compliance
};

const outputGeneratorAgent = async (state: ResumeGenerationState) => {
  // Generate final structured output
};
```

### Database Schema Addition
```prisma
model GeneratedResume {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  jobDescription  String   @db.Text
  jobMetadata     Json?    // company, title, url
  resumeContent   Json     // Structured resume data
  pdfUrl          String?  // If PDF generated
  coverLetter     String?  @db.Text
  
  metadata        Json     // Generation metadata (model, tokens, score)
  createdAt       DateTime @default(now())
  
  @@index([userId, createdAt])
}
```

### API Endpoints
- `POST /api/resumes/generate` - Start resume generation
- `GET /api/resumes` - List user's resumes
- `GET /api/resumes/:id` - Get specific resume
- `POST /api/resumes/:id/regenerate` - Regenerate with updated profile
- `DELETE /api/resumes/:id` - Delete resume

### Performance Considerations
- Expected generation time: 15-30 seconds
- Token usage: ~1500-3000 tokens per generation
- Concurrent generations: Limited to 3 per user
- Timeout: 60 seconds per agent, 120 seconds total

### Testing Requirements
- Unit tests for each agent function
- Integration tests for complete workflow
- Mock LLM responses for testing
- E2E tests for generation flow
- Performance tests for latency

## Cross-References
- Related to: **Profile Management** (input data)
- Related to: **AI Provider Configuration** (uses API keys)
- Related to: **PDF Export** (output consumed by PDF generator)
- Related to: **Cover Letter Generation** (similar workflow pattern)

# Cover Letter Generation

This specification defines the AI-powered cover letter generation capabilities that complement resume optimization.

## ADDED Requirements

### Requirement: Cover Letter Generation Option

The system SHALL provide optional cover letter generation alongside resume generation.

#### Scenario: User opts in for cover letter
- **Given** a user is generating a resume
- **When** they check "Also generate cover letter"
- **And** submit the generation request
- **Then** the system generates both resume and cover letter
- **And** uses the same job description and profile data
- **And** stores cover letter with the resume

#### Scenario: User generates cover letter only
- **Given** a user has an existing resume
- **When** they request cover letter generation for same job
- **Then** the system generates cover letter using existing analysis
- **And** maintains consistency with resume
- **And** stores as separate document

#### Scenario: Cover letter generation is optional
- **Given** a user is generating a resume
- **When** they don't select cover letter option
- **Then** only the resume is generated
- **And** they can add cover letter later
- **And** no additional API calls are made

### Requirement: Cover Letter Agent

The system SHALL use a specialized AI agent to generate personalized cover letters.

#### Scenario: Generate cover letter with job context
- **Given** a job description and user profile
- **When** the Cover Letter Agent executes
- **Then** it analyzes the job requirements
- **And** reviews company information from job description
- **And** identifies key selling points from profile
- **And** determines appropriate tone and style
- **And** generates personalized cover letter

#### Scenario: Cover letter includes standard structure
- **Given** a cover letter is being generated
- **When** the agent creates content
- **Then** the letter includes:
  - Opening paragraph (introduction and interest)
  - 2-3 body paragraphs (relevant experience and skills)
  - Closing paragraph (call to action)
  - Professional sign-off
- **And** follows business letter format

#### Scenario: Personalize to company and role
- **Given** job description includes company information
- **When** cover letter is generated
- **Then** it references the company name
- **And** mentions the specific role title
- **And** addresses why user is interested in this company
- **And** aligns with company values/culture if mentioned

#### Scenario: Highlight relevant achievements
- **Given** user's profile contains accomplishments
- **When** cover letter is generated
- **Then** it selects 2-3 most relevant achievements
- **And** presents them with specific results/metrics
- **And** connects achievements to job requirements
- **And** avoids repeating entire resume

### Requirement: Cover Letter Content Optimization

The system SHALL optimize cover letter content for impact and authenticity.

#### Scenario: Match tone to company culture
- **Given** job description indicates company culture
- **When** cover letter is generated
- **Then** the tone matches culture indicators:
  - Formal for traditional/corporate roles
  - Professional but approachable for startups
  - Technical for engineering-heavy companies
- **And** uses appropriate language and terminology

#### Scenario: Demonstrate knowledge of company
- **Given** company information is available
- **When** cover letter is generated
- **Then** it includes reference to company's products, mission, or values
- **And** shows genuine interest and research
- **And** avoids generic statements
- **And** maintains authenticity

#### Scenario: Address specific job requirements
- **Given** job description lists specific requirements
- **When** cover letter is generated
- **Then** it explicitly addresses top 3-5 requirements
- **And** provides examples of meeting these requirements
- **And** uses keywords from job description
- **And** shows clear fit for role

#### Scenario: Maintain appropriate length
- **Given** a cover letter is being generated
- **When** content is created
- **Then** the letter is 250-400 words
- **And** fits on single page when formatted
- **And** is concise but comprehensive
- **And** doesn't overwhelm with too much information

### Requirement: Cover Letter Formatting

The system SHALL generate cover letters in professional business letter format.

#### Scenario: Standard business letter format
- **Given** a cover letter is generated
- **When** formatted for display
- **Then** it includes:
  - User's contact information (header)
  - Date
  - Employer's information (if available)
  - Salutation ("Dear Hiring Manager" or specific name if known)
  - Body paragraphs
  - Closing ("Sincerely," or "Best regards,")
  - User's name
- **And** uses proper spacing

#### Scenario: Salutation customization
- **Given** a cover letter is being generated
- **When** determining salutation
- **Then** it uses hiring manager name if available in job description
- **And** falls back to "Dear Hiring Manager" if not specified
- **And** avoids outdated salutations like "To Whom It May Concern"

#### Scenario: Professional closing
- **Given** a cover letter is generated
- **When** the closing is written
- **Then** it includes:
  - Expression of enthusiasm
  - Call to action (interview request)
  - Thank you
  - Professional sign-off
- **And** maintains confident but not arrogant tone

### Requirement: Cover Letter Validation

The system SHALL validate cover letter quality and appropriateness.

#### Scenario: Grammar and spelling check
- **Given** a cover letter is generated
- **When** validation runs
- **Then** the system checks for:
  - Grammatical correctness
  - Proper spelling
  - Consistent verb tenses
  - Punctuation accuracy
- **And** flags any issues

#### Scenario: Authenticity verification
- **Given** a cover letter is generated
- **When** content is reviewed
- **Then** the system ensures:
  - All claims are based on user's profile
  - No fabricated experiences
  - Realistic skill claims
  - Truthful representation
- **And** avoids exaggeration

#### Scenario: Relevance check
- **Given** a cover letter is generated
- **When** content is validated
- **Then** the system checks:
  - Letter addresses the specific job
  - Content is relevant to role
  - No generic filler text
  - Customized for company
- **And** ensures high quality output

### Requirement: Cover Letter Storage

The system SHALL store cover letters with associated resumes.

#### Scenario: Store cover letter with resume
- **Given** a cover letter is generated with resume
- **When** generation completes
- **Then** the cover letter is stored in database
- **And** linked to the resume record
- **And** includes generation metadata
- **And** is retrievable with resume

#### Scenario: Update cover letter independently
- **Given** a resume has an associated cover letter
- **When** user requests cover letter regeneration
- **Then** the system updates only the cover letter
- **And** preserves the resume
- **And** maintains link between them

### Requirement: Cover Letter Export

The system SHALL support exporting cover letters in multiple formats.

#### Scenario: Export cover letter as PDF
- **Given** a cover letter is generated
- **When** user requests PDF export
- **Then** the system generates formatted PDF
- **And** applies business letter layout
- **And** ensures professional appearance
- **And** provides download

#### Scenario: Export cover letter as plain text
- **Given** a cover letter is generated
- **When** user requests text export
- **Then** the system provides plain text version
- **And** maintains formatting with line breaks
- **And** allows easy copy-paste into application forms

#### Scenario: Combined PDF with resume
- **Given** a resume and cover letter exist
- **When** user requests combined export
- **Then** the system generates PDF with:
  - Cover letter as first page
  - Resume as subsequent pages
  - Consistent formatting
- **And** provides single download

### Requirement: Cover Letter Customization

The system SHALL allow users to customize cover letter output.

#### Scenario: User provides additional context
- **Given** a user is requesting cover letter generation
- **When** they provide additional information
- **Then** they can specify:
  - Why they're interested in this company
  - Specific experiences to highlight
  - Tone preference (formal, conversational)
  - Any special circumstances (referral, relocation)
- **And** agent incorporates this context

#### Scenario: User edits generated cover letter
- **Given** a cover letter is generated
- **When** user views it
- **Then** they can edit the text directly
- **And** save their edited version
- **And** maintain both AI-generated and edited versions

#### Scenario: Regenerate with different approach
- **Given** user is not satisfied with cover letter
- **When** they request regeneration
- **Then** they can adjust parameters:
  - Tone (more formal, more casual)
  - Length (shorter, longer)
  - Focus areas (technical skills, leadership, creativity)
- **And** system generates new version

### Requirement: Cover Letter Preview

The system SHALL provide preview of cover letters before export.

#### Scenario: Display formatted cover letter
- **Given** a cover letter is generated
- **When** user views resume details
- **Then** the cover letter is displayed
- **And** shows proper formatting
- **And** appears in business letter layout
- **And** is easily readable

#### Scenario: Side-by-side resume and cover letter view
- **Given** both resume and cover letter exist
- **When** user views them
- **Then** UI offers side-by-side view
- **And** allows reviewing both documents
- **And** ensures consistency between them

## Implementation Notes

### Technology Stack
- **LangGraph Agent**: Similar to resume agents
- **LLM Integration**: Uses same AI provider as resume generation
- **PDF Generation**: react-pdf for formatted output

### Cover Letter Agent Implementation
```typescript
const coverLetterAgent = async (state: CoverLetterState) => {
  const prompt = `
    Generate a professional cover letter for the following job application.
    
    Job Description: ${state.jobDescription}
    Company: ${state.jobMetadata.company}
    Role: ${state.jobMetadata.title}
    
    Candidate Background: ${JSON.stringify(state.userProfile)}
    
    Requirements:
    - 250-400 words
    - Professional but authentic tone
    - Highlight 2-3 most relevant achievements
    - Reference company specifically
    - Include call to action
  `;
  
  const response = await llm.invoke(prompt);
  return { coverLetter: response.content };
};
```

### Database Schema Addition
```prisma
model GeneratedResume {
  // ... existing fields
  coverLetter     String?  @db.Text
  coverLetterMetadata Json? // Generation details
}
```

### API Endpoints
- `POST /api/resumes/:id/cover-letter` - Generate cover letter
- `PATCH /api/resumes/:id/cover-letter` - Update cover letter
- `POST /api/resumes/:id/cover-letter/export` - Export as PDF/text

### Cover Letter Template Structure
```
[User's Name]
[Address]
[Email | Phone]

[Date]

[Company Name]
[Hiring Manager Name if available]
[Company Address]

Dear [Hiring Manager Name/Hiring Manager],

[Opening paragraph: Interest in position and brief introduction]

[Body paragraph 1: Relevant experience and achievements]

[Body paragraph 2: Why interested in company and role fit]

[Closing paragraph: Call to action and thank you]

Sincerely,
[User's Name]
```

### Performance Targets
- Generation time: 10-15 seconds
- Token usage: ~500-1000 tokens
- Combined with resume: +10 seconds total time

### Testing Requirements
- Unit tests for cover letter agent
- Integration tests with resume generation
- Content quality validation tests
- Format validation tests
- Export format tests

## Cross-References
- Related to: **AI Resume Generation** (similar workflow)
- Related to: **PDF Export** (cover letter PDF generation)
- Related to: **Profile Management** (source data)
- Related to: **AI Provider Configuration** (uses same API keys)

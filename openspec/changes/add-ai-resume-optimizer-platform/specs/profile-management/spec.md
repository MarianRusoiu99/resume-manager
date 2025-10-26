# User Profile Management

This specification defines the user profile management capabilities for storing and managing job seeker professional information.

## ADDED Requirements

### Requirement: Profile Creation

The system SHALL allow authenticated users to create their professional profile with comprehensive career information.

#### Scenario: User creates new profile with personal information
- **Given** an authenticated user without an existing profile
- **When** they navigate to the profile creation page
- **And** enter their full name, email, phone number, location, LinkedIn URL, and portfolio URL
- **Then** the system validates all input fields
- **And** stores the personal information in the database
- **And** displays a success message
- **And** enables access to additional profile sections

#### Scenario: Personal information validation
- **Given** a user is creating their profile
- **When** they submit personal information
- **Then** the system validates email format (RFC 5322 compliant)
- **And** validates phone number format (international format optional)
- **And** validates URL formats for LinkedIn and portfolio
- **And** returns specific validation errors for invalid fields

### Requirement: Experience Management

The system SHALL allow users to add, edit, and manage their professional experience entries.

#### Scenario: User adds work experience entry
- **Given** a user with a profile
- **When** they add a new experience entry
- **And** provide company name, job title, start date, end date (or "Present"), and description
- **Then** the system stores the experience entry
- **And** associates it with the user's profile
- **And** displays it in chronological order (newest first)

#### Scenario: User can add multiple experience entries
- **Given** a user with a profile
- **When** they add multiple work experiences
- **Then** each entry is stored independently
- **And** all entries are displayed in the experience section
- **And** entries can be reordered by date

#### Scenario: User edits existing experience
- **Given** a user with existing experience entries
- **When** they select an entry to edit
- **And** modify the details
- **Then** the system updates the entry in the database
- **And** preserves the entry ID
- **And** updates the last modified timestamp

#### Scenario: User deletes experience entry
- **Given** a user with existing experience entries
- **When** they select an entry to delete
- **And** confirm the deletion
- **Then** the system removes the entry from the database
- **And** updates the UI immediately

#### Scenario: Experience description supports rich formatting
- **Given** a user is entering an experience description
- **When** they use bullet points and line breaks
- **Then** the system preserves formatting
- **And** stores as structured text
- **And** displays with proper formatting in preview

### Requirement: Education Management

The system SHALL allow users to manage their educational background.

#### Scenario: User adds education entry
- **Given** a user with a profile
- **When** they add education information
- **And** provide school/institution name, degree, field of study, graduation date
- **Then** the system stores the education entry
- **And** displays it in chronological order

#### Scenario: User can add multiple education entries
- **Given** a user with a profile
- **When** they add multiple education entries
- **Then** each entry is stored independently
- **And** all entries are displayed in the education section

#### Scenario: User manages ongoing education
- **Given** a user is currently enrolled
- **When** they add an education entry
- **And** select "Currently Enrolled" or "Expected Graduation"
- **Then** the system stores the entry without an end date
- **And** displays it appropriately

### Requirement: Skills Management

The system SHALL allow users to manage their professional skills with categorization.

#### Scenario: User adds technical skills
- **Given** a user with a profile
- **When** they add skills (e.g., "JavaScript", "Python", "Project Management")
- **Then** the system stores each skill as a separate entry
- **And** allows tagging or categorization
- **And** displays skills as tags or chips

#### Scenario: User adds skill proficiency levels
- **Given** a user is adding a skill
- **When** they optionally specify proficiency (Beginner, Intermediate, Advanced, Expert)
- **Then** the system stores the proficiency level
- **And** displays it with the skill

#### Scenario: User can search and autocomplete skills
- **Given** a user is adding skills
- **When** they start typing a skill name
- **Then** the system suggests common skills
- **And** allows selecting from suggestions or entering custom skills

#### Scenario: User organizes skills by category
- **Given** a user has added multiple skills
- **When** they view their skills list
- **Then** skills can be grouped by type (Technical, Soft Skills, Languages, Tools)
- **And** categories are clearly labeled

### Requirement: Professional Summary

The system SHALL allow users to create a professional summary or objective statement.

#### Scenario: User writes professional summary
- **Given** a user with a profile
- **When** they enter a professional summary (2-5 sentences)
- **Then** the system stores the summary text
- **And** validates length (minimum 50 characters, maximum 500 characters)
- **And** displays it prominently in profile preview

#### Scenario: User updates professional summary
- **Given** a user with an existing summary
- **When** they edit the summary text
- **Then** the system updates the stored summary
- **And** maintains version history (optional for future)

### Requirement: Additional Information

The system SHALL support optional additional profile information.

#### Scenario: User adds certifications
- **Given** a user with a profile
- **When** they add certification information
- **And** provide certification name, issuing organization, issue date, expiration date (optional)
- **Then** the system stores the certification
- **And** displays it in the profile

#### Scenario: User adds language proficiency
- **Given** a user with a profile
- **When** they add languages they speak
- **And** specify proficiency level (Native, Fluent, Conversational, Basic)
- **Then** the system stores the language information
- **And** displays it in the profile

### Requirement: Profile Validation

The system SHALL validate profile data for completeness and correctness.

#### Scenario: System validates required fields
- **Given** a user is creating or updating their profile
- **When** they submit the form
- **Then** the system checks that required fields are filled
- **And** returns specific errors for missing required fields
- **And** prevents saving incomplete required sections

#### Scenario: System validates data formats
- **Given** a user enters profile data
- **When** they submit the form
- **Then** the system validates dates are in correct format
- **And** validates URLs are properly formatted
- **And** validates email addresses
- **And** validates phone numbers (if provided)

#### Scenario: Profile completeness indicator
- **Given** a user is building their profile
- **When** they view the profile page
- **Then** the system displays a completion percentage
- **And** highlights incomplete sections
- **And** suggests next steps to improve profile

### Requirement: Profile Data Storage

The system SHALL store profile data securely with proper data modeling.

#### Scenario: Profile data stored in structured format
- **Given** a user saves their profile
- **When** the data is persisted
- **Then** personal information is stored in dedicated fields
- **And** experience entries are stored as JSONB array
- **And** education entries are stored as JSONB array
- **And** skills are stored as JSONB array
- **And** all timestamps are recorded

#### Scenario: Profile data size limits enforced
- **Given** a user is entering profile data
- **When** they exceed size limits
- **Then** the system enforces maximum 50KB total profile size
- **And** provides clear feedback about limit
- **And** suggests ways to reduce size

### Requirement: Profile Retrieval

The system SHALL efficiently retrieve and display user profile data.

#### Scenario: User views their complete profile
- **Given** an authenticated user with a profile
- **When** they navigate to the profile page
- **Then** the system retrieves all profile data in single query
- **And** displays personal info, experience, education, skills
- **And** loads within 1 second

#### Scenario: Profile data formatted for display
- **Given** a user's profile is retrieved
- **When** the data is displayed
- **Then** dates are formatted in user-friendly format (e.g., "Jan 2020 - Dec 2022")
- **And** URLs are clickable links
- **And** skills are displayed as tags
- **And** experience bullets are properly formatted

### Requirement: Profile Updates

The system SHALL support incremental profile updates with auto-save functionality.

#### Scenario: Auto-save profile changes
- **Given** a user is editing their profile
- **When** they pause typing for 2 seconds
- **Then** the system automatically saves the changes
- **And** displays a "Saved" indicator
- **And** doesn't interrupt the user's workflow

#### Scenario: Manual save option available
- **Given** a user is editing their profile
- **When** they click the "Save" button
- **Then** the system immediately saves all pending changes
- **And** provides feedback confirmation
- **And** updates the last modified timestamp

#### Scenario: Handle concurrent edit conflicts
- **Given** a user's profile is open in multiple tabs
- **When** they edit in one tab and save
- **And** then edit in another tab
- **Then** the system warns about potential conflicts
- **And** allows choosing which version to keep

### Requirement: Profile Privacy

The system SHALL protect user profile data privacy.

#### Scenario: Profile data encrypted at rest
- **Given** a user's profile is stored
- **When** the data is persisted to the database
- **Then** sensitive fields are encrypted
- **And** database connection uses TLS
- **And** access is restricted to authorized application code

#### Scenario: Profile access restricted to owner
- **Given** a user profile exists
- **When** any API request attempts to access it
- **Then** the system verifies the requester is the profile owner
- **And** returns 403 Forbidden for unauthorized access

### Requirement: Profile Export

The system SHALL allow users to export their profile data.

#### Scenario: User exports profile as JSON
- **Given** an authenticated user with a profile
- **When** they request a profile export
- **Then** the system generates a JSON file with all profile data
- **And** provides a download link
- **And** includes all sections (personal, experience, education, skills)

## Implementation Notes

### Technology Stack
- **Database**: PostgreSQL with Prisma ORM
- **Data Format**: JSONB for nested structures (experience, education, skills)
- **Validation**: Zod schemas
- **Auto-save**: Debounced updates (2-second delay)

### Database Schema
```prisma
model UserProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  personalInfo    Json     // { fullName, email, phone, location, linkedin, portfolio }
  summary         String   @db.Text
  experience      Json     // Array of experience objects
  education       Json     // Array of education objects
  skills          Json     // Array of skill objects
  certifications  Json?    // Optional array
  languages       Json?    // Optional array
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### API Endpoints
- `GET /api/profile` - Retrieve user profile
- `POST /api/profile` - Create new profile
- `PATCH /api/profile` - Update profile
- `GET /api/profile/export` - Export profile data

### Validation Rules
- Full name: 2-100 characters, required
- Email: Valid email format, required
- Phone: Optional, international format accepted
- URLs: Valid HTTP/HTTPS format
- Summary: 50-500 characters
- Total profile size: Maximum 50KB

### Testing Requirements
- Unit tests for profile validation
- Unit tests for JSONB serialization
- Integration tests for CRUD operations
- E2E tests for profile creation flow
- Performance tests for profile retrieval

## Cross-References
- Related to: **User Authentication** (requires authenticated user)
- Related to: **AI Resume Generation** (profile is input data)
- Related to: **PDF Export** (profile data included in resumes)

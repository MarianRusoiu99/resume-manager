# Implementation Tasks: AI Resume Optimizer Platform

This document provides an ordered list of implementation tasks for building the AI Resume Optimizer Platform. Tasks are organized by phase and designed to deliver incremental, verifiable progress.

## Phase 1: Foundation & Authentication (Weeks 1-2)

### 1.1 Project Setup & Dependencies
- [x] Install and configure Prisma ORM
- [x] Install NextAuth.js v5 (Auth.js)
- [x] Install encryption library (bcryptjs for passwords)
- [x] Install Zod for schema validation
- [x] Install LangGraph (@langchain/langgraph)
- [x] Install LangChain core and OpenAI integration
- [x] Install react-pdf for PDF generation
- [x] Configure TypeScript paths and aliases
- [x] **Validation**: All dependencies install without errors, `npm run build` succeeds

### 1.2 Database Setup
- [x] Create Prisma schema with User model
- [x] Create Prisma schema with Session model
- [x] Create Prisma schema with UserProfile model
- [x] Create Prisma schema with APIKey model
- [x] Create Prisma schema with GeneratedResume model
- [x] Create Prisma schema with ResumeTemplate model
- [x] Set up PostgreSQL database (Docker container on port 15432)
- [x] Run initial Prisma migration
- [ ] Create database seed script with test user
- [x] **Validation**: `npx prisma studio` opens and shows all tables

**Dependencies**: None
**Parallel Work**: Can work on UI components while database setup progresses

### 1.3 Authentication System
- [x] Configure NextAuth.js with credentials provider
- [x] Create `/api/auth/[...nextauth]/route.ts`
- [x] Implement password hashing utility (bcrypt)
- [x] Create user registration API route (`/api/auth/register`)
- [x] Create login page UI (`/app/login/page.tsx`)
- [x] Create registration page UI (`/app/register/page.tsx`)
- [x] Implement session middleware for protected routes
- [x] Create auth utility functions (`auth`, session handling)
- [x] Add logout functionality
- [x] **Validation**: User can register, login, and access protected routes

**Dependencies**: 1.2 (Database Setup)
**Parallel Work**: Can design UI layouts while implementing backend

### 1.4 Base Layout & Navigation
- [x] Create app layout with navigation header
- [x] Add user menu with logout option
- [x] Create dashboard landing page (`/app/dashboard/page.tsx`)
- [x] Create home/landing page with features and CTA
- [ ] Add loading states and error boundaries
- [x] Implement responsive design with Tailwind CSS
- [x] Create reusable UI components (Button, Input, Card)
- [x] **Validation**: User can navigate between pages with consistent layout

**Dependencies**: 1.3 (Authentication)
**Parallel Work**: None

## Phase 2: Profile Management (Weeks 3-4)

### 2.1 Profile Data Layer
- [x] Create ProfileRepository class with CRUD operations
- [x] Create ProfileService with business logic
- [x] Implement profile validation schemas (Zod)
- [x] Create API route: `GET /api/profile` (fetch user profile)
- [x] Create API route: `POST /api/profile` (create profile)
- [x] Create API route: `PATCH /api/profile` (update profile)
- [x] Create API route: `PUT /api/profile` (upsert profile)
- [x] Create API route: `DELETE /api/profile` (delete profile)
- [ ] Add error handling and logging
- [x] **Validation**: API routes tested with Postman/curl, return correct data

**Dependencies**: 1.2 (Database Setup)
**Parallel Work**: Can work on UI while building API

### 2.2 Profile UI - Personal Information
- [x] Create profile form page (`/app/profile/page.tsx`)
- [x] Build PersonalInfoForm component (name, email, phone, location, links)
- [x] Add form validation with client-side feedback
- [ ] Implement auto-save functionality (debounced)
- [x] Add loading states and success/error messages
- [x] **Validation**: User can enter and save personal information

**Dependencies**: 2.1 (Profile Data Layer)
**Parallel Work**: None

### 2.3 Profile UI - Experience & Education
- [x] Create ExperienceForm component (dynamic list)
- [x] Add experience entry fields (company, title, dates, description)
- [x] Create EducationForm component (dynamic list)
- [x] Add education entry fields (school, degree, dates)
- [x] Implement add/remove entry functionality
- [x] Add rich text editor for descriptions (optional: simple textarea for MVP)
- [x] **Validation**: User can add multiple experiences and education entries

**Dependencies**: 2.2 (Personal Info UI)
**Parallel Work**: None

### 2.4 Profile UI - Skills & Additional Info
- [x] Create SkillsForm component with tag input
- [x] Add skill categories (technical, soft skills, languages)
- [ ] Create CertificationsForm component (optional)
- [ ] Create LanguagesForm component (optional)
- [x] Add profile summary/objective text area
- [x] Implement profile completion indicator
- [x] **Validation**: User can add skills and complete full profile

**Dependencies**: 2.3 (Experience & Education UI)
**Parallel Work**: Can start AI integration planning

## Phase 3: AI Provider Configuration (Week 5)

### 3.1 API Key Management Backend
- [x] Create encryption utility functions (encrypt/decrypt API keys)
- [x] Create APIKeyRepository with CRUD operations
- [x] Create APIKeyService with validation logic
- [x] Create API route: `POST /api/settings/api-keys` (add key)
- [x] Create API route: `GET /api/settings/api-keys` (list keys, masked)
- [x] Create API route: `DELETE /api/settings/api-keys/:id` (remove key)
- [x] Create API route: `POST /api/settings/api-keys/:id/validate` (test key)
- [x] **Validation**: API keys stored encrypted, can be validated

**Dependencies**: 1.2 (Database Setup)
**Parallel Work**: Can work on UI while building backend

### 3.2 AI Provider System
- [x] Create AIProvider interface
- [x] Implement OpenAIProvider class
- [x] Create AIProviderRegistry class
- [x] Implement provider factory function
- [x] Add provider configuration (models, capabilities)
- [x] Create utility to get active API key for user
- [x] **Validation**: Can instantiate OpenAI client with user's key

**Dependencies**: 3.1 (API Key Backend)
**Parallel Work**: None

### 3.3 API Key Management UI
- [x] Create settings page (`/app/settings/page.tsx`)
- [x] Build APIKeyForm component
- [x] Add provider selection dropdown (OpenAI for MVP)
- [x] Implement API key input with show/hide toggle
- [x] Add key validation button with feedback
- [x] Display list of saved keys (masked)
- [x] Add delete key functionality with confirmation
- [x] **Validation**: User can add, validate, and manage API keys

**Dependencies**: 3.2 (Provider System)
**Parallel Work**: Can work on AI agent design

## Phase 4: LangGraph AI Workflow (Weeks 6-7)

### 4.1 LangGraph Foundation
- [x] Create base StateGraph configuration
- [x] Define ResumeGenerationState interface
- [x] Create agent utility functions (message handling)
- [ ] Set up LangChain memory and checkpointing
- [x] Create agent testing framework
- [x] **Validation**: Can create and run empty graph workflow

**Dependencies**: 3.2 (Provider System)
**Parallel Work**: None
**Status**: ✅ Complete - Workflow compiles and tests pass successfully

### 4.2 Job Analysis Agent
- [x] Create analyzeJobAgent function
- [x] Implement prompt template for job analysis
- [x] Extract key requirements from job description
- [x] Identify required and preferred skills
- [x] Extract ATS keywords and important terms
- [x] Generate job summary and key points
- [x] **Validation**: Agent extracts structured data from job description

**Dependencies**: 4.1 (LangGraph Foundation)
**Parallel Work**: Can work on other agents
**Status**: ✅ Complete - Job analysis agent extracts structured data from job postings

### 4.3 Profile Matching Agent
- [x] Create profileMatchingAgent function
- [x] Implement skill matching algorithm
- [x] Score profile relevance to job requirements
- [x] Identify missing skills and gaps
- [x] Prioritize experience based on job needs
- [x] Generate matching recommendations
- [x] **Validation**: Agent produces relevance scores and recommendations

**Dependencies**: 4.1 (LangGraph Foundation)
**Parallel Work**: Can work in parallel with 4.2
**Status**: ✅ Complete - Profile matching agent assesses candidate fit against job requirements

### 4.4 Content Optimization Agent
- [x] Create contentOptimizationAgent function
- [x] Implement experience description tailoring
- [x] Rewrite bullet points to match job requirements
- [x] Optimize for ATS keywords without keyword stuffing
- [x] Adjust tone and emphasis based on job
- [x] Generate optimized summary statement
- [x] **Validation**: Agent produces tailored content

**Dependencies**: 4.2, 4.3 (Previous agents)
**Parallel Work**: Can work on format validation agent
**Status**: ✅ Complete - Content optimization agent tailors resume content with ATS keywords

### 4.5 Format Validation Agent
- [x] Create formatValidationAgent function
- [x] Implement ATS compliance checks
- [x] Validate formatting rules (bullet points, dates, etc.)
- [x] Check for common ATS parsing issues
- [x] Ensure readability and structure
- [x] Generate validation report
- [x] **Validation**: Agent identifies and reports formatting issues

**Dependencies**: 4.1 (LangGraph Foundation)
**Parallel Work**: Can work in parallel with other agents
**Status**: ✅ Complete - Format validation agent checks ATS compliance and formatting issues

### 4.6 Output Generator Agent
- [x] Create outputGeneratorAgent function
- [x] Implement structured resume data generation
- [x] Format experience and education sections
- [x] Organize skills by relevance
- [x] Create final resume structure (JSON)
- [x] Add metadata (generation date, model used, etc.)
- [x] **Validation**: Agent produces complete structured resume

**Status**: ✅ Complete - Output generator assembles final resume with metadata (no AI calls needed)

**Dependencies**: 4.4, 4.5 (Previous agents)
**Parallel Work**: None

### 4.7 Complete Workflow Integration
- [x] Connect all agents in StateGraph
- [x] Add conditional edges for error handling
- [ ] Implement retry logic for failed agent calls (deferred - service layer handles errors gracefully)
- [x] Add progress tracking and logging
- [x] Create workflow invocation service
- [x] Handle token usage tracking
- [x] **Validation**: Full workflow runs from job description to structured resume

**Status**: ✅ Complete - Service layer executes complete workflow with userId context and error handling

**Dependencies**: 4.2, 4.3, 4.4, 4.5, 4.6 (All agents)
**Parallel Work**: Can start PDF work while testing

## Phase 5: Resume Generation UI & Backend (Week 8)

### 5.1 Resume Generation Backend
- [x] Create ResumeService with generation logic
- [x] Create API route: `POST /api/resumes/generate`
- [x] Implement request validation (job description, options)
- [ ] Add progress streaming (Server-Sent Events or WebSocket) - Deferred for v2
- [x] Store generated resumes in database
- [x] Add error handling and user feedback
- [x] **Validation**: API generates and stores resumes

**Status**: ✅ Complete - Backend service wraps workflow and stores resumes in database

**Dependencies**: 4.7 (Complete Workflow)
**Parallel Work**: Can work on UI while backend progresses

### 5.2 Resume Generation UI
- [ ] Create resume generator page (`/app/generate/page.tsx`)
- [ ] Build job description input form
- [ ] Add company/job title metadata fields
- [ ] Implement generation button with loading state
- [ ] Show progress indicators during generation
- [ ] Display generated resume preview
- [ ] Add regenerate functionality
- [ ] **Validation**: User can generate resume from UI

**Dependencies**: 5.1 (Generation Backend)
**Parallel Work**: None

### 5.3 Resume History & Management
- [ ] Create resume history page (`/app/resumes/page.tsx`)
- [ ] Display list of generated resumes
- [ ] Add filtering by date, job title
- [ ] Implement resume detail view
- [ ] Add delete resume functionality
- [ ] Show generation metadata
- [ ] **Validation**: User can view and manage past resumes

**Dependencies**: 5.2 (Generation UI)
**Parallel Work**: Can work on PDF generation

## Phase 6: PDF Export (Week 9)

### 6.1 PDF Generation Service
- [ ] Set up react-pdf document structure
- [ ] Create ResumeHeader PDF component
- [ ] Create ResumeSummary PDF component
- [ ] Create ResumeExperience PDF component
- [ ] Create ResumeEducation PDF component
- [ ] Create ResumeSkills PDF component
- [ ] Define PDF styling (fonts, colors, spacing)
- [ ] **Validation**: Can generate PDF from structured resume data

**Dependencies**: 5.1 (Generation Backend)
**Parallel Work**: Can design PDF layout while building components

### 6.2 PDF Export Backend
- [ ] Create PDFService for document generation
- [ ] Create API route: `POST /api/resumes/:id/export`
- [ ] Generate PDF blob from structured data
- [ ] Implement file storage (local or cloud)
- [ ] Return PDF URL or blob
- [ ] Add PDF generation to resume creation flow
- [ ] **Validation**: API generates downloadable PDFs

**Dependencies**: 6.1 (PDF Generation Service)
**Parallel Work**: Can work on UI

### 6.3 PDF Export UI
- [ ] Add "Export PDF" button to resume detail view
- [ ] Implement PDF download functionality
- [ ] Show PDF preview in browser (iframe or viewer)
- [ ] Add PDF generation loading state
- [ ] Handle PDF generation errors
- [ ] Add print-friendly CSS for web view
- [ ] **Validation**: User can download PDF resumes

**Dependencies**: 6.2 (PDF Export Backend)
**Parallel Work**: Can start cover letter work

## Phase 7: Cover Letter Generation (Week 10)

### 7.1 Cover Letter Agent
- [ ] Create coverLetterAgent function
- [ ] Implement cover letter prompt template
- [ ] Generate personalized cover letter content
- [ ] Adapt tone to company culture (from job description)
- [ ] Structure letter (intro, body, conclusion)
- [ ] Optimize for relevance and authenticity
- [ ] **Validation**: Agent generates coherent cover letters

**Dependencies**: 4.7 (Workflow Integration)
**Parallel Work**: None

### 7.2 Cover Letter Backend Integration
- [ ] Add cover letter option to resume generation
- [ ] Update ResumeGenerationState to include cover letter
- [ ] Modify workflow to conditionally call cover letter agent
- [ ] Store cover letter with resume in database
- [ ] Add cover letter to API responses
- [ ] **Validation**: Cover letters generated and stored

**Dependencies**: 7.1 (Cover Letter Agent)
**Parallel Work**: Can work on UI

### 7.3 Cover Letter UI
- [ ] Add "Generate Cover Letter" toggle to generation form
- [ ] Display cover letter in resume detail view
- [ ] Add cover letter to PDF export (optional separate file)
- [ ] Allow cover letter-only generation
- [ ] Add edit/copy cover letter text
- [ ] **Validation**: User can generate and view cover letters

**Dependencies**: 7.2 (Backend Integration)
**Parallel Work**: Can start testing phase

## Phase 8: Testing, Polish & Documentation (Week 11)

### 8.1 Testing
- [ ] Write unit tests for repository layer
- [ ] Write unit tests for service layer
- [ ] Write unit tests for AI agents
- [ ] Write integration tests for API routes
- [ ] Write E2E tests for critical flows
- [ ] Test error scenarios and edge cases
- [ ] Test with different API key states
- [ ] Load test resume generation
- [ ] **Validation**: All tests pass, coverage >70%

**Dependencies**: All previous phases
**Parallel Work**: Can work on documentation

### 8.2 Error Handling & UX Polish
- [ ] Add comprehensive error messages
- [ ] Implement toast notifications for user feedback
- [ ] Add form validation error states
- [ ] Improve loading states and spinners
- [ ] Add empty states for pages
- [ ] Implement confirmation dialogs for destructive actions
- [ ] Add keyboard navigation support
- [ ] **Validation**: App handles errors gracefully, UX is smooth

**Dependencies**: All previous phases
**Parallel Work**: Can work on documentation

### 8.3 Performance Optimization
- [ ] Add database query indexes
- [ ] Implement caching for user profiles
- [ ] Optimize API route response times
- [ ] Add request rate limiting
- [ ] Optimize bundle size (code splitting)
- [ ] Add image optimization
- [ ] **Validation**: Pages load <2s, generation completes <30s

**Dependencies**: All previous phases
**Parallel Work**: Can work on documentation

### 8.4 Documentation
- [ ] Write README with setup instructions
- [ ] Document API endpoints (OpenAPI/Swagger)
- [ ] Create user guide for profile creation
- [ ] Document AI provider setup process
- [ ] Write deployment guide
- [ ] Add inline code comments
- [ ] Create troubleshooting guide
- [ ] **Validation**: New developer can set up project from README

**Dependencies**: None (ongoing throughout)
**Parallel Work**: Can be done throughout development

### 8.5 PDF Template System
- [ ] Add ResumeTemplate model to Prisma schema
- [ ] Create template JSON schema definition
- [ ] Seed database with 5 default templates (Professional, Modern, Creative, ATS-Optimized, Minimal)
- [ ] Create template repository for CRUD operations
- [ ] Create API route: `GET /api/templates` (list all templates)
- [ ] Create API route: `GET /api/templates/:id` (get template details)
- [ ] Update GeneratedResume model with templateId and templateCustomization fields
- [ ] **Validation**: Templates can be fetched from API and have valid structure

**Dependencies**: 6.3 (PDF Generation)
**Parallel Work**: Can design template UI while building backend

### 8.6 Template Selection & Preview UI
- [ ] Create template gallery page (`/app/templates/page.tsx`)
- [ ] Build TemplateCard component with preview image
- [ ] Add template filtering by category
- [ ] Create TemplatePreview modal with live preview
- [ ] Implement template selection on resume generation page
- [ ] Add "Change Template" functionality on resume detail page
- [ ] Update resume generation flow to include template selection
- [ ] **Validation**: User can browse, preview, and select templates

**Dependencies**: 8.5 (Template System)
**Parallel Work**: None

### 8.7 Template Customization
- [ ] Create TemplateCustomizer component
- [ ] Add color picker for primary/accent colors
- [ ] Add font family selector (5-7 ATS-safe fonts)
- [ ] Add font size controls (with safe ranges)
- [ ] Add margin/spacing controls
- [ ] Implement real-time preview of customizations
- [ ] Create API route: `PATCH /api/resumes/:id/template-customization`
- [ ] Store customizations in database
- [ ] Apply customizations during PDF generation
- [ ] **Validation**: User can customize template appearance and see changes in preview

**Dependencies**: 8.6 (Template UI)
**Parallel Work**: None

### 8.8 Resume Content Editing
- [ ] Create ResumeEditor component with inline editing
- [ ] Add section editors (Summary, Experience, Education, Skills)
- [ ] Implement drag-and-drop section reordering
- [ ] Add entry-level editing within sections
- [ ] Create "Add Section" functionality for custom sections
- [ ] Create "Remove Section" functionality
- [ ] Implement real-time PDF preview during editing
- [ ] Add "Revert to AI Version" button
- [ ] Update API route: `PATCH /api/resumes/:id/content`
- [ ] **Validation**: User can edit resume content and see changes immediately

**Dependencies**: 6.3 (PDF Generation)
**Parallel Work**: Can work on template customization simultaneously

### 8.9 Resume Version Control
- [ ] Add version history storage to database
- [ ] Track AI-generated vs. user-edited versions
- [ ] Create version history UI component
- [ ] Implement "Restore Previous Version" functionality
- [ ] Add "Duplicate Resume" feature
- [ ] Create API route: `POST /api/resumes/:id/duplicate`
- [ ] Create API route: `GET /api/resumes/:id/versions`
- [ ] Create API route: `POST /api/resumes/:id/restore/:versionId`
- [ ] **Validation**: User can view version history and restore previous versions

**Dependencies**: 8.8 (Resume Editing)
**Parallel Work**: None

### 8.10 Template Creation (Admin)
- [ ] Create admin template creator page (`/app/admin/templates/new`)
- [ ] Build template JSON editor with validation
- [ ] Add template preview generator
- [ ] Implement template upload/save functionality
- [ ] Create API route: `POST /api/admin/templates`
- [ ] Create API route: `PUT /api/admin/templates/:id`
- [ ] Add ATS compatibility testing utility
- [ ] **Validation**: Admin can create and publish new templates

**Dependencies**: 8.7 (Template Customization)
**Parallel Work**: Optional for MVP, can be added post-launch

### 8.11 Security Audit
- [ ] Review authentication implementation
- [ ] Audit API key storage and encryption
- [ ] Check for SQL injection vulnerabilities
- [ ] Validate input sanitization
- [ ] Review session management
- [ ] Check for XSS vulnerabilities
- [ ] Audit environment variable usage
- [ ] **Validation**: No critical security issues found

**Dependencies**: All previous phases
**Parallel Work**: None

### 8.12 Deployment Preparation
- [ ] Set up production database (Vercel Postgres/Neon)
- [ ] Configure environment variables for production
- [ ] Set up Vercel project
- [ ] Configure domain and SSL
- [ ] Set up monitoring and logging
- [ ] Create database backup strategy
- [ ] Test production deployment
- [ ] **Validation**: App runs successfully in production

**Dependencies**: 8.11 (Security Audit)
**Parallel Work**: None

## Summary

- **Total Tasks**: ~170 tasks
- **Estimated Duration**: 13 weeks
- **Critical Path**: Auth → Profile → AI Integration → PDF Export → Templates & Editing
- **Parallel Opportunities**: UI and backend can often progress simultaneously; template customization and content editing can be developed in parallel
- **Key Milestones**:
  - Week 2: Users can register and login
  - Week 4: Users can create and manage profiles
  - Week 7: AI generates tailored resumes
  - Week 9: Resumes exportable as PDFs
  - Week 10: Cover letter generation works
  - Week 11: Template system operational
  - Week 12: Resume editing and version control works
  - Week 13: Production-ready application

## Risk Mitigation

### High-Risk Areas
1. **LangGraph Complexity**: Break into small testable agents, iterate
2. **AI Token Costs**: Implement usage tracking, test with small examples
3. **PDF Generation**: Test early with various content lengths
4. **API Key Security**: Use proven encryption library, audit thoroughly
5. **Template Compatibility**: Test templates extensively with ATS systems
6. **Editing Performance**: Optimize real-time preview rendering

### Contingency Plans
- If LangGraph too complex: Fall back to simpler prompt chain
- If PDF generation issues: Use alternative library (pdf-lib)
- If performance problems: Add job queue for async processing
- If AI costs too high: Optimize prompts, use cheaper models for some tasks
- If template complexity grows: Start with 3 basic templates, expand later
- If editing preview is slow: Use debouncing and incremental updates

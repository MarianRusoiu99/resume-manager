# AI Generation System Revamp Plan

## Overview

This document outlines the plan for revamping the AI generation system to create a unified, industry-standard conversational AI architecture.

## Use Cases

1. **Structured Generation** - Generate resumes/cover letters from job descriptions (form-based input → structured JSON output)
2. **Document-Aware Enhancement** - Chat-like interface where users can upload documents, reference them, and get contextual edits to resume/cover letter content
3. **Template Generation & Enhancement** - Create/modify templates from images/documents with a conversational interface

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED AI CHAT SYSTEM                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐   │
│   │ Resume Gen  │    │ Cover Letter│    │ Template Gen/Enhance        │   │
│   │ Form        │    │ Form        │    │ Image + Chat                │   │
│   └──────┬──────┘    └──────┬──────┘    └─────────────┬───────────────┘   │
│          │                  │                         │                    │
│          └──────────────────┴─────────────────────────┘                    │
│                              │                                              │
│                              ▼                                              │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                    CONVERSATION MANAGER                             │   │
│   │   - Maintains message history per session                           │   │
│   │   - Manages attached documents/images                               │   │
│   │   - Selects appropriate "mode" (resume, cover-letter, template)     │   │
│   │   - Handles streaming responses                                     │   │
│   └─────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                    AI ORCHESTRATOR                                  │   │
│   │   - Builds system prompt based on mode + context                    │   │
│   │   - Injects document context from attached files                    │   │
│   │   - Registers available tools for function calling                  │   │
│   │   - Manages structured output with Zod schemas                      │   │
│   └─────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                    TOOL REGISTRY                                    │   │
│   │   ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐      │   │
│   │   │ validate_     │  │ extract_from_│  │ generate_section   │      │   │
│   │   │ resume        │  │ document     │  │ (work/edu/skills)  │      │   │
│   │   └───────────────┘  └──────────────┘  └────────────────────┘      │   │
│   │   ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐      │   │
│   │   │ render_       │  │ analyze_     │  │ format_dates       │      │   │
│   │   │ template      │  │ job_posting  │  │                    │      │   │
│   │   └───────────────┘  └──────────────┘  └────────────────────┘      │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                    AI PROVIDER (Vercel AI SDK)                      │   │
│   │   - OpenAI / Anthropic / Google                                     │   │
│   │   - Streaming with tool calls                                       │   │
│   │   - Structured output (object mode)                                 │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
lib/ai/
├── chat/                           # Unified chat system
│   ├── conversation.ts             # ConversationManager class
│   ├── orchestrator.ts             # AIOrchestrator - builds prompts, calls AI
│   ├── message.ts                  # Message types and utilities
│   ├── context.ts                  # Context building (documents, history)
│   └── index.ts
│
├── modes/                          # Mode definitions (replace "agents")
│   ├── types.ts                    # Mode interface, base types
│   ├── resume-generation.mode.ts   # Resume generation mode
│   ├── resume-enhancement.mode.ts  # Resume enhancement mode
│   ├── cover-letter.mode.ts        # Cover letter generation mode
│   ├── template-generation.mode.ts # Template from image mode
│   ├── template-enhancement.mode.ts# Template chat enhancement mode
│   └── index.ts
│
├── tools/                          # AI function calling tools
│   ├── types.ts                    # Tool interface
│   ├── registry.ts                 # Tool registry
│   ├── validate-resume.tool.ts     # Validates JSON Resume against schema
│   ├── extract-document.tool.ts    # Extracts structured data from documents
│   ├── analyze-job.tool.ts         # Parses job description into structured format
│   ├── render-template.tool.ts     # Renders template preview
│   └── index.ts
│
├── documents/                      # Document processing
│   ├── processor.ts                # Unified document processor
│   ├── parsers/
│   │   ├── pdf.parser.ts           # PDF to text
│   │   ├── docx.parser.ts          # DOCX to text
│   │   ├── image.parser.ts         # Image to base64 + OCR if needed
│   │   └── index.ts
│   └── index.ts
│
├── schemas/                        # Output schemas
│   ├── resume.schema.ts            # JSON Resume output schema
│   ├── cover-letter.schema.ts      # Cover letter output schema
│   ├── template.schema.ts          # Template output schema
│   ├── job-analysis.schema.ts      # Parsed job description schema
│   └── index.ts
│
├── prompts/                        # Prompt management
│   ├── system/
│   │   ├── base.ts                 # Core principles (truthfulness, etc.)
│   │   ├── resume-expert.ts        # Resume writing expertise
│   │   ├── cover-letter-expert.ts  # Cover letter expertise
│   │   ├── template-expert.ts      # HTML/CSS template expertise
│   │   └── index.ts
│   ├── instructions/
│   │   ├── json-resume-format.ts   # JSON Resume format instructions
│   │   ├── ats-optimization.ts     # ATS guidelines
│   │   ├── handlebars-syntax.ts    # Template syntax
│   │   └── index.ts
│   └── index.ts
│
├── providers/                      # KEEP: Current providers (minimal changes)
├── runtime/                        # KEEP: Model resolution (minimal changes)
├── pricing/                        # KEEP: Pricing logic
│
└── index.ts                        # Main exports
```

## Key Decisions

1. **Conversation Persistence**: Session-only for now (in-memory)
2. **Template Generation**: Both approaches:
   - Single-shot for direct import from image/PDF
   - Conversational with history for enhancement modal
3. **Frontend**: Keep existing UI, refactor backend code
4. **Document Parsing**: Server-side processing before sending to LLM

## Modes

### resume-generation
- Input: Job description + user profile
- Output: Optimized resume in JSON Resume format
- Tools: validate_resume, analyze_job

### resume-enhancement
- Input: Existing resume + user instructions + optional documents
- Output: Enhanced resume in JSON Resume format
- Features: Conversation history, undo support
- Tools: validate_resume, extract_document

### cover-letter-generation
- Input: Job description + user profile + optional resume
- Output: Cover letter content
- Tools: analyze_job

### template-generation
- Input: Image/document of template
- Output: HTML + CSS template
- Mode: Single-shot extraction

### template-enhancement
- Input: Existing template + user instructions + optional reference images
- Output: Enhanced HTML + CSS
- Features: Conversation history, visual preview
- Tools: render_template

## Implementation Phases

### Phase 1: Core Infrastructure
- ConversationManager and message types
- AI Orchestrator with streaming
- Mode system with base interface
- Tool registry and core tools
- Document processor

### Phase 2: Modes Implementation
- Resume generation mode
- Resume enhancement mode
- Cover letter generation mode
- Template generation mode
- Template enhancement mode

### Phase 3: API & Frontend Integration
- New /api/v1/ai/chat endpoint
- Frontend hooks (useConversation, useAIStream)
- Refactor existing modals
- Update generation pages

### Phase 4: Cleanup
- Remove old implementation
- Testing
- Documentation

## Notes

- All outputs must conform to JSON Resume schema for consistency
- Streaming is essential for good UX
- Tool calling enables structured operations (validation, extraction)
- Document context is injected into conversation, not processed by LLM directly for PDFs

# Resume Manager Restructure Plan (Schema-First + Modular)

## Goal
Restructure the app around JSON Resume as the canonical contract, while reducing frontend monolith complexity and clarifying Next.js backend boundaries.

## Current Issues
- Chat orchestration and artifact UX are centralized in a large UI module.
- Domain validation is split between permissive and strict flows with inconsistent entrypoints.
- Server actions include orchestration concerns that should sit in domain use-cases.
- Legacy paths from pre-chat-first architecture are still present and increase cognitive load.

## Target Architecture

### 1) Canonical Data Contract
- JSON Resume is the single canonical data shape for:
  - profile editing
  - resume persistence
  - AI generation output
  - template rendering input
- Validation modes:
  - strict: all write/save/generate boundaries
  - lenient: import/parse helpers where needed, followed by normalization

### 2) Vertical Domain Slices
- `domains/profile`
- `domains/resume`
- `domains/cover-letter`
- `domains/template`
- `domains/chat`
- `domains/job` (future-ready only)

### 3) Next.js Boundary Rules
- Route Handlers: stable HTTP boundaries, streaming, integrations
- Server Actions: page-local mutations only
- Services/Repositories: domain use-cases + persistence

### 4) Frontend Composition
Decompose chat page into feature modules:
- session state + persistence
- composer controls
- artifact references
- message stream renderer
- artifact output cards
- save/view commands per artifact type

## Phased Implementation

### Phase 0 — Contracts and ADRs
- Add architecture docs and slice boundaries.
- Freeze new features that bypass canonical schema contract.

### Phase 1 — Canonical JSON Resume Contract
- Add a single validation contract entrypoint with strict/lenient modes.
- Migrate write paths to strict validation at boundary.

### Phase 2 — Backend Use-Case Cleanup
- Move orchestration from actions into use-case services.
- Keep actions thin wrappers.

### Phase 3 — API Boundary Stabilization
- Promote domain APIs to route handlers where durable contracts are needed.
- Keep server actions for local component mutations.

### Phase 4 — Frontend Modularization
- Break FullPageChat into composable feature modules.
- Replace duplicated preview/save logic with artifact command handlers.

### Phase 5 — Identity Cleanup
- Remove dead generate components and old modal paths after parity checks.
- Explicitly separate assistant mode from workspace mode.

### Phase 6 — Job Foundation (No apply implementation yet)
- Add only future-ready contracts/entities for job targets and application drafts.

## Definition of Done
- All profile/resume write boundaries validate via canonical strict parser.
- Chat module split into composable units (no mega component ownership).
- Actions are thin; orchestration lives in use-cases.
- Legacy duplicate flows removed.
- Tests and typecheck pass for touched domains.

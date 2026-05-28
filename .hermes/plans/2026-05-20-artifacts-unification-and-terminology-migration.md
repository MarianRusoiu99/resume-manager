# Artifacts Unification + Terminology Migration Master Checklist

Goal
- Unify generated outputs (generated resumes, cover letters, templates) under one /artifacts route with tabs.
- Rename user-facing terminology:
  - Profile(s) -> Resume(s) (source resumes)
  - Resume(s) [generated outputs] -> Generated Artifact(s)
- Add template-assisted generation visual preview for Handlebars output.
- Remove obsolete resume-generation output fields (jobTitle, companyName, matchScore, suggestions).
- Improve FullPageChat session history UX (collapsible) and persistence reliability.

Scope and sequencing
1) Routing + navigation foundation (safe)
2) Artifacts page with tabs (safe)
3) Backward-compat redirects from legacy list routes (safe)
4) AI output contract cleanup (medium)
5) FullPageChat template preview + history UX/persistence hardening (medium)
6) Terminology migration (user-facing first, internal symbol refactor later)

---

## Phase 1: Routing + Nav Foundation

- [ ] Add routes in lib/constants/routes.ts
  - ARTIFACTS: '/artifacts'
  - ARTIFACTS_GENERATED: '/artifacts?tab=generated-resumes'
  - ARTIFACTS_COVER_LETTERS: '/artifacts?tab=cover-letters'
  - ARTIFACTS_TEMPLATES: '/artifacts?tab=templates'
  - Keep existing legacy constants for compatibility during migration.

- [ ] Update sidebar nav in lib/constants/nav-config.ts
  - Replace separate Resumes/Cover Letters/Templates entries with single Artifacts entry.
  - Rename Profile to Resumes (source resumes).

- [ ] Keep route config entries needed for breadcrumbs/details (resume detail/edit etc.).

Verification
- [ ] App starts with updated nav.
- [ ] Sidebar shows Resumes + Artifacts entries.

---

## Phase 2: Build Unified /artifacts Page

- [ ] Create app/(authenticated)/artifacts/page.tsx
  - Server component reading searchParams.tab.
  - Renders Tabs UI with values:
    - generated-resumes
    - cover-letters
    - templates

- [ ] Fetch data in page server component:
  - generated resumes via getResumes()
  - cover letters via getCoverLetters()
  - templates via templateRepository.findAllPublic() + getSession for admin actions

- [ ] Reuse existing list/gallery components:
  - ResumeListClient
  - CoverLetterListClient
  - TemplateGallery

- [ ] Set page title/description to artifact-centric language.

Verification
- [ ] /artifacts loads and each tab renders expected content.
- [ ] Search param tab switching works without full refreshes.

---

## Phase 3: Legacy Route Compatibility

- [ ] Convert these pages into redirect shims:
  - app/(authenticated)/resumes/page.tsx -> /artifacts?tab=generated-resumes
  - app/(authenticated)/cover-letters/page.tsx -> /artifacts?tab=cover-letters
  - app/(authenticated)/templates/page.tsx -> /artifacts?tab=templates

- [ ] Update loading/error copy for old pages or keep minimal while redirecting.

Verification
- [ ] Legacy URLs forward to /artifacts tabs.
- [ ] Existing bookmarks continue working.

---

## Phase 4: Resume-Generation Output Contract Cleanup

- [ ] Update schema in lib/ai/schemas/index.ts
  - resumeGenerationOutputSchema -> only { resume }

- [ ] Update type in lib/ai/modes/types.ts
  - ResumeGenerationOutput -> only resume

- [ ] Update prompt/mode instructions:
  - lib/ai/modes/resume-generation.mode.ts
  - lib/ai/prompts/index.ts
  - lib/ai/agents/resume-optimization/prompt.ts
  - Remove required JSON fields jobTitle/companyName from output contract.

- [ ] Update API chat save logic in app/api/v1/ai/chat/route.ts
  - Stop reading matchScore/suggestions/job/company from output.
  - Derive fallback metadata server-side where still needed for persistence.

- [ ] Update hooks/UI that consume removed fields:
  - modules/ai-enhance/hooks/useResumeGeneration.ts
  - app/(authenticated)/generate/components/useResumeFlow.ts
  - app/(authenticated)/generate/components/ResumeGenerator.tsx

Verification
- [ ] Resume generation still works and auto-saves.
- [ ] No TS references to removed fields remain.

---

## Phase 5: FullPageChat Improvements

- [ ] Template visual preview in chat:
  - modules/chat-panel/components/FullPageChat.tsx
  - For template outputs, render preview from htmlTemplate instead of raw-only JSON.
  - Keep raw code as collapsible section.

- [ ] Session history collapsible UX:
  - Add open/closed state persisted in localStorage.
  - Mobile-friendly toggle/sheet behavior.

- [ ] Persistence hardening:
  - Add hydration guard before saving.
  - Validate parsed history/active structures.
  - Improve resilience against malformed localStorage state.

Verification
- [ ] Template mode shows visual preview reliably.
- [ ] Session history collapses/expands and state persists across refresh.
- [ ] Sessions/messages persist across refresh and tab switches.

---

## Phase 6: Terminology Migration (User-facing first)

User-facing copy rename
- [ ] "Profile"/"Profiles" -> "Resume"/"Resumes" for source resume entities.
- [ ] Generated "Resumes" list copy -> "Generated Artifacts" (or "Artifacts" where concise).

Targets
- [ ] Page titles/descriptions
- [ ] Sidebar labels
- [ ] Empty states/buttons/tooltips
- [ ] Breadcrumb labels

Deferred (follow-up epic)
- Internal symbol renaming across codebase (modules/profile, repositories/services/types) is intentionally deferred to reduce risk.
- Database model/table renaming is deferred; keep Prisma models as-is for now.

Verification
- [ ] UX terminology aligns with new model across primary pages.

---

## QA Matrix

Core journeys
- [ ] Generate resume -> saved artifact -> visible in Artifacts tab.
- [ ] Generate cover letter -> saved artifact -> visible in Artifacts tab.
- [ ] Generate template -> visual preview appears in chat -> artifact view opens.
- [ ] Session history create/switch/delete/persist works.

Regression
- [ ] Resume detail page and editor still functional.
- [ ] Cover letter detail page still functional.
- [ ] Template editor flow still functional.

Validation commands
- [ ] pnpm typecheck
- [ ] pnpm test (targeted suites first, then broader if stable)

---

## Rollout Strategy

Commit slicing
1) routes/constants/nav + /artifacts page
2) legacy route redirects
3) contract cleanup and generate UI cleanup
4) FullPageChat preview + history fixes
5) terminology copy pass
6) tests and final polish

Fallback
- Keep legacy route constants and redirect shims until all callers migrated.
- Keep compatibility aliases for renamed labels where necessary.

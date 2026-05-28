# Reliable Artifact References + Template Preview Stabilization Plan

> For Hermes: execute in small PR-sized commits; validate each phase with targeted lint/type checks and browser-level manual checks.

Goal
- Make artifact references first-class and durable (not a fragile text tag).
- Make template generation reliably render HTML preview every time on /generate.
- Unify behavior across resume/cover-letter/template chats with mode-safe context binding.
- Improve layout clarity for reference state + output rendering.

Architecture (target)
- Introduce a typed `artifactRef` object in conversation context and API schema, instead of ad-hoc partial context patches.
- Resolve artifactRef server-side into canonical context (resume/template/cover letter content) before orchestration.
- Split template output rendering path into a dedicated `TemplateOutputCard` parser/renderer that accepts structured output or parseable JSON strings.
- Persist per-session selected artifactRef in localStorage alongside session state, scoped by mode + session id.

Non-goals
- Full DB migration/renaming of Profile/Resume Prisma models.
- Replacing conversation store backend.

---

## Phase 0: Root-cause fixes and guardrails

Objective
- Lock in immediate reliability guarantees before larger refactors.

Files
- Modify: `modules/chat-panel/components/FullPageChat.tsx`
- Modify: `app/(authenticated)/generate/page.tsx`

Steps
1) Ensure template mode routing defaults correctly:
- `tab=template` => defaultType `template`.

2) Remove mode-coupling checks that block preview:
- Preview detection should not require only one shape (`message.output.htmlTemplate`).
- Parse in order: structured output field, JSON string in output, JSON string in content.

3) Add explicit fallback state when template parse fails:
- Render message card with “Couldn’t parse template output” + retry preview button.

Validation
- Manual:
  - `/generate?tab=template` starts in template mode.
  - First template response renders iframe preview if htmlTemplate exists.
  - If malformed JSON, clear fallback appears (not silent raw blob only).

---

## Phase 1: First-class artifact references (contract + transport)

Objective
- Replace “tag-like” behavior with typed artifact references understood end-to-end.

Files
- Modify: `modules/ai-enhance/hooks/use-conversation/types.ts`
- Modify: `modules/ai-enhance/hooks/use-conversation/index.ts`
- Modify: `app/api/v1/ai/chat/route.ts`
- Modify: `lib/ai/chat/context.ts`

Design
- Add type:
  - `ConversationArtifactRef = { kind: 'profile'|'resume'|'cover-letter'|'template'; id: string; label?: string }`
- Extend `ConversationContext` (frontend + backend) with:
  - `artifactRef?: ConversationArtifactRef`

Transport
- `sendMessage` payload should carry the selected `artifactRef` explicitly under `context.artifactRef`.
- Do not flatten into `currentResume/currentCoverLetter/template.name` at UI layer.

Server normalization
- `normalizeContext()` should accept and validate `artifactRef` with zod refinement.
- Keep backward compatibility: if old inline fields exist, preserve them but prioritize resolved artifactRef.

Validation
- Typecheck and lint touched files.
- Request payload snapshot confirms `context.artifactRef` sent.

---

## Phase 2: Server-side artifact resolution (the core reliability fix)

Objective
- Resolve referenced artifacts on the server per mode; bind real content into prompt context.

Files
- Modify: `app/api/v1/ai/chat/route.ts`
- Create: `lib/ai/chat/resolve-artifact-reference.ts`
- Potential modify/imports: `app/actions/profile.ts`, `app/actions/resume.ts`, `app/actions/cover-letter.ts`, `app/actions/template.ts` (only if service methods needed)

Resolver behavior
- Input: `{ userId, mode, artifactRef }`
- Output: `Partial<ConversationContext>` with hydrated content

Rules
1) `kind=profile`:
- Load profile by id, inject `userProfile.resume` and `userProfile.name`.
- Allowed for resume + cover-letter modes.

2) `kind=resume`:
- Load generated resume JSON, inject `currentResume`.
- Allowed for resume + cover-letter modes.

3) `kind=cover-letter`:
- Load content string, inject `currentCoverLetter`.
- Allowed for cover-letter mode; optional for resume as writing sample only if explicitly enabled.

4) `kind=template`:
- Load template html, inject `template.htmlTemplate` and `template.name`.
- Allowed for template mode.

Security
- Enforce ownership checks server-side before resolution.
- On mismatch/not found: return typed warning in response metadata; continue without binding (no hard crash).

Application order
- `normalizedContext` <- request
- `resolvedContext` <- artifact resolver
- `effectiveContext = merge(normalizedContext, resolvedContext)` with resolved fields taking precedence.

Validation
- Unit tests for resolver mapping and ownership failure paths.
- Manual API test: send artifactRef only; verify model receives hydrated context (debug logs or temporary trace flag).

---

## Phase 3: FullPageChat reference UX redesign (mode-safe and session-bound)

Objective
- Make reference selection explicit, mode-scoped, and persistent per session.

Files
- Modify: `modules/chat-panel/components/FullPageChat.tsx`
- Optional create: `modules/chat-panel/components/ArtifactReferencePicker.tsx`

Behavior
- Per `(generationType, activeSessionId)` store selected ref key.
- Persist under key:
  - `fullpage-chat:artifact-ref:v1:{mode}:{sessionId}`
- Reset ref only when user explicitly clears OR deletes session.
- On mode switch, show mode-compatible refs; keep each mode/session’s own selection.

UI polish
- Reference pill above composer with:
  - icon + label + “clear” action
- Picker grouped by artifact kind:
  - Resume Sources / Generated Resumes / Cover Letters / Templates
- Disabled placeholder while loading options.
- Empty state CTA when no artifacts available.

Validation
- Reload page: selected ref restored per session.
- Switch sessions: each session remembers its own selected ref.
- Switch tabs: no cross-mode leakage.

---

## Phase 4: Dedicated template output renderer

Objective
- Remove ambiguity in template message rendering and guarantee preview path.

Files
- Create: `modules/chat-panel/components/TemplateOutputCard.tsx`
- Modify: `modules/chat-panel/components/FullPageChat.tsx`

Component contract
- Inputs:
  - raw message output/content
  - parsed result status
  - render function (`renderTemplateServerSide`)
- Internal states:
  - `parsing | rendering | ready | failed`
- Features:
  - Preview/Code toggle
  - Parse diagnostics (small inline details)
  - Retry render button

Parser strategy
- Strict parser utility with typed result:
  - `{ ok: true, htmlTemplate, name?, description? }`
  - `{ ok: false, reason }`
- Accept:
  - structured object
  - JSON string
  - fenced JSON in text (optional resilient parser)

Validation
- Template responses display preview by default when valid.
- Malformed outputs produce actionable failure UI.

---

## Phase 5: Prompt + output reliability improvements for template mode

Objective
- Increase probability model returns valid structured template output.

Files
- Modify: `lib/ai/modes/template-generation.mode.ts`
- Modify: `lib/ai/modes/template-enhancement.mode.ts`
- Modify: `lib/ai/prompts/system/*` if needed

Changes
- Tighten system instruction:
  - “Return JSON object matching schema exactly; no markdown wrappers.”
- Add post-parse repair step (optional safe transform):
  - if raw text contains ```json ... ``` extract inner JSON before failing.
- Add output validation warnings surfaced to UI metadata.

Validation
- 10-run local smoke test on template mode with varied prompts; track parse success rate.
- Target >= 95% parseable outputs.

---

## Phase 6: Test matrix + observability

Objective
- Prevent regressions and make failures diagnosable.

Files
- Create/modify tests:
  - `lib/ai/chat/__tests__/resolve-artifact-reference.test.ts`
  - `app/api/v1/ai/chat/__tests__/normalize-context.test.ts`
  - `modules/chat-panel/components/__tests__/template-output-parser.test.ts`

Add instrumentation
- Structured logs for:
  - artifactRef received
  - artifact resolution success/failure reason
  - template parse result status

Manual QA matrix
1) Resume mode + profile ref => generated resume uses referenced profile.
2) Cover-letter mode + resume ref => output aligns with referenced resume.
3) Template mode + template ref => enhancement uses referenced template HTML.
4) Session reload => reference preserved per session.
5) Session switch => references isolated.
6) Template malformed output => graceful failure card.

---

## Rollout strategy

1) Feature flag: `ENABLE_ARTIFACT_REF_RESOLUTION_V1`
- On: new server resolver path.
- Off: legacy context-only behavior.

2) Deploy sequence
- Ship parser/UI resilience first (safe).
- Then ship typed artifactRef transport.
- Then enable server resolver behind flag for internal testing.
- Finally enable by default after QA pass.

3) Backward compatibility
- Keep old context fields accepted in `normalizeContext` during transition.
- Remove legacy path only after 1 stable release cycle.

---

## Concrete task breakdown (small steps)

Task 1
- Add `ConversationArtifactRef` type and `context.artifactRef` in frontend hook types.
- Verify compile.

Task 2
- Extend API request schema/normalizeContext to parse artifactRef.
- Add zod validation.

Task 3
- Implement `resolve-artifact-reference.ts` with per-kind loaders and ownership checks.

Task 4
- Wire resolver into API route to produce `effectiveContext`.

Task 5
- Refactor FullPageChat state: selected ref keyed by session+mode (not global).

Task 6
- Extract `TemplateOutputCard` and strict parser utility.

Task 7
- Replace inline template render block in FullPageChat with new component.

Task 8
- Add prompt hardening and optional fenced-json extractor.

Task 9
- Add tests (resolver + parser + normalize context).

Task 10
- Run lint + targeted typecheck + manual matrix and document outcomes.

---

## Verification commands

- `npx eslint 'modules/chat-panel/components/FullPageChat.tsx' 'modules/chat-panel/components/TemplateOutputCard.tsx' 'modules/ai-enhance/hooks/use-conversation/index.ts' 'modules/ai-enhance/hooks/use-conversation/types.ts' 'app/api/v1/ai/chat/route.ts' 'lib/ai/chat/resolve-artifact-reference.ts'`
- `npx tsc -p tsconfig.json --noEmit`

Manual
- Open `/generate?tab=template`
- Select template reference
- Send enhancement prompt
- Confirm assistant output renders preview iframe + code toggle
- Refresh page + switch session and verify preserved ref per session

---

## Risks and mitigations

Risk: additional server lookups increase latency
- Mitigation: resolve only when artifactRef present; add lightweight cache by conversation id + ref id.

Risk: ownership mismatches break generation
- Mitigation: soft-fail resolution with warning and continue generation.

Risk: parser still misses edge formats
- Mitigation: strict typed parser + fallback extraction for fenced JSON.

---

## Success criteria

- Artifact reference is not a loose tag: it is typed, persisted, mode-safe, and server-resolved.
- Template generation in /generate defaults to preview path when htmlTemplate exists.
- Template parse/render failure is visible and recoverable.
- Session behavior is deterministic: per-session refs persist and do not leak across modes.
- No regression on resume/cover-letter generation flows.

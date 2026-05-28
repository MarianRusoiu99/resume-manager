# Plan: Refactor AI Generation Agent for Resilience, Consistency & Code Quality

## Goal

Refactor the `/generate` page's FullPageChat component and its supporting hooks to be:
1. **Resilient** -- sessions persist correctly, save operations are reliable, streaming doesn't break on edge cases
2. **Consistent** -- all three generation types (resume, cover-letter, template) share the same UI patterns, logic flow, and visual treatment; template tab is the reference behavior
3. **Simple & reusable** -- extract per-type preview/render logic into focused components instead of a 1735-line monolith
4. **Observable** -- AI thinking tokens and intermediate output are surfaced in the chat before the final result

## Current Context

### Architecture (as-is)

```
app/(authenticated)/generate/page.tsx
  └── FullPageChat (modules/chat-panel/components/FullPageChat.tsx)  [1735 lines]
        ├── Session management (history sidebar, localStorage)
        ├── Type switching (resume | cover-letter | template)
        ├── Artifact/reference loading (profiles, resumes, templates)
        ├── useConversation hook (streaming + persistence)
        ├── Per-type preview rendering (inline JSX for all 3 types)
        ├── Per-type save handlers
        └── ChatInput

Old path (still exists but page.tsx now delegates to FullPageChat):
  app/(authenticated)/generate/components/
    ├── ResumeGenerator.tsx        (old card-based UI)
    ├── CoverLetterGenerator.tsx    (old card-based UI)
    ├── useResumeFlow.ts            (old flow hook)
    ├── useCoverLetterFlow.ts       (old flow hook)
    └── GenerateContent.tsx         (old tabs wrapper)

Hooks layer:
  modules/ai-enhance/hooks/
    ├── use-conversation/index.ts   (core: sendMessage, streaming, localStorage persistence)
    ├── use-conversation/types.ts   (ConversationState, SendMessageOptions, etc.)
    ├── useAITask.ts                (thin wrapper over useConversation for fire-and-forget tasks)
    ├── useResumeGeneration.ts      (old: wraps useAITask for resume-generation mode)
    └── useCoverLetterGeneration.ts (old: wraps useAITask for cover-letter-generation mode)

Server:
  app/api/v1/ai/chat/route.ts      (POST handler, streaming SSE, resolves model)
  lib/ai/chat/orchestrator.ts       (streamGenerate: structured streaming via Vercel AI SDK)
```

### Key problems

| Problem | Details |
|---------|---------|
| **1735-line monolith** | FullPageChat is a single component with ~25 useState hooks, 15 useEffects, and all rendering for 3 types inline |
| **Inconsistent per-type behavior** | Template tab has Preview/Code toggle + Save in header; Resume has a different save flow; Cover-letter has yet another |
| **Session fragility** | Sessions stored in localStorage with manual serialization; conversation state keyed by `fullpage-chat:${mode}:${sessionId}` but session switching doesn't always clear old state cleanly |
| **Dead code** | Old `GenerateContent.tsx`, `ResumeGenerator.tsx`, `CoverLetterGenerator.tsx`, `useResumeFlow.ts`, `useCoverLetterFlow.ts` still exist but `page.tsx` only renders `FullPageChat` |
| **No thinking output** | AI orchestrator streams only `delta` and `complete` chunks; no `thinking` chunk type exists; reasoning tokens are discarded |
| **Save is ad-hoc** | Each type has its own save handler with subtly different patterns (template: `createTemplate`, resume: `saveGeneratedResume`, cover-letter: `createCoverLetter`) |
| **Extractors are fragile** | `extractResumeData`, `extractCoverLetterOutput`, `extractTemplateHtml` are free functions that guess at the output shape via duck-typing |

## Proposed Approach

Break FullPageChat into a **shell** + **type-specific slot components**, unify the save/render contracts, and add thinking token support through the streaming pipeline.

### Guiding principles
- Template tab behavior is the UI reference: header bar with type-specific actions (Preview/Code/Save), inline preview, no floating bottom banner
- One hook per concern (sessions, artifacts, previews, saves) -- no god-hooks
- All three types go through the same render pipeline: text bubble → output card with header actions → preview area
- Streaming must handle: `delta`, `text`, `reasoning`, `complete`, `error`
- Dead code gets deleted, not commented out

---

## Step-by-step Plan

### Phase 1: Foundation -- Thinking Token Support (model-aware)

The Vercel AI SDK v5.0.93 already supports reasoning tokens natively. The key insight is that **reasoning availability depends on the selected model and provider**, so the implementation must be opt-in per provider and gracefully degrade.

**Provider reasoning support matrix:**

| Provider | Models with reasoning | SDK option | Stream event |
|----------|----------------------|------------|-------------|
| **OpenAI** | `o1`, `o3`, `o3-mini`, `gpt-5` family | `reasoningEffort` in providerOptions | `reasoning-delta` in fullStream |
| **Anthropic** | Claude 3.7+ (sonnet-4, opus-4, etc.) | `thinking: { type: 'enabled', budgetTokens: N }` in providerOptions + `sendReasoning: true` | `reasoning-delta` in fullStream |
| **Google** | Gemini 2.5+ (flash, pro), Gemini 3 | `thinkingConfig: { thinkingBudget: N, includeThoughts: true }` in providerOptions | `reasoning-delta` in fullStream |

**Note:** `streamObject` (structured output) does NOT emit reasoning events in any provider. Only `streamText` does. Since resume/cover-letter generation currently uses `streamObject`, we need to decide: switch to `streamText` + parse output for thinking, or keep `streamObject` and only get thinking on template/text modes.

**Decision: Use `streamText` with `fullStream` for all generation modes when reasoning is desired.** Parse the structured output from the text response using the existing `parseOutput` utility. This gives us thinking tokens + text streaming in one pipeline.

**1.1 Add `thinking` and `reasoning` chunk types to StreamChunk union**

File: `lib/ai/chat/orchestrator/types.ts`
- Add:
  ```ts
  export interface StreamChunkReasoning {
    type: 'reasoning';
    text: string;
    timestamp: number;
  }
  ```
- Add `StreamChunkReasoning` to the `StreamChunk<T>` union

**1.2 Add reasoning capability flag to AIModel**

File: `lib/ai/providers/base.ts`
- Add `reasoning?: boolean` to `AIModel.capabilities`
- This gets populated by each provider's `fetchModels` when the model supports reasoning

File: `lib/ai/providers/openai.ts`
- In `mapOpenAIModel`, set `capabilities.reasoning = true` for models matching `o1`, `o3`, `gpt-5` patterns

File: `lib/ai/providers/anthropic.ts`
- In `mapAnthropicModel`, set `capabilities.reasoning = true` for models with `claude-3-7`+, `claude-sonnet-4`, `claude-opus-4`, etc.

File: `lib/ai/providers/google.ts`
- In `mapGoogleModel`, set `capabilities.reasoning = true` when the Google API response already includes `thinking: true` (the field exists in `GoogleModelResponse`) or for models matching `gemini-2.5`, `gemini-3`

**1.3 Emit reasoning chunks from the orchestrator**

File: `lib/ai/chat/orchestrator.ts`

Currently `streamGenerate` uses `streamObject` for structured output and `streamText` for text. Refactor to:

1. Always use `streamText` with `fullStream` when the model supports reasoning (check `ResolvedAIModel` capabilities or pass a flag from the API route)
2. Pass provider-specific reasoning options via `providerOptions`:
   - OpenAI: `{ providerOptions: { openai: { reasoningEffort: 'medium' } } }`
   - Anthropic: `{ providerOptions: { anthropic: { thinking: { type: 'enabled', budgetTokens: 8000 }, sendReasoning: true } } }`
   - Google: `{ providerOptions: { google: { thinkingConfig: { includeThoughts: true } } } }`
3. Iterate `fullStream` instead of `textStream`. Handle:
   - `reasoning-start` → initialize reasoning buffer
   - `reasoning-delta` → yield `{ type: 'reasoning', text: chunk.delta, timestamp }`
   - `reasoning-end` → finalize
   - `text-delta` → yield `{ type: 'text', text: chunk.text, timestamp }` (existing)
4. After stream completes, parse the final text through `parseOutput` for structured data
5. Fallback: if the model doesn't support reasoning, use existing `streamObject` path (no change needed)

The provider-specific reasoning options should be resolved alongside the model in `resolveAIModelOrThrow` and passed through `OrchestratorOptions`:

File: `lib/ai/runtime/types.ts`
- Add `providerOptions?: Record<string, unknown>` to `ResolvedAIModel` or pass reasoning config

File: `lib/ai/runtime/resolve-model.ts`
- After resolving the model, check `capabilities.reasoning` and build the appropriate `providerOptions`

**1.4 Handle reasoning chunks in the API route**

File: `app/api/v1/ai/chat/route.ts`
- The streaming loop already forwards all chunks via `JSON.stringify(chunk)`
- The new `reasoning` chunk type will be serialized as `data: {"type":"reasoning","text":"..."}\n\n`
- No code change needed if orchestrator yields the right shape

**1.5 Handle reasoning chunks in useConversation**

File: `modules/ai-enhance/hooks/use-conversation/types.ts`
- Add `thinking?: string` to `ConversationMessage` (accumulated reasoning text)

File: `modules/ai-enhance/hooks/use-conversation/index.ts`
- In `handleStreamResponse`, add a case for `data.type === 'reasoning'`
- Accumulate reasoning text on the assistant message's `thinking` field:
  ```ts
  setState(prev => ({
    ...prev,
    messages: prev.messages.map(msg =>
      msg.id === assistantMessageId
        ? { ...msg, thinking: (msg.thinking || '') + data.text }
        : msg
    ),
  }));
  ```

**1.6 Render reasoning in the chat bubble**

File: New component `modules/chat-panel/components/ReasoningBlock.tsx`
- Collapsible `<details>` element with "Thinking..." summary
- Muted text, small font, monospace for code-like reasoning
- Shows while streaming (state: 'streaming') and after completion (state: 'done')
- Only rendered when `message.thinking` is non-empty

**1.7 Include thinking in persistence**

File: `modules/ai-enhance/hooks/use-conversation/index.ts`
- The localStorage persistence already saves `messages` array, so `thinking` field will be persisted automatically
- No extra code needed

**Files changed:**
- `lib/ai/chat/orchestrator/types.ts` (add StreamChunkReasoning)
- `lib/ai/chat/orchestrator.ts` (use fullStream, yield reasoning chunks, pass providerOptions)
- `lib/ai/providers/base.ts` (add reasoning to capabilities)
- `lib/ai/providers/openai.ts` (mark reasoning-capable models)
- `lib/ai/providers/anthropic.ts` (mark reasoning-capable models)
- `lib/ai/providers/google.ts` (mark reasoning-capable models from API response)
- `lib/ai/runtime/types.ts` (add providerOptions/reasoning config to ResolvedAIModel)
- `lib/ai/runtime/resolve-model.ts` (build providerOptions based on model capabilities)
- `app/api/v1/ai/chat/route.ts` (pass providerOptions through, likely minimal change)
- `modules/ai-enhance/hooks/use-conversation/types.ts` (add thinking to ConversationMessage)
- `modules/ai-enhance/hooks/use-conversation/index.ts` (handle reasoning chunks)
- New: `modules/chat-panel/components/ReasoningBlock.tsx`

---

### Phase 1b: Adapt Preview Pipeline for streamText + Reasoning

Phase 1 switches modes with reasoning-capable models from `streamObject` to `streamText`. This changes the shape of data the client receives and how previews extract output. This phase bridges that gap.

**Current flow (structured modes like resume/cover-letter):**
```
Orchestrator → streamObject → partialObjectStream
  → yields { type: 'delta', partial: {...} } chunks
  → yields { type: 'complete', final: {...} }

Client (useConversation.handleStreamResponse):
  → delta → mergeDeep into state.output
  → complete → set message.output = final

FullPageChat:
  → useEffect watches messages, runs extractResumeData(message) / extractCoverLetterOutput(message)
  → These parse message.output (an object with .resume or .content)
  → Populates resumePreviewByMessage / coverLetterPreviewByMessage
  → JSX renders <ResumePreview> or <MarkdownPreview>
```

**New flow (with reasoning-capable model):**
```
Orchestrator → streamText + fullStream
  → yields { type: 'reasoning', text } chunks (thinking)
  → yields { type: 'text', text } chunks (visible content)
  → after stream completes: parseOutput(text, mode) → structured object
  → yields { type: 'complete', final: {...} }

Client (useConversation.handleStreamResponse):
  → reasoning → append to message.thinking (Phase 1.5)
  → text → append to message.content (NEW - currently text chunks are not handled)
  → complete → set message.output = final (same as before)

FullPageChat:
  → useEffect watches messages, runs extractors (same as before)
  → extractResumeData now receives message with:
     - message.content = accumulated raw text
     - message.output = parsed object from complete chunk (same shape as streamObject)
  → Previews work identically because message.output has the same structure
```

**1b.1 Handle `text` chunks in useConversation**

Currently `handleStreamResponse` only handles `delta`, `complete`, `saved`, `error`. The `text` chunk type from the orchestrator is not handled client-side. When we switch to `streamText` + `fullStream` for reasoning, the actual content also arrives as `text` chunks.

File: `modules/ai-enhance/hooks/use-conversation/index.ts`
- In `handleStreamResponse`, add handling for `data.type === 'text'`:
  ```ts
  if (data.type === 'text') {
    // Append text delta to assistant message content
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: (msg.content || '') + data.text }
          : msg
      ),
    }));
    return; // skip other handlers
  }
  ```
- This gives the user live streaming text in the chat bubble during generation
- When the `complete` chunk arrives with the parsed structured output, `message.output` gets set and the preview activates

**1b.2 Keep `streamObject` as fallback for non-reasoning models**

File: `lib/ai/chat/orchestrator.ts`

The refactored orchestrator logic should be:

```ts
// Pseudocode for streamGenerate:
const modelSupportsReasoning = options.providerOptions !== undefined;

if (mode.useStructuredOutput !== false && mode.outputSchema && !needsVision && !modelSupportsReasoning) {
  // EXISTING PATH: streamObject for structured output without reasoning
  // Yields: delta, complete (unchanged)
} else {
  // NEW PATH: streamText + fullStream (with or without reasoning)
  // Yields: reasoning (if model emits them), text, complete
}
```

This means:
- **Non-reasoning models** (e.g., `gpt-4o`, `claude-3-haiku`): still uses `streamObject`, client gets `delta` chunks, preview builds incrementally. No change.
- **Reasoning-capable models** (e.g., `o3`, `claude-sonnet-4`, `gemini-2.5-pro`): uses `streamText + fullStream`, client gets `reasoning` + `text` + `complete` chunks, preview activates on `complete`.

**1b.3 Adapt preview extractors for dual output paths**

File: `modules/chat-panel/utils/extract-output.ts` (new file from Phase 2.3, but changes needed here)

The existing extractors already handle both `message.output` (object) and `message.content` (stringified JSON or raw text):

- `extractResumeData`: checks `message.output` first (object with `.resume` or `.basics`), then falls back to parsing `message.output` as string, then `message.content`. **This already works** for the new flow because `complete` sets `message.output` to the parsed object.

- `extractCoverLetterOutput`: checks `message.output` first, then `message.content`. **Already works.**

- `extractTemplateHtml`: checks `message.output` for `.htmlTemplate`, then parses strings. **Already works** (templates already use `streamText`).

**No changes needed to extractors.** They already handle both data shapes correctly. The key insight is that `complete` always sets `message.output` to the parsed structured object regardless of whether `streamObject` or `streamText` was used.

**1b.4 Adapt preview timing for streamText path**

With `streamObject`, previews build incrementally as `delta` chunks arrive. With `streamText`, previews only activate when `complete` arrives with the final parsed output. This creates a visual gap where the user sees text streaming but no preview until completion.

Mitigation: During the text streaming phase, show a lightweight "Generating preview..." placeholder in the output card area. This replaces the old behavior where partial objects rendered an incomplete preview.

File: `modules/chat-panel/components/GenerationOutputCard.tsx` (new, from Phase 2.5)
- When `message.output == null && message.content != '' && state.isStreaming`:
  - Show a pulsing "Generating..." indicator in the preview area
- When `message.output != null`:
  - Show the actual preview (resume/cover-letter/template)

**1b.5 Update the preview useEffect to handle streamText flow**

File: `modules/chat-panel/components/FullPageChat.tsx`

The existing `useEffect` for resume previews (line 820-849) watches `state.messages` and calls `extractResumeData(message)`. Since `extractResumeData` already handles both object and string outputs, and the `complete` chunk sets `message.output` to the parsed object, the useEffect will fire when the message's output field changes and extract the preview.

However, there's a subtlety: during streaming, `message.content` accumulates text but `message.output` is still null. The useEffect should NOT try to parse the incomplete text. Only after `complete` should the preview populate. The existing extractors handle this because they prioritize `message.output` over `message.content`.

One edge case: if the stream errors or is aborted before `complete`, `message.output` stays null and no preview renders. This is correct behavior (incomplete generation = no preview).

**1b.6 Ensure delta path still works for streamObject**

File: `modules/ai-enhance/hooks/use-conversation/index.ts`

The `handleStreamResponse` currently uses `updateState(data.partial)` for delta chunks, which merges partial objects into `state.output`. This must remain unchanged for non-reasoning models using `streamObject`.

When the `complete` chunk arrives (from either streamObject or streamText), it sets `message.output = final` in the `onComplete` callback. The extractors then pick it up. Both paths converge here.

**Summary of streaming chunk flow by path:**

| Path | Chunks | Client handling | Preview activation |
|------|--------|-----------------|-------------------|
| **streamObject** (non-reasoning) | `delta` → `complete` | delta: mergeDeep into state.output; complete: set message.output | Incremental via state.output merging + extractors on complete |
| **streamText** (reasoning-capable) | `reasoning` → `text` → `complete` | reasoning: accumulate message.thinking; text: accumulate message.content; complete: set message.output | On complete only, via extractors reading message.output |

**Files changed:**
- `modules/ai-enhance/hooks/use-conversation/index.ts` (handle `text` chunks in handleStreamResponse)
- `lib/ai/chat/orchestrator.ts` (conditional: streamObject for non-reasoning, streamText+fullStream for reasoning)
- `modules/chat-panel/components/GenerationOutputCard.tsx` (show "Generating..." placeholder during streamText streaming)

---

### Phase 2: Extract Reusable Components from FullPageChat

**2.1 Extract session management into `useSessionManager` hook**

New file: `modules/chat-panel/hooks/useSessionManager.ts`

Move out of FullPageChat:
- `SessionMeta`, `SessionHistoryByType`, `ActiveSessionByType` types
- `createSessionId`, `createSessionMeta`, `getInitialSessionState`, `truncateTitle`
- localStorage read/write effects for `SESSION_HISTORY_KEY`, `SESSION_ACTIVE_KEY`, `SESSION_COLLAPSED_KEY`
- `handleCreateSession`, `handleDeleteSession`
- `historyByType`, `activeByType`, `isHistoryCollapsed` state

Return: `{ history, active, collapsed, create, remove, setActive, toggleCollapsed }`

**2.2 Extract artifact/reference loading into `useArtifactLoader` hook**

New file: `modules/chat-panel/hooks/useArtifactLoader.ts`

Move out:
- `ArtifactReference` type
- The large `useEffect` that loads artifacts based on `generationType`
- `selectedArtifactRefs`, `artifactOptions`, `isLoadingArtifacts` state
- Hydration effects for profiles/resumes/templates
- `artifactContextOverride` memo
- Template preview resume loading

Return: `{ options, selectedRefs, setSelectedRefs, isLoading, contextOverride, previewResume }`

**2.3 Extract per-type output extractors**

New file: `modules/chat-panel/utils/extract-output.ts`

Move:
- `extractResumeData`
- `extractCoverLetterOutput`
- `extractTemplateHtml`

These stay as pure functions but get proper unit tests.

**2.4 Create per-type preview components**

New files:
- `modules/chat-panel/components/previews/TemplatePreview.tsx`
- `modules/chat-panel/components/previews/ResumePreviewCard.tsx`
- `modules/chat-panel/components/previews/CoverLetterPreviewCard.tsx`

Each receives: `{ message, preview, onSave, isSaving, savedId, onView, ... }`

Template preview is the reference: header with Preview/Code/Save actions, iframe or code view.

**2.5 Create a shared `GenerationOutputCard` wrapper**

New file: `modules/chat-panel/components/GenerationOutputCard.tsx`

Shared card chrome: border, rounded corners, header bar with type label + action buttons, content slot.
Each type-specific preview plugs into the content slot.

**2.6 Extract `ChatMessageBubble` component**

New file: `modules/chat-panel/components/ChatMessageBubble.tsx`

Renders a single message: user bubble (right-aligned) or assistant bubble (left-aligned with AI avatar).
For assistant messages: shows thinking (collapsible), text content, and optional `GenerationOutputCard`.

**2.7 Slim down FullPageChat**

After extractions, FullPageChat becomes ~200-300 lines:
- Layout shell: sidebar + main area
- Session sidebar (uses `useSessionManager`)
- Type tabs (resume/cover-letter/template)
- Message list (maps messages through `ChatMessageBubble`)
- ChatInput (with artifact reference integration)
- Uses `useArtifactLoader` + `useConversation`

---

### Phase 3: Unify Save Behavior

**3.1 Create `useGenerationSave` hook**

New file: `modules/chat-panel/hooks/useGenerationSave.ts`

Unifies the three save handlers:
```ts
function useGenerationSave(type: GenerationType) {
  // Returns: { save(message, previewData), isSaving, savedId }
  // Internally dispatches to createTemplate / saveGeneratedResume / createCoverLetter
  // Updates preview state with savedId
  // Navigates on "View" action
}
```

**3.2 Apply header-only action pattern (template reference)**

For all three types, the output card header shows:
- **Template**: [Preview] [Code] [Save → View after save]
- **Resume**: [Template Selector] [Save → View after save]
- **Cover Letter**: [Save → View after save]

No floating bottom banner for any type. No "saved/view" banner at bottom of chat.

**3.3 Remove dead save code**

- Delete `handleSaveCoverLetterMessage`, `handleSaveResumeMessage`, `handleSaveTemplateMessage` from FullPageChat (replaced by `useGenerationSave`)
- Remove the bottom floating "saved!" banner for templates (line 1687-1703)

---

### Phase 4: Clean Up Dead Code

**4.1 Remove old generation components**

Delete (these are no longer rendered by any active page):
- `app/(authenticated)/generate/components/GenerateContent.tsx`
- `app/(authenticated)/generate/components/ResumeGenerator.tsx`
- `app/(authenticated)/generate/components/CoverLetterGenerator.tsx`
- `app/(authenticated)/generate/components/CoverLetterInput.tsx`
- `app/(authenticated)/generate/components/JobDescriptionInput.tsx`
- `app/(authenticated)/generate/components/GenerationSettings.tsx`
- `app/(authenticated)/generate/components/useResumeFlow.ts`
- `app/(authenticated)/generate/components/useCoverLetterFlow.ts`
- `app/(authenticated)/generate/components/useGenerateMetadata.ts`

**4.2 Remove old hooks that are superseded by FullPageChat's useConversation**

Evaluate for removal (check all consumers first):
- `modules/ai-enhance/hooks/useResumeGeneration.ts` -- only used by old `useResumeFlow.ts`
- `modules/ai-enhance/hooks/useCoverLetterGeneration.ts` -- only used by old `useCoverLetterFlow.ts`
- `modules/ai-enhance/hooks/useAITask.ts` -- check if used by sidebar ChatPanel components

**4.3 Remove old modals if fully replaced**

- `modules/ai-enhance/modals/AIEnhanceResumeModal.tsx`
- `modules/ai-enhance/modals/AIEnhanceTemplateModal.tsx`
- `modules/ai-enhance/modals/AIEnhanceBaseModal.tsx`

Check importers before deleting.

---

### Phase 5: Session Resilience

**5.1 Fix session isolation**

Current bug: when switching sessions within the same type, the `useConversation` hook resets via `persistenceKey` change (`fullpage-chat:${mode}:${sessionId}`), but the per-message preview state (`resumePreviewByMessage`, etc.) persists across sessions because it's in FullPageChat's state.

Fix: When `activeSessionId` changes, clear all `*ByMessage` state maps:
```ts
useEffect(() => {
  setResumePreviewByMessage({});
  setCoverLetterPreviewByMessage({});
  setTemplatePreviewByMessage({});
  setResumeTemplateByMessage({});
  // etc.
}, [activeSessionId]);
```

**5.2 Handle localStorage quota/errors gracefully**

The persistence effect in `useConversation` silently catches write errors. Add a fallback: if localStorage is full, clear the oldest session data before retrying.

**5.3 Validate hydrated state**

When `useConversation` hydrates from localStorage, validate the structure more strictly:
- Check `mode` matches current mode (already done)
- Check `messages` array items have required fields
- Check `output` is valid for the mode

---

### Phase 6: Testing & Validation

**6.1 Unit tests for extractors**

File: `modules/chat-panel/utils/__tests__/extract-output.test.ts`
- Test `extractResumeData` with valid output, missing fields, stringified JSON
- Test `extractCoverLetterOutput` with valid output, string content, nested JSON
- Test `extractTemplateHtml` with template output object, raw HTML string, code fences

**6.2 Integration tests for useSessionManager**

File: `modules/chat-panel/hooks/__tests__/useSessionManager.test.ts`
- Test create, switch, delete session
- Test localStorage round-trip
- Test session isolation (switching clears state)

**6.3 Integration tests for useGenerationSave**

File: `modules/chat-panel/hooks/__tests__/useGenerationSave.test.ts`
- Test save for each type calls the correct server action
- Test save updates preview state with returned ID
- Test View navigation after save

**6.4 Manual validation checklist**

- [ ] Resume tab: generate → see thinking → see preview → save → View appears in header → click View navigates
- [ ] Cover letter tab: generate → see thinking → see preview → save → View appears in header
- [ ] Template tab: generate → see thinking → Preview/Code toggle works → save → navigates to template editor
- [ ] Session switch: create new session → empty state → switch back to old session → messages restored
- [ ] Session delete: delete session → falls back to another session
- [ ] Refresh: refresh page → active session and messages restored from localStorage
- [ ] Artifact references: select profile/resume/template reference → included in context
- [ ] Model selection persists across sessions
- [ ] Streaming: abort works, error displays properly, no stuck loading state

---

## Files Summary

### New files
```
modules/chat-panel/hooks/useSessionManager.ts
modules/chat-panel/hooks/useArtifactLoader.ts
modules/chat-panel/hooks/useGenerationSave.ts
modules/chat-panel/utils/extract-output.ts
modules/chat-panel/components/ChatMessageBubble.tsx
modules/chat-panel/components/GenerationOutputCard.tsx
modules/chat-panel/components/ReasoningBlock.tsx
modules/chat-panel/components/previews/TemplatePreview.tsx
modules/chat-panel/components/previews/ResumePreviewCard.tsx
modules/chat-panel/components/previews/CoverLetterPreviewCard.tsx
modules/chat-panel/utils/__tests__/extract-output.test.ts
modules/chat-panel/hooks/__tests__/useSessionManager.test.ts
modules/chat-panel/hooks/__tests__/useGenerationSave.test.ts
```

### Modified files
```
lib/ai/chat/orchestrator/types.ts            (add StreamChunkReasoning)
lib/ai/chat/orchestrator.ts                   (emit reasoning chunks, streamText+fullStream for reasoning models)
lib/ai/providers/base.ts                      (add reasoning to capabilities)
lib/ai/providers/openai.ts                    (mark reasoning-capable models)
lib/ai/providers/anthropic.ts                 (mark reasoning-capable models)
lib/ai/providers/google.ts                    (mark reasoning-capable models from API response)
lib/ai/runtime/types.ts                       (add providerOptions/reasoning config to ResolvedAIModel)
lib/ai/runtime/resolve-model.ts              (build providerOptions based on model capabilities)
app/api/v1/ai/chat/route.ts                   (forward reasoning chunks -- likely no change needed)
modules/ai-enhance/hooks/use-conversation/types.ts  (add thinking to ConversationMessage)
modules/ai-enhance/hooks/use-conversation/index.ts  (handle reasoning + text chunks)
modules/chat-panel/components/FullPageChat.tsx        (slim down to shell)
```

### Deleted files
```
app/(authenticated)/generate/components/GenerateContent.tsx
app/(authenticated)/generate/components/ResumeGenerator.tsx
app/(authenticated)/generate/components/CoverLetterGenerator.tsx
app/(authenticated)/generate/components/CoverLetterInput.tsx
app/(authenticated)/generate/components/JobDescriptionInput.tsx
app/(authenticated)/generate/components/GenerationSettings.tsx
app/(authenticated)/generate/components/useResumeFlow.ts
app/(authenticated)/generate/components/useCoverLetterFlow.ts
app/(authenticated)/generate/components/useGenerateMetadata.ts
modules/ai-enhance/hooks/useResumeGeneration.ts    (if no other consumers)
modules/ai-enhance/hooks/useCoverLetterGeneration.ts (if no other consumers)
modules/ai-enhance/hooks/useAITask.ts              (evaluate -- may be used by ChatPanel sidebar)
```

---

## Risks & Tradeoffs

| Risk | Mitigation |
|------|------------|
| Thinking token support depends on provider (not all models return reasoning) | Gracefully handle absence -- if no thinking chunks arrive, nothing is shown |
| Extracting hooks changes state lifecycle -- could introduce stale closure bugs | Keep hooks focused, use `useCallback` with minimal deps, test session switching |
| Deleting old components may break imports from other pages | Grep all imports before deleting; keep anything still referenced |
| `useAITask` might be used by ChatPanel sidebar enhancement hooks | Check consumers before deleting; if used, keep but mark as internal |
| Streaming refactor could break existing streaming for resume/cover-letter | Phase 1 is additive only (new chunk type); existing `delta`/`complete` paths unchanged |

## Open Questions

1. **useAITask consumers**: Need to audit all imports of `useAITask` before deciding to delete it. It may be used by the ChatPanel sidebar for profile/template enhancement.
2. **Reasoning budget**: How much thinking budget to allocate? OpenAI uses `reasoningEffort` (low/medium/high), Anthropic uses `budgetTokens`, Google uses `thinkingBudget`. Should this be user-configurable (e.g. a "Deep thinking" toggle) or always-on at a sensible default?

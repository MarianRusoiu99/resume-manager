# Chatbot Integration Plan

> **For Hermes:** Execute task-by-task. Each task is self-contained and verifiable.

**Goal:** Replace the modal-based AI Enhance with a conversational chat interface on Profiles and Templates, and replace the /generate page with a full ChatGPT-like interface for creating resumes and cover letters.

---

## What exists (ready to use):
- `components/chat/` -- ChatPanel, ChatMessage, ChatInput, ChatTrigger (fully built)
- `modules/ai-enhance/hooks/useConversation` -- Full conversation hook with streaming
- `app/api/v1/ai/chat/route.ts` -- Backend API with streaming, auto-save, all modes
- `lib/ai/` -- Orchestrator, modes, agents, providers (full AI infrastructure)

## What needs to change:

### Task 1: ProfileEditor -- Add ChatPanel, remove AI Enhance modal
- Modify: `modules/profile/components/ProfileEditor.tsx`
  - Add ChatPanel with mode `resume-enhancement`, context = `{ currentResume: profile.resume }`
  - Replace "AI Enhance" button (which calls `editorRef.current?.setShowAIEnhance(true)`) with "AI Chat" button that toggles ChatPanel
  - When chat produces output with a resume, show "Apply" to update editor via `editorRef.current?.updateResume()`
- Modify: `modules/editor/components/ResumeEditor.tsx`
  - Remove AIEnhanceResumeModal import and rendering
  - Remove setShowAIEnhance from the ref interface
  - Keep everything else (editor, preview, share dialog)
- Verify: Profile page shows "AI Chat" button, clicking opens slide-out ChatPanel, messages work, applying output updates the editor

### Task 2: TemplateEditor -- Add ChatPanel, remove AI Enhance modal
- Modify: `modules/templates/components/TemplateEditor.tsx`
  - Add ChatPanel with mode `template-enhancement`, context = `{ template: { htmlTemplate: formData.htmlTemplate } }`
  - Remove AIEnhanceTemplateModal import and rendering
  - Remove `templateEnhanceModalOpen` state
  - Remove `setTemplateEnhanceModalOpen` from TemplateEditorToolbar props
  - When chat produces output, show "Apply" to update `formData.htmlTemplate`
- Modify: `modules/templates/components/editor/TemplateEditorToolbar.tsx`
  - Remove the AI Enhance toolbar button (or repurpose as ChatPanel toggle)
- Verify: Template page chat works, output applies to template editor

### Task 3: Create full-page Chat interface for generation
- Create: `modules/chat-panel/components/FullPageChat.tsx`
  - ChatGPT-like full-page interface
  - Centered message thread, input at bottom
  - Mode selector (resume-generation vs cover-letter-generation)
  - Shows generated output with "View" / "Save" actions
  - Reuses useConversation hook
- Verify: Component renders, messages work, streaming works

### Task 4: Replace /generate page with full-page chat
- Modify: `app/(authenticated)/generate/page.tsx`
- Modify: `app/(authenticated)/generate/components/` -- replace with FullPageChat
- Or: Create new dedicated routes `/generate/resume` and `/generate/cover-letter`
- Update: `lib/constants/nav-config.ts` if needed
- Verify: /generate shows full chat interface, can generate resumes and cover letters

### Task 5: Clean up resume detail page
- Modify: `app/(authenticated)/resumes/[id]/page.tsx`
  - Remove unused ChatPanel import
  - Remove `chatOpen` state
  - Remove "AI Chat" button from header actions
  - Remove unused getConversationContext function
  - Remove unused ConversationContext import
- Verify: Resume detail page works without the dead chat code

### Task 6: Cleanup -- Remove unused modals and hooks
- Evaluate and delete if unused:
  - `modules/ai-enhance/modals/` (all modal files)
  - Any hooks only used by modals
  - `modules/ai-enhance/preview/` comparison components (if only used by modals)
  - `modules/ai-enhance/prompt/PromptPresets.tsx` (if only used by modals)
- Verify: `npx tsc --noEmit` passes

---

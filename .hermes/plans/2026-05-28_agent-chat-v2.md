# Agent Chat v2 — Full ChatGPT/Claude-style Interface with Memory, Skills & Uploads

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Upgrade /generate into a fully-featured AI agent interface — ChatGPT/Claude-quality UX with persistent model selection per tab, agent memory management, per-tab skill injection, rich artifact selection, and improved file uploads.

**Architecture:**
- All new state lives in `modules/chat-panel/` and is backed by localStorage (client) + a new `AgentMemory` DB table (server).
- Agent memory is persisted server-side per user and passed as a system-prompt segment to the API.
- Skills are user-defined text blocks attached per tab type, surfaced via a Skills drawer in the UI.
- Model selection is stored per GenerationType and survives refresh.
- Artifact selector becomes a full modal with search/filter, replacing the current chip dropdown.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, Prisma, Vercel AI SDK, shadcn/ui

---

## Phase 1 — Persistent Model Selection Per Tab

### Task 1: Add model-selection localStorage key per tab

**Objective:** Store and restore the selected modelId per GenerationType tab (resume / cover-letter / template).

**Files:**
- Modify: `modules/chat-panel/hooks/useSessionManager.ts`

**Step 1: Add constant + getter/setter helpers**

```typescript
export const MODEL_SELECTION_KEY = 'fullpage-chat:model:v1';
// shape: Record<GenerationType, string | null>

export function getStoredModels(): Record<GenerationType, string | null> {
  try {
    const raw = window.localStorage.getItem(MODEL_SELECTION_KEY);
    return raw ? JSON.parse(raw) : { resume: null, 'cover-letter': null, template: null };
  } catch { return { resume: null, 'cover-letter': null, template: null }; }
}

export function setStoredModel(type: GenerationType, modelId: string | null): void {
  const current = getStoredModels();
  current[type] = modelId;
  window.localStorage.setItem(MODEL_SELECTION_KEY, JSON.stringify(current));
}
```

**Step 2: Commit**
```bash
git add modules/chat-panel/hooks/useSessionManager.ts
git commit -m "feat(chat): persist model selection per tab type"
```

---

### Task 2: Wire model selection into FullPageChat

**Objective:** FullPageChat reads stored model per tab, writes on change, passes to useConversation.

**Files:**
- Modify: `modules/chat-panel/components/FullPageChat.tsx`

**Step 1:** Add state

```typescript
const [modelByType, setModelByType] = useState<Record<GenerationType, string | null>>({
  resume: null, 'cover-letter': null, template: null,
});
```

**Step 2:** Hydrate from localStorage in the existing `isClientHydrated` useEffect (alongside session history hydration).

```typescript
const storedModels = getStoredModels();
setModelByType(storedModels);
```

**Step 3:** When the ChatInput model selector fires onChange, call:
```typescript
setModelByType(prev => ({ ...prev, [generationType]: modelId }));
setStoredModel(generationType, modelId);
```

**Step 4:** Pass `modelId={modelByType[generationType] ?? undefined}` to `useConversation` (already forwarded to API as `modelId`).

**Step 5:** Commit.

---

## Phase 2 — Agent Memory Management

### Task 3: Prisma migration — AgentMemory table

**Objective:** New table to store per-user agent memory blobs per ConversationMode.

**Files:**
- Modify: `prisma/schema.prisma`
- New: `prisma/migrations/<timestamp>_add_agent_memory/migration.sql`

**Step 1: Add model**

```prisma
model AgentMemory {
  id        String   @id @default(cuid())
  userId    String
  mode      String   // ConversationMode value e.g. 'resume-generation'
  content   String   @db.Text
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, mode])
  @@index([userId])
}
```

**Step 2: Run migration**
```bash
npx prisma migrate dev --name add_agent_memory
```

**Step 3:** Verify with `npx prisma studio` — table exists.

**Step 4: Commit**
```bash
git add prisma/ && git commit -m "feat(db): add AgentMemory table"
```

---

### Task 4: AgentMemory repository + server actions

**Objective:** CRUD for agent memory blobs, exposed as server actions.

**Files:**
- New: `lib/repositories/agent-memory.repository.ts`
- New: `app/actions/agent-memory.ts`

**Step 1: Repository**

```typescript
// lib/repositories/agent-memory.repository.ts
import { db } from '@/lib/db';

export async function getAgentMemory(userId: string, mode: string): Promise<string | null> {
  const row = await db.agentMemory.findUnique({ where: { userId_mode: { userId, mode } } });
  return row?.content ?? null;
}

export async function upsertAgentMemory(userId: string, mode: string, content: string): Promise<void> {
  await db.agentMemory.upsert({
    where: { userId_mode: { userId, mode } },
    create: { userId, mode, content },
    update: { content },
  });
}

export async function deleteAgentMemory(userId: string, mode: string): Promise<void> {
  await db.agentMemory.deleteMany({ where: { userId, mode } });
}
```

**Step 2: Server actions**

```typescript
// app/actions/agent-memory.ts
'use server'
import { auth } from '@/lib/auth';
import { getAgentMemory, upsertAgentMemory, deleteAgentMemory } from '@/lib/repositories/agent-memory.repository';

export async function getMemoryAction(mode: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return getAgentMemory(session.user.id, mode);
}

export async function saveMemoryAction(mode: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await upsertAgentMemory(session.user.id, mode, content);
}

export async function clearMemoryAction(mode: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await deleteAgentMemory(session.user.id, mode);
}
```

**Step 3: Commit**
```bash
git add lib/repositories/agent-memory.repository.ts app/actions/agent-memory.ts
git commit -m "feat(memory): agent memory repository + server actions"
```

---

### Task 5: Inject agent memory into the AI chat API route

**Objective:** Load user's agent memory for the resolved mode and prepend it to the conversation's personalInstructions/context before streaming.

**Files:**
- Modify: `app/api/v1/ai/chat/route.ts`

**Step 1:** Import repository function (safe to call directly in route since it's server-side):

```typescript
import { getAgentMemory } from '@/lib/repositories/agent-memory.repository';
```

**Step 2:** After resolving `userId` and `mode`, load memory:

```typescript
const agentMemory = await getAgentMemory(userId, mode);
```

**Step 3:** Merge into context before `normalizeContext`:

```typescript
if (agentMemory && context) {
  context.personalInstructions = [agentMemory, context.personalInstructions].filter(Boolean).join('\n\n---\n\n');
} else if (agentMemory) {
  context = { personalInstructions: agentMemory };
}
```

**Step 4: Commit**
```bash
git commit -am "feat(chat): inject agent memory into AI context"
```

---

### Task 6: MemoryDrawer UI component

**Objective:** Side drawer (right side) for viewing/editing/clearing agent memory for the active tab.

**Files:**
- New: `modules/chat-panel/components/MemoryDrawer.tsx`

**Step 1: Component skeleton**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { getMemoryAction, saveMemoryAction, clearMemoryAction } from '@/app/actions/agent-memory';
import type { ConversationMode } from '@/modules/ai-enhance/hooks/useConversation';

interface MemoryDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: ConversationMode;
}

export function MemoryDrawer({ open, onClose, mode }: MemoryDrawerProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    getMemoryAction(mode).then(v => setContent(v ?? ''));
  }, [open, mode]);

  const handleSave = async () => {
    setLoading(true);
    await saveMemoryAction(mode, content);
    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = async () => {
    await clearMemoryAction(mode);
    setContent('');
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[420px] flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>Agent Memory</SheetTitle>
          <SheetDescription>
            This text is injected as background context for every message in the <strong>{mode}</strong> agent. Use it to store persistent facts, preferences, or standing instructions.
          </SheetDescription>
        </SheetHeader>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="e.g. The user prefers concise bullet points. Always target senior engineering roles..."
          className="flex-1 resize-none min-h-[300px] font-mono text-sm"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleClear}>Clear</Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {saved ? 'Saved!' : loading ? 'Saving...' : 'Save Memory'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 2: Commit**
```bash
git add modules/chat-panel/components/MemoryDrawer.tsx
git commit -m "feat(ui): MemoryDrawer component for agent memory management"
```

---

## Phase 3 — Per-Tab Skills (Skill Injection)

### Task 7: Skills data model — localStorage-based per tab

**Objective:** Allow users to add freeform "skill" text blocks per tab. Skills are stored in localStorage (like sessions), sent as part of personalInstructions.

**Files:**
- Modify: `modules/chat-panel/hooks/useSessionManager.ts`

**Step 1: Define types and constants**

```typescript
export interface AgentSkill {
  id: string;
  title: string;        // short label shown in chip
  content: string;      // full text injected into context
  enabled: boolean;
}

export const SKILLS_KEY = 'fullpage-chat:skills:v1';
// shape: Record<GenerationType, AgentSkill[]>
```

**Step 2: Helper functions**

```typescript
export function getStoredSkills(): Record<GenerationType, AgentSkill[]> {
  try {
    const raw = window.localStorage.getItem(SKILLS_KEY);
    return raw ? JSON.parse(raw) : { resume: [], 'cover-letter': [], template: [] };
  } catch { return { resume: [], 'cover-letter': [], template: [] }; }
}

export function setStoredSkills(skills: Record<GenerationType, AgentSkill[]>): void {
  window.localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
}
```

**Step 3: Commit**
```bash
git commit -am "feat(skills): per-tab agent skills types and storage helpers"
```

---

### Task 8: SkillsDrawer UI component

**Objective:** Drawer for managing skills per tab — create, toggle, delete, reorder.

**Files:**
- New: `modules/chat-panel/components/SkillsDrawer.tsx`

**Step 1: Component**

```typescript
'use client';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import type { AgentSkill } from '../hooks/useSessionManager';
import type { GenerationType } from '../hooks/useSessionManager';

interface SkillsDrawerProps {
  open: boolean;
  onClose: () => void;
  type: GenerationType;
  skills: AgentSkill[];
  onSkillsChange: (skills: AgentSkill[]) => void;
}

export function SkillsDrawer({ open, onClose, type, skills, onSkillsChange }: SkillsDrawerProps) {
  const [draft, setDraft] = useState<{ title: string; content: string }>({ title: '', content: '' });

  const addSkill = () => {
    if (!draft.title.trim() || !draft.content.trim()) return;
    onSkillsChange([...skills, { id: crypto.randomUUID(), ...draft, enabled: true }]);
    setDraft({ title: '', content: '' });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[480px] flex flex-col gap-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Agent Skills — {type}</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground">
          Skills are additional instructions injected as context. Toggle them on/off per conversation.
        </p>

        {/* Existing skills */}
        <div className="flex flex-col gap-3">
          {skills.map(skill => (
            <div key={skill.id} className="border rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{skill.title}</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={skill.enabled}
                    onCheckedChange={v => onSkillsChange(skills.map(s => s.id === skill.id ? { ...s, enabled: v } : s))}
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSkillsChange(skills.filter(s => s.id !== skill.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{skill.content}</p>
            </div>
          ))}
        </div>

        {/* Add new skill */}
        <div className="border rounded-lg p-3 flex flex-col gap-2 mt-auto">
          <p className="text-sm font-medium">Add Skill</p>
          <Input
            placeholder="Skill title (e.g. ATS Optimization)"
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
          />
          <Textarea
            placeholder="Describe what the agent should know or do..."
            value={draft.content}
            onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
            className="min-h-[100px] text-sm"
          />
          <Button size="sm" onClick={addSkill} className="self-end">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Skill
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 2: Commit**
```bash
git add modules/chat-panel/components/SkillsDrawer.tsx
git commit -m "feat(ui): SkillsDrawer for per-tab agent skills"
```

---

### Task 9: Wire skills into conversation context

**Objective:** Enabled skills are joined into personalInstructions before sending to API.

**Files:**
- Modify: `modules/chat-panel/components/FullPageChat.tsx`

**Step 1:** Load/store skills in FullPageChat (alongside model state):

```typescript
const [skillsByType, setSkillsByType] = useState<Record<GenerationType, AgentSkill[]>>({
  resume: [], 'cover-letter': [], template: [],
});
```

Hydrate from localStorage in isClientHydrated effect:
```typescript
setSkillsByType(getStoredSkills());
```

Persist on change:
```typescript
useEffect(() => {
  if (!isClientHydrated) return;
  setStoredSkills(skillsByType);
}, [skillsByType, isClientHydrated]);
```

**Step 2:** Before `sendMessage`, build skills context:

```typescript
const activeSkills = skillsByType[generationType].filter(s => s.enabled);
const skillsContext = activeSkills.map(s => `### Skill: ${s.title}\n${s.content}`).join('\n\n');
```

Merge into `personalInstructions` in the context passed to `updateContext`.

**Step 3:** Open SkillsDrawer via a Skills button in the chat toolbar (near Memory button).

**Step 4: Commit**
```bash
git commit -am "feat(chat): wire agent skills into conversation context"
```

---

## Phase 4 — Full Artifact Selector Modal

### Task 10: ArtifactSelectorModal component

**Objective:** Replace the current artifact chip row with a full modal that lets users search/filter profiles, resumes, cover letters, and templates, then add them as references.

**Files:**
- New: `modules/chat-panel/components/ArtifactSelectorModal.tsx`

**Step 1: Modal with tabs and search**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArtifactReference } from './FullPageChat';

interface ArtifactSelectorModalProps {
  open: boolean;
  onClose: () => void;
  options: ArtifactReference[];
  selected: string[];
  onToggle: (id: string) => void;
  isLoading: boolean;
}

export function ArtifactSelectorModal({ open, onClose, options, selected, onToggle, isLoading }: ArtifactSelectorModalProps) {
  const [query, setQuery] = useState('');
  const tabTypes = ['profile', 'resume', 'cover-letter', 'template'] as const;

  const filtered = (type: string) =>
    options.filter(o => o.type === type && o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select References</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="mb-2"
        />
        <Tabs defaultValue="profile">
          <TabsList className="w-full">
            {tabTypes.map(t => (
              <TabsTrigger key={t} value={t} className="flex-1 capitalize">{t}</TabsTrigger>
            ))}
          </TabsList>
          {tabTypes.map(t => (
            <TabsContent key={t} value={t}>
              <ScrollArea className="h-[320px]">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground p-4">Loading...</p>
                ) : filtered(t).length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No {t}s found</p>
                ) : (
                  <div className="flex flex-col gap-1 p-1">
                    {filtered(t).map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => onToggle(opt.id)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-md text-sm text-left hover:bg-muted transition-colors',
                          selected.includes(opt.id) && 'bg-muted font-medium'
                        )}
                      >
                        {opt.label}
                        {selected.includes(opt.id) && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
        <p className="text-xs text-muted-foreground">{selected.length} reference(s) selected</p>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2:** In FullPageChat, replace the existing artifact chip row with a single "References" button that opens this modal. Selected refs still feed into context the same way as before.

**Step 3: Commit**
```bash
git add modules/chat-panel/components/ArtifactSelectorModal.tsx
git commit -am "feat(ui): ArtifactSelectorModal replaces chip artifact row"
```

---

## Phase 5 — Enhanced File Uploads

### Task 11: Increase file limit + add drag-and-drop to ChatInput

**Objective:** Support up to 5 files (was 3), add drag-and-drop to the full chat area, and show file upload progress.

**Files:**
- Modify: `modules/ai-enhance/hooks/useFileAttachments.ts`
- Modify: `components/chat/ChatInput.tsx`
- Modify: `modules/chat-panel/components/FullPageChat.tsx`

**Step 1:** In useFileAttachments.ts, change `MAX_FILES = 3` to `MAX_FILES = 5`.

**Step 2:** In FullPageChat outer div, add:

```typescript
onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
onDragLeave={() => setIsDragging(false)}
onDrop={async e => {
  e.preventDefault(); setIsDragging(false);
  if (e.dataTransfer.files.length) await addFiles(e.dataTransfer.files);
}}
```

Show a drag overlay badge when `isDragging` is true (absolute positioned, semi-transparent).

**Step 3: Commit**
```bash
git commit -am "feat(uploads): increase file limit to 5, add drag-and-drop support"
```

---

## Phase 6 — Toolbar Button Integration in FullPageChat

### Task 12: Add Memory and Skills icon buttons to chat toolbar

**Objective:** Two compact icon buttons (BrainCircuit and Wrench) appear in the ChatInput toolbar row alongside the existing model/reference controls. Clicking them opens MemoryDrawer or SkillsDrawer.

**Files:**
- Modify: `modules/chat-panel/components/FullPageChat.tsx`

**Step 1:** Add state:

```typescript
const [memoryOpen, setMemoryOpen] = useState(false);
const [skillsOpen, setSkillsOpen] = useState(false);
```

**Step 2:** Import and render drawers:

```tsx
import { MemoryDrawer } from './MemoryDrawer';
import { SkillsDrawer } from './SkillsDrawer';

<MemoryDrawer open={memoryOpen} onClose={() => setMemoryOpen(false)} mode={getMode(generationType)} />
<SkillsDrawer open={skillsOpen} onClose={() => setSkillsOpen(false)} type={generationType}
  skills={skillsByType[generationType]}
  onSkillsChange={s => setSkillsByType(prev => ({ ...prev, [generationType]: s }))} />
```

**Step 3:** Add to toolbar (in the same inline controls row as model selector):

```tsx
import { BrainCircuit, Wrench } from 'lucide-react';

<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMemoryOpen(true)} title="Agent Memory">
  <BrainCircuit className="h-4 w-4" />
</Button>
<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSkillsOpen(true)} title="Agent Skills">
  <Wrench className="h-4 w-4" />
</Button>
```

**Step 4: Commit**
```bash
git commit -am "feat(ui): add Memory and Skills toolbar buttons to chat"
```

---

## Phase 7 — UX Polish

### Task 13: Chat message timestamps + copy button

**Objective:** Each message shows a relative timestamp (e.g. "2 min ago") and a copy-to-clipboard button on hover.

**Files:**
- Modify: `modules/chat-panel/components/FullPageChat.tsx` (message rendering section)

**Step 1:** Add timestamp to ConversationMessage shape (already stored in `createdAt` field — verify and use it).

**Step 2:** Use `Intl.RelativeTimeFormat` or a simple helper to display relative time.

**Step 3:** On hover of a message bubble, show a `<Button variant="ghost" size="icon">` with `Copy` icon. On click, `navigator.clipboard.writeText(message.content)`.

**Step 4: Commit**

---

### Task 14: Token / usage display

**Objective:** After each AI response, show token usage (prompt + completion) in a subtle chip below the message.

**Files:**
- Modify: `modules/chat-panel/components/FullPageChat.tsx`
- Modify: `modules/ai-enhance/hooks/useConversation.ts` (ensure usage is returned in state)

**Step 1:** Check that `StreamChunk` of type `complete` includes `usage: { promptTokens, completionTokens }`. If not, extend the orchestrator to emit it.

**Step 2:** Store usage per message: `usageByMessage: Record<string, { promptTokens: number; completionTokens: number }>`.

**Step 3:** Render below AI message: `<span className="text-xs text-muted-foreground">{promptTokens + completionTokens} tokens</span>`.

**Step 4: Commit**

---

### Task 15: Keyboard shortcuts

**Objective:** Cmd/Ctrl+K opens artifact selector, Cmd/Ctrl+M opens memory drawer, Cmd/Ctrl+Shift+N creates new session.

**Files:**
- Modify: `modules/chat-panel/components/FullPageChat.tsx`

**Step 1:** Add global keydown listener in a useEffect:

```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'k') { e.preventDefault(); setArtifactSelectorOpen(true); }
    if (mod && e.key === 'm') { e.preventDefault(); setMemoryOpen(true); }
    if (mod && e.shiftKey && e.key === 'N') { e.preventDefault(); handleCreateSession(generationType); }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [generationType, handleCreateSession]);
```

**Step 2: Commit**

---

## Summary of Changed / New Files

### New files
- `modules/chat-panel/components/MemoryDrawer.tsx`
- `modules/chat-panel/components/SkillsDrawer.tsx`
- `modules/chat-panel/components/ArtifactSelectorModal.tsx`
- `lib/repositories/agent-memory.repository.ts`
- `app/actions/agent-memory.ts`
- `prisma/migrations/<ts>_add_agent_memory/`

### Modified files
- `modules/chat-panel/hooks/useSessionManager.ts` — model persistence, skills types/helpers
- `modules/chat-panel/components/FullPageChat.tsx` — model wiring, memory/skills state, drag-and-drop, toolbar buttons, artifact modal, keyboard shortcuts, timestamps, token usage
- `modules/ai-enhance/hooks/useFileAttachments.ts` — MAX_FILES 3→5
- `app/api/v1/ai/chat/route.ts` — inject agent memory into context
- `prisma/schema.prisma` — AgentMemory model

## Risks & Tradeoffs

- Agent memory is stored server-side as free text — no size limit enforced at DB level yet (add validation in server action, e.g. 10k char cap).
- Skills are localStorage-only (not persisted to DB). If we want cross-device sync, that's a follow-up.
- The `BrainCircuit` icon requires lucide-react >= 0.263 — verify version.
- Drag-and-drop only triggers if the drop target is inside FullPageChat — external file manager drops outside the chat area won't register. This is intentional.
- ArtifactSelectorModal performs the same `getProfiles/getResumes/...` calls as the current chip implementation — consolidate into a single `loadArtifacts` call to avoid duplicate fetches.

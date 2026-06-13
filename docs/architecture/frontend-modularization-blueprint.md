# Frontend Modularization Blueprint

## Scope
Refactor `modules/chat-panel/components/FullPageChat.tsx` into composable feature modules.

## Target Structure

```
modules/chat-panel/
  features/
    sessions/
      useChatSessions.ts
      SessionSidebar.tsx
    composer/
      ChatComposer.tsx
      useComposerControls.ts
    references/
      ArtifactReferences.tsx
      useArtifactReferences.ts
    messages/
      MessageStream.tsx
      AssistantMessage.tsx
      UserMessage.tsx
    outputs/
      ResumeOutputCard.tsx
      CoverLetterOutputCard.tsx
      TemplateOutputCard.tsx
      useOutputCommands.ts
  state/
    chat-state.ts
    chat-events.ts
  adapters/
    persistence.local.ts
    actions.adapter.ts
```

## Rules
- UI components should not call repositories/services directly.
- Artifact save/view actions go through output command handlers.
- Session persistence logic must be isolated from render components.
- `FullPageChat` becomes composition shell only.

## Migration Steps
1. Extract session management hooks/components.
2. Extract references loading/hydration.
3. Extract message list rendering.
4. Extract artifact output cards + save/view commands.
5. Shrink `FullPageChat` to orchestration shell.

## Verification
- Session switching and persistence unchanged.
- New session starts empty without leaking refs.
- Save/view behavior unchanged per artifact type.
- No regressions in generate page tabs.

# Refactoring Plan & Guidelines

This document outlines the refactoring plan initiated to improve consistency, reduce redundancy, and add proper logging to the Resume Optimizer application.

## 1. Logging

A new structured logging service has been created at `lib/logger.ts`.

**Usage:**

```typescript
import { logger } from "@/lib/logger";

logger.info("Something happened", { userId: "123" });
logger.error("Something failed", { error });
```

**Benefits:**

- Consistent log format (JSON in production, colored in dev).
- Centralized control over log levels.

## 2. API Routes

A new API handler wrapper has been created at `lib/api-handler.ts`.

**Usage:**

```typescript
import { createApiHandler } from "@/lib/api-handler";

export const GET = createApiHandler(async (req, { params }, session) => {
  // Your logic here
  // Authentication is already checked (unless isPublic: true)
  // Errors are caught and logged automatically
  return NextResponse.json({ data: "..." });
});
```

**Benefits:**

- Removes repetitive `try...catch` blocks.
- Standardizes authentication checks.
- Automatically logs requests and errors.

## 3. Form Components (DRY)

A new hook and component have been created to handle list-based forms (Experience, Education, etc.).

**Hook:** `hooks/use-list-form.ts`
**Component:** `components/ui/form-list.tsx`

**Usage:**

```tsx
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

export function MyForm({ items, onChange }) {
  const { items: listItems, addItem, removeItem, updateItem } = useListForm({
    initialItems: items,
    onChange,
    newItemTemplate: { ... }
  });

  return (
    <FormList
      items={listItems}
      onAdd={addItem}
      onRemove={removeItem}
      renderItem={(item, index) => (
        // Render your form fields here
        <Input value={item.name} onChange={e => updateItem(index, 'name', e.target.value)} />
      )}
    />
  );
}
```

**Benefits:**

- Eliminates duplicated state management logic.
- Standardizes the look and feel of list forms.

## Next Steps

1. **Refactor remaining API routes** in `app/api` to use `createApiHandler`.
2. **Refactor remaining forms** (Projects, Skills, etc.) to use `useListForm` and `FormList`.
3. **Review Zod Schemas:** The current `jsonresume` schemas define array items as optional (e.g., `Work | undefined`). Consider tightening these schemas to ensure array items are always defined objects.

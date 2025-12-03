# Resume Optimizer - Refactoring Plan

## Executive Summary

This document outlines a comprehensive refactoring plan to improve consistency, reduce redundancy, follow DRY principles, and add proper logging across the Resume Optimizer application.

**Created**: December 2025  
**Branch**: `refactor`  
**Estimated Total Effort**: ~15-20 hours

---

## Table of Contents

1. [High Priority Items](#1-high-priority-items)
2. [Medium Priority Items](#2-medium-priority-items)
3. [Low Priority Items](#3-low-priority-items)
4. [Implementation Checklist](#4-implementation-checklist)

---

## 1. High Priority Items

### 1.1 Create Server Action Wrapper (`withServerAction`)

**Problem**: All 16 server actions repeat the same auth check and error handling pattern:

```typescript
// This pattern is repeated 16+ times
try {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  // ... business logic
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Failed to [action]'
  };
}
```

**Solution**: Create `lib/actions/with-server-action.ts`:

```typescript
import { auth } from '@/lib/auth/config';
import { logger } from '@/lib/utils';
import type { ActionResult } from '@/app/actions/types';

type Session = { user: { id: string } };

export function withServerAction<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (session: Session, ...args: TArgs) => Promise<TResult>
) {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    const startTime = Date.now();
    
    try {
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn(`Unauthorized ${actionName} attempt`);
        return { success: false, error: 'Unauthorized' };
      }

      const result = await handler(session as Session, ...args);
      
      logger.info(`${actionName} completed`, {
        userId: session.user.id,
        duration: Date.now() - startTime,
      });
      
      return { success: true, data: result };
    } catch (error) {
      logger.error(`${actionName} failed`, error, {
        duration: Date.now() - startTime,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };
}
```

**Files to Update**:
- [ ] `app/actions/profile.ts` (7 actions)
- [ ] `app/actions/resume.ts` (4 actions)
- [ ] `app/actions/cover-letter.ts` (5 actions)

**Estimated Effort**: 2-3 hours

---

### 1.2 Migrate API Routes to Use `createApiHandler`

**Problem**: Only 4 of 14+ API route files use `createApiHandler`. The rest manually implement auth and error handling.

**Files NOT Using createApiHandler**:
| File | Issues |
|------|--------|
| `app/api/resume/route.ts` | Manual auth, manual error handling |
| `app/api/resume/[id]/route.ts` | Manual auth, no logging |
| `app/api/resume/import/route.ts` | Manual auth, console.log |
| `app/api/cover-letter/route.ts` | Manual auth, no logging |
| `app/api/cover-letter/[id]/route.ts` | Manual auth |
| `app/api/settings/api-providers/route.ts` | console.log, manual auth |
| `app/api/settings/api-providers/[id]/route.ts` | console.log |
| `app/api/settings/api-providers/models/route.ts` | Manual auth |
| `app/api/export/pdf/route.ts` | Manual auth |
| `app/api/template/route.ts` | Manual auth |

**Estimated Effort**: 3-4 hours

---

### 1.3 Replace `console.log` with Structured Logger

**Problem**: 24+ instances of `console.log/error/warn` instead of structured logger.

**Files to Fix**:
| File | console.* Count | Action |
|------|----------------|--------|
| `components/resume/ResumePreview.tsx` | 1 | Client-side, keep for debugging |
| `contexts/EditorContext.tsx` | 1 | Replace with logger.debug |
| `contexts/ProfileContext.tsx` | 1 | Replace with logger.error |
| `prisma/seed.ts` | 15+ | OK to keep (CLI script) |
| `app/api/settings/api-providers/*` | 3 | Replace with logger |

**Estimated Effort**: 1 hour

---

### 1.4 Standardize Service Result Types

**Problem**: Services use inconsistent result type patterns:

| Service | Current Pattern |
|---------|-----------------|
| `profile.service.ts` | `{ success: boolean; data?: T; error?: string }` |
| `resume.service.ts` | `GenerateResult` (custom) |
| `cover-letter.service.ts` | `{ success: boolean; ... }` |
| `template.service.ts` | Returns data or throws |
| `api-provider.service.ts` | Returns data or throws |

**Solution**: Create unified `ServiceResult<T>` type in `lib/types/service-result.ts`:

```typescript
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export function success<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function failure(error: string, code?: string): ServiceResult<never> {
  return { success: false, error, code };
}
```

**Estimated Effort**: 2 hours

---

## 2. Medium Priority Items

### 2.1 Create Validation Error Handler

**Problem**: Two different patterns for handling Zod validation errors:

**Pattern 1**:
```typescript
return NextResponse.json({
  error: 'Invalid request',
  details: validation.error.issues.map(e => ({
    field: e.path.join('.'),
    message: e.message
  }))
}, { status: 400 });
```

**Pattern 2**:
```typescript
return NextResponse.json(
  { error: 'Validation error', details: validation.error.issues },
  { status: 400 }
);
```

**Solution**: Add to `lib/api-handler.ts`:

```typescript
import { ZodError } from 'zod';

export function handleValidationError(error: ZodError): NextResponse {
  return NextResponse.json({
    error: 'Validation failed',
    details: error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
  }, { status: 400 });
}

// Or better: extend createApiHandler to accept a Zod schema
export function createApiHandler<T, TBody = unknown>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions & { bodySchema?: z.ZodSchema<TBody> } = {}
) {
  // Auto-validate body if schema provided
}
```

**Estimated Effort**: 1 hour

---

### 2.2 Consolidate Cache Invalidation

**Problem**: Cache invalidation is repeated manually in multiple places:

```typescript
// Repeated in resume routes
const cacheKey = `resumes:${session.user.id}`;
resumesCache.delete(cacheKey);
```

**Solution**: Move cache invalidation into service layer:

```typescript
// lib/services/resume.service.ts
class ResumeService {
  private invalidateCache(userId: string) {
    resumesCache.delete(`resumes:${userId}`);
  }

  async createResume(userId: string, data: CreateResumeInput) {
    const result = await prisma.resume.create({ ... });
    this.invalidateCache(userId);
    return result;
  }
}
```

**Estimated Effort**: 1 hour

---

### 2.3 Create Reusable Form Field Components

**Problem**: Form fields repeat same structure across 14+ form files:

```tsx
<div className="space-y-2">
  <Label htmlFor={`field-${index}`}>Label</Label>
  <Input
    id={`field-${index}`}
    value={item.field || ""}
    onChange={(e) => updateItem(index, "field", e.target.value)}
  />
</div>
```

**Solution**: Create `components/ui/form-field.tsx`:

```tsx
interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'url' | 'textarea';
  required?: boolean;
  placeholder?: string;
}

export function FormField({ label, name, value, onChange, ...props }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {props.required && <span className="text-destructive">*</span>}
      </Label>
      {props.type === 'textarea' ? (
        <Textarea
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      ) : (
        <Input
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      )}
    </div>
  );
}
```

**Estimated Effort**: 2 hours

---

### 2.4 Enhance Logger with Request Context

**Problem**: Current logger doesn't track request IDs or provide easy context attachment.

**Solution**: Enhance `lib/utils/logger.ts`:

```typescript
class Logger {
  private context: LogContext = {};

  // Create a child logger with attached context
  withContext(context: LogContext): Logger {
    const child = new Logger();
    child.context = { ...this.context, ...context };
    return child;
  }

  // Create request-scoped logger
  forRequest(requestId: string, userId?: string): Logger {
    return this.withContext({ requestId, userId });
  }
}

// Usage in API handler:
const reqLogger = logger.forRequest(crypto.randomUUID(), session?.user?.id);
reqLogger.info('Processing request');
```

**Estimated Effort**: 1 hour

---

## 3. Low Priority Items

### 3.1 Refactor `use-list-form.ts` Hook

**Problem**: The `use-list-form.ts` hook is 230+ lines and handles list state manually.

**Solution**: Simplify using `react-hook-form` `useFieldArray`:

```typescript
import { useFieldArray, useForm } from 'react-hook-form';

export function useListForm<T extends FieldValues>({
  name,
  defaultValues,
  onSave,
}) {
  const form = useForm({ defaultValues });
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name,
  });

  return { form, fields, append, remove, update };
}
```

**Estimated Effort**: 2-3 hours

---

### 3.2 Create Common Error Boundary

**Problem**: No consistent error handling in React components.

**Solution**: Create `components/error-boundary.tsx` with error logging.

**Estimated Effort**: 1 hour

---

### 3.3 Add Audit Logging Integration

**Problem**: The new `AuditLogService` isn't integrated into server actions.

**Solution**: Integrate audit logging into `withServerAction`:

```typescript
export function withServerAction<TArgs, TResult>(
  actionName: string,
  handler: (session: Session, ...args: TArgs) => Promise<TResult>,
  options: { auditAction?: AuditAction; resourceType?: string } = {}
) {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    // ... existing logic
    
    if (options.auditAction) {
      auditLog.success(options.auditAction, session.user.id, {
        resourceType: options.resourceType,
        resourceId: result?.id,
      });
    }
  };
}
```

**Estimated Effort**: 1 hour

---

## 4. Implementation Checklist

### Phase 1: Foundation (Week 1) ✅ COMPLETE
- [x] Create `lib/actions/with-server-action.ts`
- [x] Create `lib/types/service-result.ts`
- [x] Enhance `lib/utils/logger.ts` with context support
- [x] Create `lib/api-handler.ts` validation utilities

### Phase 2: Server Actions (Week 1-2) ✅ COMPLETE
- [x] Refactor `app/actions/profile.ts` to use `withServerAction`
- [x] Refactor `app/actions/resume.ts` to use `withServerAction`
- [x] Refactor `app/actions/cover-letter.ts` to use `withServerAction`
- [x] Add logging to all server actions

### Phase 3: API Routes (Week 2) ✅ COMPLETE
- [x] Migrate `app/api/cover-letter/route.ts` to `createApiHandler`
- [x] Migrate `app/api/cover-letter/[id]/route.ts` to `createApiHandler`
- [x] Migrate `app/api/cover-letter/generate/route.ts` to `createApiHandler`
- [x] Migrate `app/api/settings/api-providers/*.ts` to `createApiHandler`
- [x] Migrate `app/api/template/route.ts` to `createApiHandler`
- [x] Migrate `app/api/template/[id]/route.ts` to `createApiHandler`
- [x] Migrate `app/api/template/[id]/duplicate/route.ts` to `createApiHandler`
- [x] Migrate `app/api/profile/[id]/public/route.ts` to `createApiHandler`
- [x] Migrate `app/api/profile/[id]/export-pdf/route.ts` to `createApiHandler`
- [x] Migrate `app/api/export/pdf/route.ts` to `createApiHandler`
- [x] Replace all `console.log` with structured logger in API routes
- [x] Replace all `console.log` with structured logger in contexts

### Phase 4: Services (Week 2-3) ✅ COMPLETE
- [x] Standardize `profile.service.ts` result types
- [x] Standardize `resume.service.ts` result types
- [x] Standardize `cover-letter.service.ts` result types
- [x] Standardize `template.service.ts` result types
- [x] Standardize `api-provider.service.ts` result types
- [x] Move cache invalidation to service layer

### Phase 5: Components (Week 3) ✅ COMPLETE
- [x] Create `SimpleFormField` component (`components/ui/simple-form-field.tsx`)
- [x] Refactor `EducationForm` and `ExperienceForm` to use `SimpleFormField`
- [x] Create error boundary component (`components/error-boundary.tsx`)
- [x] Refactor `use-list-form.ts` - typed properly, added `updateItemFields`, `moveItem`, `duplicateItem`
- [x] Fix React 19 lint errors in `ResumeEditor.tsx` (setState in useEffect, ref access)
- [x] Fix `any` type in `generate/page.tsx` - use proper `Resume` import

### Phase 6: Integration (Week 3-4)
- [x] Integrate audit logging into server actions (via withServerAction)
- [ ] Add request ID tracking throughout
- [ ] Update documentation
- [ ] Run full test suite

---

## Metrics & Success Criteria

| Metric | Before | Current | Target |
|--------|--------|---------|--------|
| Duplicated auth patterns | 20+ | ~5 | 0 |
| Files with console.log | 5 | ~2 (lib only) | 0 (except seed.ts) |
| API routes with manual auth | 10 | 2 | 0 |
| Service result type variations | 4 | 1 ✅ | 1 |
| Server actions without logging | 16 | 0 ✅ | 0 |
| Lines of code in actions/* | ~300 | ~150 ✅ | ~150 |
| Lint errors | 5 | 0 ✅ | 0 |
| Lint warnings | 20+ | 15 | 0 |

---

## Progress Summary

**Last Updated**: December 2025

### Completed
- ✅ Created unified `withServerAction` wrapper with auth, logging, and audit support
- ✅ Created `ServiceResult<T>` type with helper functions
- ✅ Enhanced logger with context support (`withContext`, `forRequest`)
- ✅ Enhanced `createApiHandler` with body schema validation
- ✅ Refactored all server actions (16 total) to use new patterns
- ✅ Migrated 10+ API routes to use `createApiHandler`
- ✅ Replaced 20+ console.log statements with structured logger
- ✅ Integrated audit logging into server action wrapper
- ✅ Standardized all services to use `ServiceResult<T>` discriminated union
- ✅ Created `SimpleFormField` and `SimpleFormFieldList` components
- ✅ Created `ErrorBoundary` component with HOC and hook patterns
- ✅ Refactored `use-list-form.ts` with proper TypeScript types
- ✅ Fixed all React 19 lint errors (setState in useEffect, ref access)
- ✅ Fixed `any` types in generate page

### In Progress
- Phase 6: Integration (request ID tracking, documentation)

### Remaining
- Add request ID tracking throughout
- Update documentation
- Run full test suite

---

## Notes

- All changes should maintain backward compatibility
- Each phase should include tests
- Document any breaking changes
- Update IMPLEMENTATION_REFACTORIZATION_GUIDE.md when complete

---

**Next Steps**: Start with Phase 1 - Foundation utilities

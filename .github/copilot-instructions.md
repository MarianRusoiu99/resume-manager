# AI Coding Agent Instructions for Resume Optimizer

Resume Optimizer is an intelligent platform for AI-tailored resume optimization using Next.js 16, Prisma, OpenAI, and modern UI patterns. This guide helps AI agents understand the codebase structure, conventions, and workflows.

## Architecture Overview

### Layered Architecture Pattern
The codebase follows strict layering (not feature-based):

```
Presentation (Pages/Components) 
  → Application Layer (API Routes, Server Actions, Middleware)
    → Business Logic (Services, Validation with Zod)
      → Data Layer (Repositories, Prisma ORM, Cache)
```

**Key Principle**: Logic flows DOWN the layers only. Never have lower layers import from upper layers.

### Directory Structure
- **`app/`**: Next.js App Router with route groups: `(authenticated)`, `(public)`, `api/`
- **`components/`**: React components organized by UI area (not features) with shadcn/ui integration
- **`lib/`**: Framework-agnostic business logic
  - `services/`: Business logic with context-specific methods
  - `repositories/`: Data access layer (abstracts Prisma)
  - `validations/`: Zod schemas (JSON Resume standard)
  - `contexts/`: React contexts for global state (`EditorContext`, `ProfileContext`, `ThemeContext`)
  - `hooks/`: Custom hooks for specific concerns (preview, export, template selection)
  - `auth/`: NextAuth.js configuration and utilities
  - `ai/`: AI agents and LLM provider integration
  - `encryption/`: API key encryption utilities
- **`hooks/`**: Low-level hooks like `useIsMobile()`

## Critical Patterns & Conventions

### 1. React Hook Patterns
- **Custom Hooks**: Place hooks with their components (e.g., `useExportPDF` near `ResumePreview`)
- **Shared Hooks**: Global utilities go in `/hooks` or `/lib/hooks`
- **Context Hooks**: Always provide error-checking wrapper (e.g., `useEditor()` throws if used outside `EditorProvider`)

**Example** (`lib/contexts/EditorContext.tsx`):
```tsx
export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
```

### 2. Component Organization with Single Responsibility
Components are broken into single-responsibility pieces. Example: Resume preview is split into 5 hooks + 4 UI components:

```
ResumePreview (orchestrator)
├── useTemplateSelection (manages selected template state)
├── useResumeData (handles resume loading)
├── useExportPDF (PDF export logic)
├── usePagination (fullscreen state)
├── usePreviewScale (zoom calculations)
└── UI Components
    ├── PreviewHeader (template selector + buttons)
    ├── PreviewContent (main preview container)
    ├── PreviewState (loading/error/content states)
    └── FullscreenModal (expanded view)
```

**Benefit**: Each hook/component has ONE responsibility and is independently testable.

### 3. Form Handling with React Hook Form + Zod
All forms use:
- `react-hook-form` for state management
- `zod` for validation schemas
- Conversion helpers for data transformation

**Pattern**:
```tsx
// 1. Define schema
const schema = z.object({ name: z.string().min(1) });

// 2. Create conversion functions
function toFormData(data: DbType): FormType { ... }
function toDbData(formData: FormType): DbType { ... }

// 3. Use form with context integration
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: toFormData(initialData),
});

// 4. Update on changes
const handleChange = () => {
  const formData = form.getValues();
  onSave(toDbData(formData));
};
```

**Important**: Only reset form when NOT dirty (`!form.formState.isDirty`). Use deep comparison (`isEqual`) to prevent unnecessary resets.

### 4. Context for Global State
Three main contexts:
- **`EditorContext`**: Resume editing state, save/load callbacks, dirty tracking
- **`ProfileContext`**: Active profile, profile list, switching
- **`ThemeContext`**: Light/dark mode wrapper around `next-themes`

Always use providers in layout files (`app/(authenticated)/layout.tsx`).

### 5. Custom Hooks for Feature Logic
Hooks extract complex logic from components. Common patterns:

**Template Preview** (`lib/hooks/useTemplatePreview.ts`):
```tsx
export function useTemplatePreview({ templateId, resumeData }) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch template and render client-side
  }, [templateId, resumeData]);

  return { htmlContent, isLoading, error };
}
```

## Data Flow & API Integration

### JSON Resume Standard
Data is stored/validated against JSON Resume schema (`lib/validations/jsonresume/index.ts`):
```tsx
interface Resume {
  basics: Basics; // Name, email, location, profiles
  work: Work[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certificates: Certificate[];
  languages: Language[];
  volunteer: Volunteer[];
  awards: Award[];
  publications: Publication[];
  interests: Interest[];
  references: Reference[];
}
```

### API Routes Structure
- **External APIs**: `/api/export/pdf`, `/api/template/{id}` (stateless)
- **Internal APIs**: `/api/profile`, `/api/resume/{id}` (database-backed)
- **Swagger Docs**: `/api-docs` page auto-generates from JSDoc comments

### Profile vs Resume Distinction
- **Profile**: Master resume data per user (immutable until explicitly edited)
- **Resume**: Specific version generated from a profile for a job application

## Development Workflow

### Local Setup
```bash
npm install --legacy-peer-deps
cp .env.example .env          # Fill in DATABASE_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY
npx prisma migrate dev        # Run migrations
npm run dev                   # Start dev server at http://localhost:3000
```

### Testing
- **Unit**: `npm run test` (Vitest with jsdom)
- **E2E**: `npm run e2e` (Playwright, tests critical flows)
- **Coverage**: `npm run test:coverage`

### Build Commands
- `npm run build`: Next.js build
- `npm run lint`: ESLint check
- `npm run db:seed`: Populate database with test data

## Security Patterns

### Authentication
- **Provider**: NextAuth.js v5 with credentials
- **Session**: JWT-based, server-side validation
- **Protected Routes**: Use layout with `auth()` check, redirect to `/login` if missing session

### API Key Encryption
- User-provided keys (OpenAI, etc.) encrypted at rest in database
- Encryption key: 32-char key from `ENCRYPTION_KEY` environment variable
- Use `lib/encryption/api-key.ts` utilities for encrypt/decrypt

### Input Validation
All API endpoints validate with Zod schemas before processing.

## Common Pitfalls & Solutions

### 1. Form Data Loss on Rerender
**Problem**: Parent rerenders with new `initialData` object, form resets mid-edit.
**Solution**: Only reset if form is not dirty AND data actually changed (deep compare).
```tsx
useEffect(() => {
  const newData = basicsToFormData(initialData);
  if (initialData && !isEqual(formData, newData) && !form.formState.isDirty) {
    form.reset(newData);
  }
}, [initialData, form.formState.isDirty]);
```

### 2. Template Preview Not Updating
**Problem**: Custom template HTML changes not reflected in preview.
**Solution**: `useTemplatePreview` hook has `resumeData` as dependency—ensure resume updates trigger the hook.

### 3. Unnecessary API Calls
**Problem**: Same data fetched multiple times in one render cycle.
**Solution**: Use React's `use()` helper for promises or implement request deduplication in services.

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/contexts/EditorContext.tsx` | Global editor state, save/load orchestration |
| `lib/validations/jsonresume/index.ts` | JSON Resume schema (single source of truth for resume shape) |
| `components/resume/ResumePreview.tsx` | Unified preview component (template preview, PDF export, fullscreen) |
| `components/editor/ResumeEditor.tsx` | Main editor UI with tabs (basics, experience, skills, etc.) |
| `lib/hooks/useTemplatePreview.ts` | Template rendering (client-side, no server round-trip) |
| `components/resume/preview/useExportPDF.ts` | PDF export via universal server API |
| `app/(authenticated)/layout.tsx` | Protected route wrapper with providers |
| `prisma/schema.prisma` | Database schema (users, profiles, resumes, templates) |

## Debugging Tips

- **Form not updating**: Check `form.formState.isDirty` and `watch()` the field
- **Preview blank**: Check browser console for JS errors; verify template ID exists
- **Save not persisting**: Verify `EditorContext.save()` returns success; check database
- **Auth redirect loop**: Ensure session is being created correctly; check NextAuth config

## Before Making Changes

1. **Check existing patterns**: If similar feature exists, follow same pattern
2. **Layering respect**: Never import from presentation layer in business logic
3. **Validation first**: Define Zod schema before API/component
4. **Test coverage**: Add tests for business logic; E2E for critical flows
5. **TypeScript strict mode**: All code must pass `typescript: true`

---

**Last Updated**: December 2025  
**Next.js Version**: 16  
**React Version**: 19.2.0

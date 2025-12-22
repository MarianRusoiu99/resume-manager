pl# Copilot Instructions (Resume Manager)

## Big picture (follow the layering)
- **UI**: `app/` + `components/` (rendering + local state only).
- **Authenticated mutations**: prefer **Server Actions** in `app/actions/*` wrapped by `withServerAction` (`lib/actions/with-server-action.ts`).
- **APIs**: `app/api/**` (and versioned `app/api/v1/**`) for public/external integrations, streaming, webhooks, and “unavoidable fetch”.
- **Business logic**: `lib/services/*` returning `ServiceResult` (`lib/types/service-result.ts`).
- **Data access**: `lib/repositories/*` (Prisma-only), backed by `prisma/schema.prisma`.
- **Auth DAL**: `lib/auth/dal.ts` provides `verifySession()` and `getSession()` for server-side auth checks.

## Hard repo rules (enforced)
- **No cross-layer imports**: `lib/*` must not import from `app/*` or `components/*` (see `eslint.config.mjs`).
- **Avoid service-to-service imports**: files under `lib/services/*` importing another `*.service` are warned (prefer workflows/orchestrators).
- **Dependency Injection**: Use `ServiceContainer.getInstance()` from `lib/services/container.ts` to access services instead of importing singletons directly.
- **Server-only**: Use `import 'server-only'` in DAL and repositories to prevent accidental client-side usage.

## Server Actions pattern (authenticated UI writes)
- Wrap actions with `withServerAction(actionName, handler, options)`.
- Handlers may return either a value **or** a `ServiceResult<T>`; wrapper converts to `ActionResult<T>`.

Example:
```ts
export const updateProfile = withServerAction(
  'updateProfile',
  async (session, profileId: string, input) => profileService.updateProfile(profileId, session.user.id, input),
  { auditAction: 'PROFILE_UPDATE', revalidatePaths: ['/profile'] }
);
```

## API routes pattern (validation + envelope)
- Always use `createApiHandler` (`lib/api-handler.ts`).
- Prefer `bodySchema` from `lib/validations/api-schemas.ts`.
- API handlers may return a `ServiceResult<T>` directly; it’s converted to an HTTP response.
- `createApiHandler` also attaches a request id and may wrap JSON into a consistent envelope.

Example:
```ts
export const PATCH = createApiHandler(
  async (_req, { params }, session, body) => resumeService.updateResume((await params).id, session.user.id, body ?? {}),
  { bodySchema: updateResumeContentSchema, verifyUser: true }
);
```

## Service Layer pattern (business logic)
- Use `withServiceError(operationName, handler, options)` from `lib/services/utils/service-wrapper.ts`.
- Throw typed errors (e.g., `NotFoundError`, `ValidationError`) from `lib/errors` inside the handler.
- Return raw data; `withServiceError` wraps it in a `ServiceResult<T>`.

Example:
```ts
async getProfile(id: string): Promise<ServiceResult<Profile>> {
  return withServiceError('fetch profile', async () => {
    const profile = await this.repository.findById(id);
    if (!profile) throw new NotFoundError('Profile');
    return profile;
  });
}
```

## Validation source of truth
- Central API schemas live in `lib/validations/api-schemas.ts` (profile/template/resume/cover-letter/providers/notifications).
- Don’t copy Zod schemas into routes; reuse the shared schema.

## Developer workflows
```bash
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run build        # Build for production
npm run test         # Run unit tests (Vitest)
npm run test:ui      # Run Vitest UI
npm run db:seed      # Seed the database
npx prisma migrate dev # Run database migrations
```
- Local DB setup: `DATABASE_URL` required in `.env`.
- Path alias: `@/*` maps to repo root (`tsconfig.json`).

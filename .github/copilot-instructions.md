pl# Copilot Instructions (Resume Manager)

## Big picture (follow the layering)
- **UI**: `app/` + `components/` (rendering + local state only).
- **Authenticated mutations**: prefer **Server Actions** in `app/actions/*` wrapped by `withServerAction` (`lib/actions/with-server-action.ts`).
- **APIs**: `app/api/**` (and versioned `app/api/v1/**`) for public/external integrations, streaming, webhooks, and “unavoidable fetch”.
- **Business logic**: `lib/services/*` returning `ServiceResult` (`lib/types/service-result.ts`).
- **Data access**: `lib/repositories/*` (Prisma-only), backed by `prisma/schema.prisma`.

## Hard repo rules (enforced)
- **No cross-layer imports**: `lib/*` must not import from `app/*` or `components/*` (see `eslint.config.mjs`).
- **Avoid service-to-service imports**: files under `lib/services/*` importing another `*.service` are warned (prefer workflows/orchestrators).

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

## Validation source of truth
- Central API schemas live in `lib/validations/api-schemas.ts` (profile/template/resume/cover-letter/providers/notifications).
- Don’t copy Zod schemas into routes; reuse the shared schema.

## Errors & results
- Services typically return `ServiceResult<T>`; the API layer maps it to HTTP via `createApiHandler`.
- Typed errors live in `lib/errors/*` (e.g. `NotFoundError`, `ValidationError`); wrappers (`createApiHandler`, `withServerAction`) normalize unknown errors.

## Developer workflows
```bash
npm run dev
npm run lint
npm run build
npm run test
npm run test:ui
npm run db:seed
```
- Local DB setup: `npx prisma migrate dev` (see `README.md`), `DATABASE_URL` required.
- Path alias: `@/*` maps to repo root (`tsconfig.json`).

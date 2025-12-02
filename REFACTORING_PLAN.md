# Refactoring Plan: Consistency, DRY, and Logging

This plan outlines the steps to refactor the Resume Optimizer application. The goals are to standardize code patterns, reduce redundancy, improve type safety while maintaining flexibility for missing data, and implement comprehensive logging.

## Phase 1: Type Definitions & Validation (High Priority)

**Problem:**
Currently, the Zod schemas in `lib/validations/jsonresume/index.ts` define entity schemas as optional (e.g., `const workSchema = z.object({...}).optional()`).
This results in array types like `(Work | undefined)[]`, forcing frontend components to constantly check for `undefined` items (e.g., `experiences.filter(e => !!e)`).

**Solution:**
Refactor the schemas to define the *object* as required, but keep the *fields* within it optional. This aligns with the requirement to handle missing/unfilled data (fields can be empty) without complicating the array structure.

**Changes:**

- Update `lib/validations/jsonresume/index.ts`:
  - Remove `.optional()` from individual schema definitions (`workSchema`, `educationSchema`, etc.).
  - Keep `.optional()` on the *usage* of these schemas in arrays (e.g., `work: z.array(workSchema).optional()`).
- **Result:** `type Work` becomes `{ name?: string, ... }` instead of `{...} | undefined`. Arrays become `Work[] | undefined`.

## Phase 2: API Standardization

**Goal:**
Migrate all API routes to use the `createApiHandler` wrapper. This ensures consistent:

- **Authentication:** Centralized session checks.
- **Logging:** Automatic request/response and error logging.
- **Error Handling:** Standardized error responses (401, 404, 500).

**Target Routes:**

1. **Resume Operations:**
    - `app/api/resume/[id]/content/route.ts`
    - `app/api/resume/[id]/duplicate/route.ts`
    - `app/api/resume/[id]/preview/route.ts`
    - `app/api/resume/[id]/template/route.ts`
    - `app/api/resume/generate/route.ts`
    - `app/api/resume/import/route.ts`
2. **Profile Operations:**
    - `app/api/profile/route.ts`
    - `app/api/profile/[id]/route.ts`
    - `app/api/profile/[id]/public/route.ts`
3. **Cover Letter Operations:**
    - `app/api/cover-letter/route.ts`
    - `app/api/cover-letter/[id]/route.ts`
    - `app/api/cover-letter/generate/route.ts`
4. **Settings & Auth:**
    - `app/api/settings/api-providers/route.ts`
    - `app/api/auth/register/route.ts` (Note: Public route, use `{ isPublic: true }`)

## Phase 3: Form Component Standardization (DRY)

**Goal:**
Refactor all list-based form components to use the `useListForm` hook and `FormList` component. This removes massive amounts of duplicated code for adding, removing, and updating array items.

**Target Components (`components/editor/forms/`):**

- [x] `ExperienceForm.tsx` (Completed)
- [x] `EducationForm.tsx` (Completed)
- [ ] `ProjectsForm.tsx`
- [ ] `SkillsForm.tsx`
- [ ] `VolunteerForm.tsx`
- [ ] `AwardsForm.tsx`
- [ ] `CertificationsForm.tsx`
- [ ] `PublicationsForm.tsx`
- [ ] `LanguagesForm.tsx`
- [ ] `InterestsForm.tsx`
- [ ] `ReferencesForm.tsx`

## Phase 4: Service Layer & Logging

**Goal:**
Ensure the service layer (business logic) is clean and uses the new logger.

**Changes:**

- Scan `lib/services/` files.
- Replace `console.log/error` with `logger.info/error`.
- Ensure services throw standard `Error` objects that `createApiHandler` can catch and log appropriately.

## Execution Strategy

1. **Approve Plan:** Review and confirm this plan.
2. **Execute Phase 1:** Fix the Zod types. This might cause temporary type errors in components that expect `undefined`, which we will fix immediately.
3. **Execute Phase 3 (Forms):** Refactor the remaining forms. This benefits immediately from the Type fixes in Phase 1.
4. **Execute Phase 2 (API):** Systematically refactor API routes.
5. **Execute Phase 4 (Services):** Final polish on logging and error handling.

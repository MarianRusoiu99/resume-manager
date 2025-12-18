# Refactor + Build-Time Optimization Tracker

Purpose: keep the codebase consistent/coherent, more reusable/modular, and reduce build time.

> Notes
> - Use this as a living checklist.
> - Prefer small PR-sized steps.
> - Record before/after measurements for build improvements.

---

## Build-Time Optimization (Target: < 60s local build)

### Baseline
- [ ] Record machine specs (CPU/RAM) and Node version
- [ ] Record build command used: `npm run build`
- [ ] Record cold build time (no `.next/`): ____
- [ ] Record warm build time (cached): ____
- [ ] Confirm bundler: Turbopack vs Webpack

### Quick Wins (Safe)
- [ ] Externalize heavy server-only deps from bundling (e.g., `puppeteer`)
- [ ] Ensure API-docs/swagger generation is runtime-only (no build-time work)
- [ ] Reduce `transpilePackages` list to absolute minimum
- [ ] Enable `experimental.optimizePackageImports` where appropriate
- [ ] Add `modularizeImports` rules for icon/libs with many exports (e.g. `lucide-react`)
- [ ] Avoid importing server-only modules in shared entrypoints (RSC/client)

### Next Build Profiling
- [ ] Run `next build --debug` and capture slow steps
- [ ] Check route generation count and identify expensive routes
- [ ] Identify any build-time code that hits DB/network
- [ ] Confirm no heavy parsing on module import (e.g. template registry, swagger docs)

### Heavier/Optional
- [ ] Split large routes/pages with `dynamic()` imports
- [ ] Reduce server bundle size with dependency trimming
- [ ] Consider moving PDF generation behind external worker/service (if needed)

### Measurement Log
| Date | Change | Build (s) cold | Build (s) warm | Notes |
|------|--------|----------------|----------------|-------|
|      | Baseline |                |                |       |

---

## Consistency + Coherence Refactors

### 1) Clear module boundaries (feature-first)
Goal: make it obvious where feature code lives and prevent cross-layer coupling.
- [ ] Define module boundary rules (what can import what)
- [ ] Pick a convention for feature code location (e.g. `lib/features/<feature>`)
- [ ] Keep `app/` routes thin (compose + call services/actions)
- [ ] Co-locate feature hooks/components/types where they belong

### 2) Normalize naming + folder conventions
Goal: one obvious way to name and place similar things.
- [ ] Standardize suffixes: `*.service.ts`, `*.repository.ts`, `*.schema.ts`, `*.types.ts`
- [ ] Standardize server action naming + location
- [ ] Decide when to use `.client.tsx` and apply consistently

### 3) Define stable “ports” between layers (DTOs)
Goal: reduce implicit contracts and improve reuse.
- [ ] Introduce `Input`/`Output` DTO types per action/API endpoint
- [ ] Validate inputs at the boundary (server action / route handler)
- [ ] Ensure services accept validated DTOs (not raw request objects)

### 4) Unify validation strategy
Goal: single source of truth for validation.
- [ ] Share schemas between client forms and server actions when possible
- [ ] Ensure each boundary validates exactly once
- [ ] Remove duplicated schema definitions across features

### 5) Standardize API responses + error handling
Goal: consistent error shape and fewer bespoke `try/catch` patterns.
- [ ] Establish canonical `Result<T>` / `AppError` pattern
- [ ] Centralize error -> HTTP mapping
- [ ] Apply consistently across `app/api/*` and server actions

### 6) De-duplicate cross-cutting concerns
Auth/rate-limit/telemetry/logging should be composed, not reimplemented.
- [ ] Create wrappers (e.g., `withAuth`, `withRateLimit`, `withTelemetry`)
- [ ] Ensure every API route uses same wrapper stack

### 7) Standardize data-fetching hook “shape”
Goal: predictable hook APIs and reuse.
- [ ] Decide hook style (lean SWR-like vs controller hooks)
- [ ] Align existing hooks to the chosen pattern

### 8) Separate UI primitives vs feature components
Goal: prevent re-implementing shared patterns.
- [ ] Extract shared states: empty/loading/error components
- [ ] Consolidate confirm/delete dialogs and toast patterns

### 9) Template system boundaries
Goal: avoid UI importing template engine internals.
- [ ] Keep template registry/rendering in `lib/templates/*`
- [ ] Keep selection/preview UI in `components/templates/*`
- [ ] Enforce one-direction dependencies

### 10) Barrel exports (sparingly)
Goal: clean imports without hiding dependencies.
- [ ] Add barrel exports only at module boundaries
- [ ] Avoid deep “mega-barrels” that cause circular imports

### 11) Unified caching strategy
Goal: one mental model for cache get/set/invalidate.
- [ ] Define cache interface + key conventions
- [ ] Keep invalidation in services (not UI)

### 12) “Thin routes, fat services” rule
Goal: consistent entrypoints and reusable domain logic.
- [ ] Ensure routes/actions only: validate -> call service -> map response
- [ ] Move business logic into services/workflows

---

## Priority Order (suggested)
1. Build-time quick wins + measurement
2. Error handling + response shape
3. Validation unification
4. Feature boundary cleanup (move/co-locate)
5. Hook standardization
6. Template boundary cleanup

## Decisions (Current)
- Architecture: keep `lib/services/*`, but enforce cleaner boundaries.
- Optimization goal: strict architecture boundaries (consistency over convenience).
- Validation: `npm run build` (includes lint). No test suite currently.

## Open Questions
- [ ] Do you want a dedicated `lib/features/*` layer later (wrapping services/repositories), or keep a service-only structure long-term?
- [ ] Should we codify boundaries with TypeScript path aliases + ESLint import rules per layer?

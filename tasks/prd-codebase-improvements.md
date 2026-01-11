# PRD: Codebase Quality Improvements

## Introduction

This PRD addresses critical improvements identified in the codebase evaluation report (Overall Score: 8.1/10). The work focuses on three areas: data integrity and reliability, test coverage for critical paths, and code organization/cleanup. These improvements will elevate the codebase from "Very Good" to production-ready with robust reliability guarantees.

## Goals

- Eliminate race conditions and data corruption risks in multi-step operations
- Achieve comprehensive test coverage for critical business logic (services, repositories, workflows)
- Improve cache coherence with distributed locking
- Consolidate type definitions and standardize code patterns
- Ensure all components follow consistent conventions

## Phase 1: Critical Fixes (Data Integrity & Reliability)

### US-101: Add Transaction Wrapper Utility
**Description:** As a developer, I need a reusable transaction wrapper so that multi-step operations are atomic.

**Acceptance Criteria:**
- [ ] Create `lib/db/transaction.ts` with `withTransaction<T>()` helper
- [ ] Helper accepts callback with transaction client
- [ ] Proper error handling and rollback on failure
- [ ] Typecheck passes

### US-102: Fix Default Profile Race Condition
**Description:** As a user, I need default profile operations to be atomic so I don't lose my default when concurrent requests occur.

**Acceptance Criteria:**
- [ ] Wrap `unsetAllDefaults()` + `update()` in `profiles.service.ts` in a transaction
- [ ] Wrap `setDefaultProfile()` in a transaction
- [ ] Wrap profile creation with `isDefault: true` in a transaction
- [ ] Existing profile tests pass
- [ ] Typecheck passes

### US-103: Add Transactions to Profile Deletion
**Description:** As a user, I need profile deletion to be atomic so that default reassignment doesn't fail partially.

**Acceptance Criteria:**
- [ ] Wrap delete + reassign-default logic in transaction
- [ ] Count check, delete, and reassign are atomic
- [ ] Typecheck passes

### US-104: Add Transactions to AI Settings Operations
**Description:** As a developer, I need AI settings multi-model updates to be transactional.

**Acceptance Criteria:**
- [ ] Review `ai-settings.repository.ts` for multi-step operations
- [ ] Wrap compound operations in transactions (beyond existing one at line 172)
- [ ] Typecheck passes

### US-105: Implement Distributed Locking for Cache
**Description:** As a system, I need distributed locking so concurrent requests don't read stale cache data.

**Acceptance Criteria:**
- [ ] Create `lib/cache/distributed-lock.ts` with Redis-based locking
- [ ] Implement `acquireLock(key, ttl)` and `releaseLock(key)` functions
- [ ] Add lock acquisition to critical cache invalidation paths
- [ ] Fallback behavior when lock acquisition fails
- [ ] Typecheck passes

### US-106: Add Cache Lock to Profile Operations
**Description:** As a user, I need profile cache operations to be consistent under concurrent access.

**Acceptance Criteria:**
- [ ] Wrap profile cache invalidation with distributed lock
- [ ] Lock key based on userId
- [ ] Typecheck passes

## Phase 2: Test Coverage (Critical Paths)

### US-201: Create Test Infrastructure Utilities
**Description:** As a developer, I need test utilities so I can write tests efficiently.

**Acceptance Criteria:**
- [ ] Create `__tests__/utils/test-factories.ts` with factory functions for common entities
- [ ] Create `__tests__/utils/mock-prisma.ts` for database mocking
- [ ] Create `__tests__/utils/mock-redis.ts` for cache mocking
- [ ] Document usage in test files
- [ ] Typecheck passes

### US-202: Add Resume Service Tests
**Description:** As a developer, I need resume service tests so business logic is verified.

**Acceptance Criteria:**
- [ ] Create `__tests__/lib/services/resumes.service.test.ts`
- [ ] Test CRUD operations
- [ ] Test validation failures
- [ ] Test error handling paths
- [ ] Typecheck passes

### US-203: Add Cover Letter Service Tests
**Description:** As a developer, I need cover letter service tests for business logic verification.

**Acceptance Criteria:**
- [ ] Create `__tests__/lib/services/cover-letters.service.test.ts`
- [ ] Test CRUD operations
- [ ] Test validation and error handling
- [ ] Typecheck passes

### US-204: Add AI Settings Service Tests
**Description:** As a developer, I need AI settings service tests for configuration logic.

**Acceptance Criteria:**
- [ ] Create `__tests__/lib/services/ai-settings.service.test.ts`
- [ ] Test model preference operations
- [ ] Test API key operations (mock encryption)
- [ ] Typecheck passes

### US-205: Add Resume Repository Tests
**Description:** As a developer, I need resume repository tests for data access verification.

**Acceptance Criteria:**
- [ ] Create `__tests__/lib/repositories/resumes.repository.test.ts`
- [ ] Test mapping from Prisma to domain types
- [ ] Test query builders
- [ ] Typecheck passes

### US-206: Add Cover Letter Repository Tests
**Description:** As a developer, I need cover letter repository tests.

**Acceptance Criteria:**
- [ ] Create `__tests__/lib/repositories/cover-letters.repository.test.ts`
- [ ] Test CRUD operations with mocked Prisma
- [ ] Test relationship handling
- [ ] Typecheck passes

### US-207: Add Workflow Engine Tests
**Description:** As a developer, I need workflow engine tests so AI orchestration is verified.

**Acceptance Criteria:**
- [ ] Create `__tests__/lib/workflows/workflow-engine.test.ts`
- [ ] Test workflow execution flow
- [ ] Test progress tracking
- [ ] Test error handling and retries
- [ ] Mock AI provider responses
- [ ] Typecheck passes

### US-208: Add Encryption Tests
**Description:** As a developer, I need encryption logic tests for security verification.

**Acceptance Criteria:**
- [ ] Create `__tests__/lib/encryption/crypto.test.ts`
- [ ] Test encrypt/decrypt round-trip
- [ ] Test with various input sizes
- [ ] Test error cases (invalid data, wrong key)
- [ ] Typecheck passes

### US-209: Add Integration Tests for Profile Workflow
**Description:** As a developer, I need integration tests for the complete profile creation flow.

**Acceptance Criteria:**
- [ ] Create `__tests__/integration/profile-workflow.test.ts`
- [ ] Test profile creation → document creation → default setting
- [ ] Use test database or comprehensive mocks
- [ ] Typecheck passes

### US-210: Add Integration Tests for Resume Generation
**Description:** As a developer, I need integration tests for resume generation workflow.

**Acceptance Criteria:**
- [ ] Create `__tests__/integration/resume-generation.test.ts`
- [ ] Test end-to-end generation flow with mocked AI
- [ ] Verify persistence and cache behavior
- [ ] Typecheck passes

## Phase 3: Code Cleanup & Standardization

### US-301: Consolidate Type Definitions
**Description:** As a developer, I need type definitions in consistent locations so the codebase is navigable.

**Acceptance Criteria:**
- [ ] Move scattered types from `lib/actions/types.ts` to `lib/types/`
- [ ] Organize by domain: `lib/types/profile.ts`, `lib/types/resume.ts`, etc.
- [ ] Update all imports to use new locations
- [ ] Remove duplicate type definitions
- [ ] Typecheck passes

### US-302: Standardize Import Patterns
**Description:** As a developer, I need consistent import patterns across the codebase.

**Acceptance Criteria:**
- [ ] Use `@/` alias for all cross-module imports
- [ ] Use relative imports only within same directory
- [ ] Update ESLint rules to enforce pattern
- [ ] Fix all existing violations
- [ ] Lint passes

### US-303: Add Readonly Props to Components
**Description:** As a developer, I need consistent use of Readonly<Props> for type safety.

**Acceptance Criteria:**
- [ ] Audit all component files for Props types
- [ ] Add `Readonly<>` wrapper where missing
- [ ] Prioritize components in `components/` directory
- [ ] Typecheck passes

### US-304: Flatten Deep Component Nesting
**Description:** As a developer, I need flatter component structure for easier navigation.

**Acceptance Criteria:**
- [ ] Identify components nested more than 3 levels deep
- [ ] Refactor to maximum 3 levels where reasonable
- [ ] Update imports accordingly
- [ ] Typecheck passes

### US-305: Create Barrel Exports for Lib Modules
**Description:** As a developer, I need barrel exports for cleaner imports.

**Acceptance Criteria:**
- [ ] Add `index.ts` to `lib/services/` exporting all services
- [ ] Add `index.ts` to `lib/repositories/` exporting all repositories
- [ ] Add `index.ts` to `lib/types/` exporting all types
- [ ] Update key imports to use barrel exports
- [ ] Typecheck passes

## Functional Requirements

### Phase 1: Data Integrity
- FR-1: All multi-step database operations MUST use Prisma transactions
- FR-2: Default profile operations MUST be atomic (unset + set in single transaction)
- FR-3: Profile deletion with reassignment MUST be transactional
- FR-4: Cache invalidation MUST use distributed locking for critical operations
- FR-5: Lock acquisition MUST have timeout and fallback behavior

### Phase 2: Testing
- FR-6: All service classes MUST have corresponding test files
- FR-7: All repository classes MUST have corresponding test files
- FR-8: Tests MUST mock external dependencies (database, cache, AI providers)
- FR-9: Critical workflows MUST have integration tests
- FR-10: Test factories MUST exist for all domain entities

### Phase 3: Cleanup
- FR-11: Type definitions MUST be organized in `lib/types/` by domain
- FR-12: Cross-module imports MUST use `@/` alias
- FR-13: Component props MUST use `Readonly<Props>` pattern
- FR-14: Component nesting MUST NOT exceed 3 levels
- FR-15: Major lib directories MUST have barrel exports

## Non-Goals

- No new features or functionality added
- No database schema migrations
- No changes to API contracts
- No UI/UX changes
- No performance optimizations beyond cache coherence
- No changes to authentication/authorization logic
- No upgrade of dependencies

## Technical Considerations

- **Transaction Helper:** Use Prisma's `$transaction` with callback pattern for type safety
- **Distributed Locking:** Use Redis `SET NX EX` pattern with automatic expiration
- **Lock TTL:** Default 5 seconds, configurable per operation
- **Test Framework:** Vitest (already configured)
- **Mocking:** Use vitest mocking capabilities, avoid test database in unit tests
- **Integration Tests:** Consider using Prisma test utilities or dedicated test database

### Existing Patterns to Follow
```typescript
// Service result pattern
type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

// Repository pattern
class GenericRepository<T> { ... }

// Service wrapper
withServiceError(async () => { ... })
```

### Transaction Pattern to Implement
```typescript
// lib/db/transaction.ts
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
}

// Usage in service
await withTransaction(async (tx) => {
  await tx.profile.updateMany({ where: { userId }, data: { isDefault: false } });
  await tx.profile.update({ where: { id }, data: { isDefault: true } });
});
```

## Success Metrics

- Zero race conditions in profile default operations (verifiable via concurrent test)
- All multi-step operations wrapped in transactions (code review checklist)
- Test coverage for services: 100% of service files have tests
- Test coverage for repositories: 100% of repository files have tests
- All type definitions consolidated (zero files in `lib/actions/types.ts`)
- ESLint import rules passing with zero violations
- Build and typecheck passing with zero errors

## Open Questions

1. Should we add a database-level advisory lock in addition to Redis distributed lock?
2. What is the acceptable lock wait timeout before falling back?
3. Should integration tests use a separate test database or remain fully mocked?
4. Are there specific components that should NOT be refactored for nesting depth?
5. Should we add a pre-commit hook to enforce import patterns?

## Implementation Order

```
Phase 1 (Week 1-2): Critical Fixes
├── US-101: Transaction wrapper (blocker for others)
├── US-102: Profile race condition
├── US-103: Profile deletion transactions
├── US-104: AI settings transactions
├── US-105: Distributed locking infrastructure
└── US-106: Cache lock integration

Phase 2 (Week 2-3): Test Coverage
├── US-201: Test infrastructure (blocker for others)
├── US-202-206: Service and repository tests (parallel)
├── US-207-208: Workflow and encryption tests (parallel)
└── US-209-210: Integration tests (after unit tests)

Phase 3 (Week 3-4): Cleanup
├── US-301: Type consolidation
├── US-302: Import standardization
├── US-303-304: Component cleanup (parallel)
└── US-305: Barrel exports
```

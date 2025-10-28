# End-to-End Tests

This directory contains Playwright E2E tests for the Resume Optimizer platform.

## Overview

The E2E tests cover critical user flows from registration to PDF export, ensuring the application works correctly from a user's perspective.

## Test Suites

### 1. User Flow Tests (`user-flow.spec.ts`)
Complete user journey testing:
- ✅ User registration
- ✅ Login and authentication
- ✅ Profile creation
- ✅ Resume generation
- ✅ Resume viewing and management
- ✅ PDF export
- ✅ Session persistence
- ✅ Error handling (invalid credentials, incomplete forms)

### 2. Cover Letter Tests (`cover-letter.spec.ts`)
Cover letter functionality:
- ✅ Standalone cover letter generation
- ✅ Copy cover letter text
- ✅ Export cover letter as PDF
- ✅ Cover letter with resume generation
- ✅ Edge cases (missing job description)

### 3. Template Tests (`template-customization.spec.ts`)
Template selection and customization:
- ✅ Template gallery browsing
- ✅ Template preview
- ✅ Template selection during generation
- ✅ Change template after generation
- ✅ Customize colors and fonts
- ✅ Live preview of customizations
- ✅ Reset to default styling
- ✅ PDF export with custom styling

## Running Tests

### Prerequisites

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Database setup**:
   Ensure PostgreSQL is running and database is migrated:
   ```bash
   docker-compose up -d  # If using Docker
   npx prisma migrate deploy
   ```

3. **Environment variables**:
   Ensure `.env` file has required variables:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret
   OPENAI_API_KEY=sk-...  # For dev mode
   ENCRYPTION_KEY=your-encryption-key
   ```

### Run All E2E Tests

```bash
npm run e2e
```

### Run Tests by Browser

```bash
# Chromium only
npm run e2e:chromium

# Firefox only
npm run e2e:firefox

# WebKit/Safari only
npm run e2e:webkit
```

### Run Tests in UI Mode (Interactive)

```bash
npm run e2e:ui
```

This opens Playwright's interactive test runner where you can:
- See tests running in real-time
- Inspect elements
- Debug failures
- Time-travel through test steps

### Run Tests in Headed Mode (See Browser)

```bash
npm run e2e:headed
```

Watch tests execute in actual browser windows.

### View Test Report

After running tests, view the HTML report:

```bash
npm run e2e:report
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Timeout**: 60 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Auto-start**: Dev server starts automatically before tests
- **Artifacts**: Screenshots on failure, videos on failure, traces on retry

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { registerUser, createProfile } from './utils';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Your test code here
  });
});
```

### Available Utilities (`utils.ts`)

- `generateTestEmail()` - Generate unique test email
- `registerUser(page, email, password, name)` - Register new user
- `loginUser(page, email, password)` - Login existing user
- `createProfile(page)` - Create complete user profile
- `configureAPIKey(page, apiKey)` - Configure OpenAI API key
- `generateResume(page, jobDescription, jobTitle, companyName)` - Generate resume
- `exportPDF(page)` - Export resume as PDF
- `goToResumesList(page)` - Navigate to resumes list
- `selectTemplate(page, templateName)` - Select a template
- `waitForToast(page, message)` - Wait for toast notification

### Best Practices

1. **Use test.step() for complex tests**:
   ```typescript
   await test.step('Register user', async () => {
     await registerUser(page, email, password, name);
   });
   ```

2. **Wait for content, not timeouts**:
   ```typescript
   // Good
   await expect(page.locator('text="Success"')).toBeVisible();
   
   // Avoid
   await page.waitForTimeout(5000);
   ```

3. **Use data attributes for stability**:
   ```typescript
   await page.click('[data-testid="submit-button"]');
   ```

4. **Handle dynamic content**:
   ```typescript
   const element = page.locator('text=/success|completed/i');
   await expect(element).toBeVisible({ timeout: 30000 });
   ```

5. **Clean up test data**:
   Each test creates new user accounts. Use unique emails to avoid conflicts.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run E2E tests
        run: npm run e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          NEXTAUTH_URL: http://localhost:3000
          NEXTAUTH_SECRET: test-secret
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ENCRYPTION_KEY: test-encryption-key
      
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests Timeout

- Increase timeout in `playwright.config.ts`
- Check if dev server is running (`npm run dev`)
- Verify database is accessible
- Check OpenAI API key is valid (for resume generation tests)

### Browser Installation Issues

Install system dependencies:
```bash
npx playwright install-deps
```

### Database Connection Errors

Ensure PostgreSQL is running:
```bash
docker-compose up -d
npx prisma migrate deploy
```

### Authentication Failures

- Check `NEXTAUTH_SECRET` is set
- Verify database has `User` and `Session` tables
- Check password hashing is working (bcrypt)

### API Key Issues

In development mode, the system uses `OPENAI_API_KEY` from `.env`:
- Ensure the key is valid
- Check key has sufficient credits
- Verify network connectivity to OpenAI API

## Test Coverage

Current E2E test coverage:

| Feature | Tests | Status |
|---------|-------|--------|
| Authentication | 5 tests | ✅ Complete |
| Profile Management | 3 tests | ✅ Complete |
| Resume Generation | 6 tests | ✅ Complete |
| PDF Export | 3 tests | ✅ Complete |
| Cover Letters | 5 tests | ✅ Complete |
| Templates | 8 tests | ✅ Complete |
| Error Handling | 4 tests | ✅ Complete |

**Total**: 34 E2E tests across 3 test files

## Performance Expectations

Typical test execution times:

- User flow tests: 30-60 seconds
- Cover letter tests: 20-40 seconds
- Template tests: 25-50 seconds
- Full suite (all browsers): 5-10 minutes

Resume generation tests take longer due to OpenAI API calls (10-30 seconds per generation).

## Next Steps

To expand E2E coverage, consider adding tests for:

- [ ] Resume content editing
- [ ] Resume version control (duplicate, revert)
- [ ] Admin template management
- [ ] API key management UI
- [ ] Multi-device responsive testing
- [ ] Accessibility (a11y) testing
- [ ] Performance testing (Lighthouse)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI Configuration](https://playwright.dev/docs/ci)

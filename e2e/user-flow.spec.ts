import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  registerUser,
  loginUser,
  createProfile,
  generateResume,
  exportPDF,
  goToResumesList,
} from './utils';

/**
 * E2E Test: Complete User Flow
 * 
 * Tests the critical path from registration to PDF export:
 * 1. User registration
 * 2. Login
 * 3. Profile creation
 * 4. Resume generation
 * 5. Resume viewing
 * 6. PDF export
 */

test.describe('Complete User Flow', () => {
  const testEmail = generateTestEmail();
  const testPassword = 'TestPassword123!';
  const testName = 'John Doe';

  test('should complete full user journey from registration to PDF export', async ({ page }) => {
    // Step 1: Register a new user
    await test.step('Register new user', async () => {
      await registerUser(page, testEmail, testPassword, testName);
      
      // Verify we're on dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
    });

    // Step 2: Create a complete profile
    await test.step('Create user profile', async () => {
      await createProfile(page);
      
      // Verify profile was saved
      await expect(page.locator('text=/profile (saved|updated)/i'))
        .toBeVisible({ timeout: 10000 });
    });

    // Step 3: Generate a resume
    await test.step('Generate resume', async () => {
      const jobDescription = `
We are seeking a Senior Software Engineer to join our team.

Requirements:
- 5+ years of software development experience
- Strong proficiency in JavaScript/TypeScript
- Experience with React and Node.js
- Knowledge of PostgreSQL and database design
- Excellent problem-solving skills

Responsibilities:
- Design and implement scalable web applications
- Collaborate with cross-functional teams
- Mentor junior developers
- Write clean, maintainable code
      `.trim();

      await generateResume(page, jobDescription, 'Senior Software Engineer', 'Tech Innovations Inc');
      
      // Should be on resume detail page or see success message
      await expect(page.locator('text=/resume|summary|experience/i')).toBeVisible();
    });

    // Step 4: View resumes list
    await test.step('View resumes list', async () => {
      await goToResumesList(page);
      
      // Verify resume appears in list
      await expect(page.locator('text="Senior Software Engineer"')).toBeVisible();
      await expect(page.locator('text="Tech Innovations Inc"')).toBeVisible();
    });

    // Step 5: Click on resume to view details
    await test.step('View resume details', async () => {
      // Click on the first resume
      await page.locator('text="Senior Software Engineer"').first().click();
      
      // Wait for detail page to load
      await page.waitForLoadState('networkidle');
      
      // Verify resume content is displayed
      await expect(page.locator('text=' + testName)).toBeVisible();
      await expect(page.locator('text="Senior Software Engineer"')).toBeVisible();
      await expect(page.locator('text="Tech Corp"')).toBeVisible();
    });

    // Step 6: Export PDF
    await test.step('Export resume as PDF', async () => {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
      
      // Click export button
      await page.click('button:has-text("Export PDF")');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download filename
      expect(download.suggestedFilename()).toMatch(/resume.*\.pdf/i);
      
      // Verify download completed
      const path = await download.path();
      expect(path).toBeTruthy();
    });
  });

  test('should allow user to logout and login again', async ({ page }) => {
    // Login with previously created user
    await loginUser(page, testEmail, testPassword);
    
    // Verify we're logged in
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout (assuming it's in user menu)
    await page.click('button:has-text("Logout"), a:has-text("Logout")');
    
    // Verify we're logged out and redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should persist profile data across sessions', async ({ page }) => {
    // Login
    await loginUser(page, testEmail, testPassword);
    
    // Navigate to profile
    await page.goto('/profile');
    
    // Verify profile data is still there
    await expect(page.locator('input[name="phone"]')).toHaveValue('+1-555-0123');
    await expect(page.locator('input[name="location"]')).toHaveValue('San Francisco, CA');
    await expect(page.locator('input[name="experiences.0.position"]')).toHaveValue('Senior Software Engineer');
  });
});

test.describe('Error Handling', () => {
  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for incomplete registration', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=/required|invalid/i')).toBeVisible();
  });

  test('should prevent resume generation without profile', async ({ page }) => {
    // Register new user without profile
    const email = generateTestEmail();
    await registerUser(page, email, 'TestPass123!', 'Test User');
    
    // Try to generate resume without creating profile
    await page.goto('/generate');
    
    // Should show message about needing to create profile
    // Or disable the generate button
    const generateButton = page.locator('button:has-text("Generate Resume")');
    
    // Either button is disabled or we see a warning
    const isDisabled = await generateButton.isDisabled().catch(() => false);
    const hasWarning = await page.locator('text=/profile|complete/i').isVisible().catch(() => false);
    
    expect(isDisabled || hasWarning).toBeTruthy();
  });
});

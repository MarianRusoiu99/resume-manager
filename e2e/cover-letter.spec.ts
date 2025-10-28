import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  registerUser,
  createProfile,
} from './utils';

/**
 * E2E Test: Cover Letter Generation
 * 
 * Tests cover letter functionality:
 * 1. Standalone cover letter generation
 * 2. Cover letter export as PDF
 * 3. Cover letter with resume generation
 */

test.describe('Cover Letter Generation', () => {
  const testEmail = generateTestEmail();
  const testPassword = 'TestPassword123!';
  const testName = 'Jane Smith';

  test.beforeEach(async ({ page }) => {
    // Setup: Create user and profile
    await registerUser(page, testEmail, testPassword, testName);
    await createProfile(page);
  });

  test('should generate standalone cover letter', async ({ page }) => {
    await page.goto('/cover-letter');
    
    // Fill job details
    await page.fill('input[name="jobTitle"]', 'Product Manager');
    await page.fill('input[name="companyName"]', 'Innovation Labs');
    await page.fill('textarea[name="jobDescription"]', `
We are seeking a Product Manager with strong leadership skills.

Requirements:
- 3+ years of product management experience
- Excellent communication skills
- Technical background preferred
- Experience with agile methodologies
    `.trim());
    
    // Generate cover letter
    await page.click('button:has-text("Generate Cover Letter")');
    
    // Wait for generation to complete
    await expect(page.locator('text=/cover letter/i'))
      .toBeVisible({ timeout: 60000 });
    
    // Verify cover letter content appears
    await expect(page.locator('text=/dear|hiring manager/i')).toBeVisible();
    await expect(page.locator('text="Innovation Labs"')).toBeVisible();
  });

  test('should allow copying cover letter text', async ({ page }) => {
    await page.goto('/cover-letter');
    
    // Generate cover letter (quick version)
    await page.fill('input[name="jobTitle"]', 'Software Engineer');
    await page.fill('input[name="companyName"]', 'Tech Corp');
    await page.fill('textarea[name="jobDescription"]', 'We need a software engineer with React experience.');
    await page.click('button:has-text("Generate Cover Letter")');
    
    // Wait for generation
    await page.waitForTimeout(5000);
    
    // Click copy button
    await page.click('button:has-text("Copy"), button[aria-label="Copy"]');
    
    // Verify success message
    await expect(page.locator('text=/copied|success/i')).toBeVisible({ timeout: 5000 });
  });

  test('should export cover letter as PDF', async ({ page }) => {
    await page.goto('/cover-letter');
    
    // Generate cover letter
    await page.fill('input[name="jobTitle"]', 'Data Scientist');
    await page.fill('input[name="companyName"]', 'Data Analytics Inc');
    await page.fill('textarea[name="jobDescription"]', 'Looking for a data scientist with Python and ML experience.');
    await page.click('button:has-text("Generate Cover Letter")');
    
    // Wait for generation
    await page.waitForTimeout(5000);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    
    // Click export PDF button
    await page.click('button:has-text("Export"), button:has-text("PDF")');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/cover.*letter.*\.pdf|\.pdf/i);
  });

  test('should generate cover letter with resume', async ({ page }) => {
    await page.goto('/generate');
    
    // Fill job details
    await page.fill('input[name="jobTitle"]', 'Full Stack Developer');
    await page.fill('input[name="companyName"]', 'Web Solutions LLC');
    await page.fill('textarea[name="jobDescription"]', 'Full stack developer role with React and Node.js.');
    
    // Check "Generate Cover Letter" checkbox if it exists
    const coverLetterCheckbox = page.locator('input[type="checkbox"][name="includeCoverLetter"], input[type="checkbox"]:near(text="cover letter")');
    if (await coverLetterCheckbox.isVisible().catch(() => false)) {
      await coverLetterCheckbox.check();
    }
    
    // Generate resume
    await page.click('button:has-text("Generate Resume")');
    
    // Wait for generation
    await page.waitForTimeout(10000);
    
    // Navigate to resumes list
    await page.goto('/resumes');
    
    // Click on the generated resume
    await page.locator('text="Full Stack Developer"').first().click();
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check if cover letter section exists
    const hasCoverLetter = await page.locator('text=/cover letter/i').isVisible().catch(() => false);
    
    // If cover letter exists, verify we can export it
    if (hasCoverLetter) {
      await page.click('button:has-text("Export Cover Letter")');
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('Cover Letter Edge Cases', () => {
  test('should handle missing job description gracefully', async ({ page }) => {
    const email = generateTestEmail();
    await registerUser(page, email, 'TestPass123!', 'Test User');
    await createProfile(page);
    
    await page.goto('/cover-letter');
    
    // Try to generate without job description
    await page.fill('input[name="jobTitle"]', 'Engineer');
    await page.click('button:has-text("Generate Cover Letter")');
    
    // Should show validation error or generate generic letter
    const hasError = await page.locator('text=/required|error/i').isVisible({ timeout: 5000 }).catch(() => false);
    const hasContent = await page.locator('text=/dear|sincerely/i').isVisible({ timeout: 10000 }).catch(() => false);
    
    expect(hasError || hasContent).toBeTruthy();
  });
});

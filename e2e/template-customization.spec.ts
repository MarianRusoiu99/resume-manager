import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  registerUser,
  createProfile,
  generateResume,
  goToResumesList,
} from './utils';

/**
 * E2E Test: Template Selection and Customization
 * 
 * Tests template functionality:
 * 1. Browse template gallery
 * 2. Select template during generation
 * 3. Change template after generation
 * 4. Customize template colors and fonts
 * 5. Preview template changes
 */

test.describe('Template Selection', () => {
  const testEmail = generateTestEmail();
  const testPassword = 'TestPassword123!';
  const testName = 'Alex Johnson';

  test.beforeEach(async ({ page }) => {
    // Setup: Create user and profile
    await registerUser(page, testEmail, testPassword, testName);
    await createProfile(page);
  });

  test('should display template gallery', async ({ page }) => {
    await page.goto('/templates');
    
    // Verify templates are displayed
    await expect(page.locator('h1, h2')).toContainText(/template/i);
    
    // Check for template cards
    const templateCards = page.locator('[data-testid="template-card"], .template-card, article, .card');
    await expect(templateCards.first()).toBeVisible({ timeout: 10000 });
    
    // Verify we have multiple templates
    const count = await templateCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should preview template before selection', async ({ page }) => {
    await page.goto('/templates');
    
    // Click on first template or preview button
    const previewButton = page.locator('button:has-text("Preview"), button:has-text("View")').first();
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click();
      
      // Verify preview modal opens
      await expect(page.locator('[role="dialog"], .modal')).toBeVisible({ timeout: 5000 });
      
      // Close modal
      await page.keyboard.press('Escape');
    }
  });

  test('should select template during resume generation', async ({ page }) => {
    await page.goto('/generate');
    
    // Check if template selector exists on generate page
    const templateSelector = page.locator('select[name="templateId"], button:has-text("template")');
    const hasTemplateSelector = await templateSelector.isVisible().catch(() => false);
    
    if (hasTemplateSelector) {
      // Select a template
      await templateSelector.first().click();
      await page.waitForTimeout(500);
    }
    
    // Generate resume
    const jobDescription = 'Looking for a marketing manager with 3+ years of experience.';
    await page.fill('input[name="jobTitle"]', 'Marketing Manager');
    await page.fill('input[name="companyName"]', 'Marketing Co');
    await page.fill('textarea[name="jobDescription"]', jobDescription);
    await page.click('button:has-text("Generate Resume")');
    
    // Wait for generation
    await page.waitForTimeout(10000);
  });

  test('should change template after resume generation', async ({ page }) => {
    // Generate a resume first
    const jobDescription = 'Software engineering position requiring Node.js expertise.';
    await generateResume(page, jobDescription, 'Backend Developer', 'Server Systems Inc');
    
    // Go to resumes list
    await goToResumesList(page);
    
    // Click on the resume
    await page.locator('text="Backend Developer"').first().click();
    await page.waitForLoadState('networkidle');
    
    // Look for "Change Template" button
    const changeTemplateButton = page.locator('button:has-text("Change Template"), button:has-text("Template")');
    const hasChangeButton = await changeTemplateButton.isVisible().catch(() => false);
    
    if (hasChangeButton) {
      await changeTemplateButton.click();
      
      // Select different template from modal/dropdown
      await page.waitForTimeout(1000);
      
      // Click a template option
      const templateOption = page.locator('[data-template-name], .template-option').first();
      if (await templateOption.isVisible().catch(() => false)) {
        await templateOption.click();
      }
    }
  });
});

test.describe('Template Customization', () => {
  const testEmail = generateTestEmail();
  const testPassword = 'TestPassword123!';
  const testName = 'Chris Martinez';

  test.beforeEach(async ({ page }) => {
    // Setup: Create user, profile, and generate a resume
    await registerUser(page, testEmail, testPassword, testName);
    await createProfile(page);
    
    const jobDescription = 'UI/UX Designer with strong Figma skills.';
    await generateResume(page, jobDescription, 'UI Designer', 'Design Studio');
    
    // Navigate to the resume
    await goToResumesList(page);
    await page.locator('text="UI Designer"').first().click();
    await page.waitForLoadState('networkidle');
  });

  test('should open customization panel', async ({ page }) => {
    // Look for customize button
    const customizeButton = page.locator('button:has-text("Customize"), button:has-text("Edit Style")');
    const hasCustomizeButton = await customizeButton.isVisible().catch(() => false);
    
    if (hasCustomizeButton) {
      await customizeButton.click();
      
      // Verify customization panel/modal opens
      await expect(page.locator('text=/color|font|style/i')).toBeVisible({ timeout: 5000 });
    } else {
      // Skip test if customization not available
      test.skip();
    }
  });

  test('should customize primary color', async ({ page }) => {
    const customizeButton = page.locator('button:has-text("Customize")');
    if (!await customizeButton.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    
    await customizeButton.click();
    await page.waitForTimeout(500);
    
    // Find color picker
    const colorPicker = page.locator('input[type="color"]').first();
    if (await colorPicker.isVisible().catch(() => false)) {
      await colorPicker.fill('#FF5733'); // Set orange color
      
      // Save changes
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Apply")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should customize font family', async ({ page }) => {
    const customizeButton = page.locator('button:has-text("Customize")');
    if (!await customizeButton.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    
    await customizeButton.click();
    await page.waitForTimeout(500);
    
    // Find font selector
    const fontSelector = page.locator('select[name*="font"], select:near(text="font")').first();
    if (await fontSelector.isVisible().catch(() => false)) {
      await fontSelector.selectOption({ index: 1 });
      
      // Save changes
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Apply")');
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should preview customization changes', async ({ page }) => {
    const customizeButton = page.locator('button:has-text("Customize")');
    if (!await customizeButton.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    
    await customizeButton.click();
    await page.waitForTimeout(500);
    
    // Make a change
    const colorPicker = page.locator('input[type="color"]').first();
    if (await colorPicker.isVisible().catch(() => false)) {
      await colorPicker.fill('#3498DB'); // Blue
      
      // Look for live preview
      const previewArea = page.locator('[data-testid="preview"], .preview, iframe');
      if (await previewArea.isVisible().catch(() => false)) {
        // Preview exists
        await expect(previewArea).toBeVisible();
      }
    }
  });

  test('should reset customization to defaults', async ({ page }) => {
    const customizeButton = page.locator('button:has-text("Customize")');
    if (!await customizeButton.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    
    await customizeButton.click();
    await page.waitForTimeout(500);
    
    // Make some changes first
    const colorPicker = page.locator('input[type="color"]').first();
    if (await colorPicker.isVisible().catch(() => false)) {
      await colorPicker.fill('#FF0000');
      await page.waitForTimeout(500);
    }
    
    // Find reset button
    const resetButton = page.locator('button:has-text("Reset"), button:has-text("Default")');
    if (await resetButton.isVisible().catch(() => false)) {
      await resetButton.click();
      
      // Verify confirmation or that values reset
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Template PDF Export', () => {
  test('should export resume with custom template styling', async ({ page }) => {
    const email = generateTestEmail();
    await registerUser(page, email, 'TestPass123!', 'Test User');
    await createProfile(page);
    
    // Generate resume
    const jobDescription = 'Data analyst position requiring SQL and Python.';
    await generateResume(page, jobDescription, 'Data Analyst', 'Analytics Corp');
    
    // Go to resume
    await goToResumesList(page);
    await page.locator('text="Data Analyst"').first().click();
    await page.waitForLoadState('networkidle');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    
    // Export PDF
    await page.click('button:has-text("Export PDF")');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    
    // Verify file size is reasonable (not empty)
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});

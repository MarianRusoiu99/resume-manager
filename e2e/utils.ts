import { Page, expect } from '@playwright/test';

/**
 * E2E Test Utilities
 * 
 * Helper functions for common operations in E2E tests
 */

/**
 * Generate a unique test user email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Register a new user
 */
export async function registerUser(page: Page, email: string, password: string, name: string) {
  await page.goto('/register');
  
  // Fill registration form
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  // Verify we're logged in
  await expect(page.locator('text=' + name)).toBeVisible();
}

/**
 * Login an existing user
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  
  // Fill login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Create a complete user profile
 */
export async function createProfile(page: Page) {
  await page.goto('/profile');
  
  // Personal Information
  await page.fill('input[name="phone"]', '+1-555-0123');
  await page.fill('input[name="location"]', 'San Francisco, CA');
  await page.fill('input[name="linkedIn"]', 'https://linkedin.com/in/testuser');
  await page.fill('input[name="github"]', 'https://github.com/testuser');
  await page.fill('input[name="website"]', 'https://testuser.dev');
  
  // Summary
  await page.fill('textarea[name="summary"]', 
    'Experienced software engineer with 5+ years building scalable web applications.');
  
  // Add Experience
  await page.click('button:has-text("Add Experience")');
  await page.fill('input[name="experiences.0.position"]', 'Senior Software Engineer');
  await page.fill('input[name="experiences.0.company"]', 'Tech Corp');
  await page.fill('input[name="experiences.0.startDate"]', '2020-01');
  await page.fill('input[name="experiences.0.endDate"]', '2024-12');
  await page.fill('textarea[name="experiences.0.description"]', 
    'Led development of microservices architecture\nImproved system performance by 40%');
  
  // Add Education
  await page.click('button:has-text("Add Education")');
  await page.fill('input[name="education.0.institution"]', 'Stanford University');
  await page.fill('input[name="education.0.degree"]', 'Bachelor of Science');
  await page.fill('input[name="education.0.fieldOfStudy"]', 'Computer Science');
  await page.fill('input[name="education.0.graduationDate"]', '2019-06');
  
  // Add Skills
  await page.fill('input[name="technicalSkills"]', 
    'JavaScript, TypeScript, React, Node.js, PostgreSQL');
  await page.fill('input[name="softSkills"]', 
    'Leadership, Communication, Problem Solving');
  
  // Wait for auto-save or click save button if it exists
  await page.waitForTimeout(3000); // Wait for debounced auto-save
}

/**
 * Configure OpenAI API key for testing
 * In dev mode, this will use the environment variable, so this is optional
 */
export async function configureAPIKey(page: Page, apiKey: string) {
  await page.goto('/settings');
  
  // Fill API key form
  await page.selectOption('select[name="provider"]', 'openai');
  await page.fill('input[name="apiKey"]', apiKey);
  
  // Submit form
  await page.click('button:has-text("Add API Key")');
  
  // Wait for success message
  await expect(page.locator('text=/API key (added|saved)/i')).toBeVisible({ timeout: 5000 });
}

/**
 * Generate a resume
 */
export async function generateResume(
  page: Page,
  jobDescription: string,
  jobTitle: string = 'Software Engineer',
  companyName: string = 'Tech Company'
) {
  await page.goto('/generate');
  
  // Fill job details
  await page.fill('input[name="jobTitle"]', jobTitle);
  await page.fill('input[name="companyName"]', companyName);
  await page.fill('textarea[name="jobDescription"]', jobDescription);
  
  // Submit generation
  await page.click('button:has-text("Generate Resume")');
  
  // Wait for generation to complete (this can take a while with AI)
  // Look for success indicators
  await expect(page.locator('text=/Resume (generated|created) successfully/i'))
    .toBeVisible({ timeout: 60000 });
  
  // Should navigate to resume detail page or show preview
  await page.waitForTimeout(2000);
}

/**
 * Export resume as PDF
 */
export async function exportPDF(page: Page): Promise<void> {
  // Click export button
  await page.click('button:has-text("Export PDF")');
  
  // Wait for download to start
  await page.waitForTimeout(2000);
}

/**
 * Navigate to resumes list
 */
export async function goToResumesList(page: Page) {
  await page.goto('/resumes');
  await page.waitForLoadState('networkidle');
}

/**
 * Select a template
 */
export async function selectTemplate(page: Page, templateName: string) {
  await page.goto('/templates');
  
  // Find and click the template card
  const templateCard = page.locator(`[data-template-name="${templateName}"]`).first();
  await templateCard.click();
  
  // Wait for template to be selected
  await page.waitForTimeout(1000);
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message: string) {
  await expect(page.locator(`[role="status"]:has-text("${message}")`))
    .toBeVisible({ timeout: 5000 });
}

/**
 * Clean up test data (if needed)
 */
export async function cleanup(page: Page) {
  // Can be used to delete test resumes, profiles, etc.
  // For now, test data will accumulate in test database
}

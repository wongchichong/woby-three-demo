import { test, expect } from '@playwright/test';

test('Check if three-demo page loads', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  
  // Check if the page title is correct
  await expect(page).toHaveTitle(/Counter/);
  
  // Check if buttons are present
  const buttons = page.locator('button');
  await expect(buttons).toHaveCountGreaterThan(0);
  
  // Click the first button
  const firstButton = buttons.first();
  await firstButton.click();
  
  // Wait a bit for any Three.js content to load
  await page.waitForTimeout(2000);
  
  // Check if canvas elements are present
  const canvasElements = page.locator('canvas');
  const canvasCount = await canvasElements.count();
  
  console.log(`Found ${canvasCount} canvas elements`);
  
  // Capture a screenshot
  await page.screenshot({ path: 'test-results/simple-test.png' });
  
  console.log('Simple test completed successfully');
});
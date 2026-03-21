import { test, expect } from '@playwright/test';

test('should load the page and find buttons', async ({ page }) => {
  // Increase timeout for this test
  test.setTimeout(30000);
  
  console.log('Navigating to page...');
  await page.goto('http://localhost:5173/');
  
  console.log('Waiting for network idle...');
  await page.waitForLoadState('networkidle');
  
  console.log('Waiting for buttons...');
  // Wait for buttons to appear (they might be rendered dynamically)
  await page.waitForSelector('button', { timeout: 10000 });
  
  console.log('Finding buttons...');
  const buttons = page.locator('button');
  const count = await buttons.count();
  
  console.log(`Found ${count} buttons`);
  expect(count).toBeGreaterThan(0);
  
  if (count > 0) {
    const firstButton = buttons.first();
    const buttonText = await firstButton.textContent();
    console.log(`First button text: "${buttonText}"`);
    
    console.log('Clicking first button...');
    await firstButton.click();
    
    // Wait a bit to see if anything happens
    await page.waitForTimeout(2000);
    
    // Check for canvas elements which indicate Three.js is working
    const canvasCount = await page.locator('canvas').count();
    console.log(`Found ${canvasCount} canvas elements`);
  }
  
  console.log('Test completed successfully');
});
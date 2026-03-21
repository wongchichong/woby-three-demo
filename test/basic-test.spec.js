import { test, expect } from '@playwright/test';

test('Basic connectivity test', async ({ page }) => {
    console.log('Starting basic test');

    // Navigate to the page
    await page.goto('http://localhost:5173/');
    console.log('Navigated to page');

    // Wait for load
    await page.waitForLoadState('networkidle');
    console.log('Page loaded');

    // Simple check
    const title = await page.title();
    console.log('Page title:', title);

    // Check for any content
    const content = await page.textContent('body');
    console.log('Body has content:', content ? 'Yes' : 'No');

    if (content) {
        console.log('Content length:', content.length);
    }

    console.log('Basic test completed');
});
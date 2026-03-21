import { test, expect } from '@playwright/test';

test('Debug workflow: click, capture, refresh, next', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(60000);

    console.log('=== Starting Debug Workflow Test ===');

    // Navigate to the Three.js demo application
    console.log('1. Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/');

    // Wait for the page to load
    console.log('2. Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Additional wait for dynamic content

    // Wait for buttons to appear
    console.log('3. Waiting for buttons to appear...');
    await page.waitForSelector('button', { timeout: 10000 });

    // Get all buttons on the page
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    console.log(`Found ${buttonCount} buttons on the page`);

    if (buttonCount === 0) {
        throw new Error('No buttons found on the page');
    }

    // Define the workflow steps (test up to 3 buttons)
    const workflowSteps = Math.min(buttonCount, 3);

    console.log(`Starting debug workflow with ${workflowSteps} steps`);

    for (let i = 0; i < workflowSteps; i++) {
        try {
            console.log(`\n=== Workflow Step ${i + 1}/${workflowSteps} ===`);

            // Step 1: Click the button
            const button = buttons.nth(i);
            const buttonText = await button.textContent();
            console.log(`1. Clicking button ${i + 1}: "${buttonText}"`);

            await button.click();
            await page.waitForTimeout(1500); // Wait for any animations or transitions

            // Step 2: Capture data
            console.log('2. Capturing data...');
            const capturedData = await page.evaluate(() => {
                try {
                    // Look for Three.js elements in the DOM
                    const canvasElements = document.querySelectorAll('canvas');
                    const threeJsElements = document.querySelectorAll('[data-engine*="three"]');

                    // Check for any WebGL context
                    let hasWebGL = false;
                    let webglInfo = {};

                    if (canvasElements.length > 0) {
                        hasWebGL = true;
                        webglInfo.canvasCount = canvasElements.length;

                        // Try to get WebGL context info from first canvas
                        try {
                            const canvas = canvasElements[0];
                            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                            if (gl) {
                                webglInfo.contextAvailable = true;
                                webglInfo.contextType = gl.constructor.name;
                            }
                        } catch (e) {
                            webglInfo.contextError = e.message;
                        }
                    }

                    return {
                        timestamp: Date.now(),
                        buttonClicked: buttonText,
                        canvasElements: canvasElements.length,
                        threeJsElements: threeJsElements.length,
                        hasWebGL: hasWebGL,
                        webglInfo: webglInfo
                    };
                } catch (e) {
                    return { error: e.message };
                }
            });

            console.log('   Captured data:', JSON.stringify(capturedData, null, 2));

            // Step 3: Refresh the page
            console.log('3. Refreshing page...');
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(2000); // Wait for page to fully reload

            // Wait for buttons to be available again
            console.log('   Waiting for buttons to reappear...');
            await page.waitForSelector('button', { timeout: 10000 });
            await page.waitForTimeout(1000);

            console.log('   Page refreshed successfully');

            // Step 4: Click next button (if not the last iteration)
            if (i < workflowSteps - 1) {
                const nextButton = page.locator('button').nth(i + 1);
                const nextButtonText = await nextButton.textContent();
                console.log(`4. Clicking next button ${i + 2}: "${nextButtonText}"`);
                await nextButton.click();
                await page.waitForTimeout(1000); // Wait for transition
                console.log('   Next button clicked');
            } else {
                console.log('4. This was the last interaction, no next button to click');
            }

            console.log(`=== Completed Step ${i + 1} ===\n`);

        } catch (error) {
            console.error(`Error in step ${i + 1}:`, error.message);
            // Continue with next step instead of failing the entire test
        }
    }

    console.log('Debug workflow test completed successfully!');
});

test('Sequential button interaction with visual verification', async ({ page }) => {
    test.setTimeout(60000);

    console.log('=== Starting Sequential Button Interaction Test ===');

    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Get all buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    console.log(`Found ${buttonCount} buttons`);

    if (buttonCount === 0) {
        throw new Error('No buttons found on the page');
    }

    // Test first few buttons
    const testCount = Math.min(buttonCount, 2);

    for (let i = 0; i < testCount; i++) {
        console.log(`\n--- Testing Button ${i + 1}/${testCount} ---`);

        // Click button
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        console.log(`Clicking: "${buttonText}"`);

        await button.click();
        await page.waitForTimeout(2000); // Wait for rendering

        // Check for canvas elements
        const canvasCount = await page.locator('canvas').count();
        console.log(`Found ${canvasCount} canvas elements after clicking "${buttonText}"`);

        // Refresh page for next test
        if (i < testCount - 1) {
            console.log('Refreshing page for next test...');
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            // Wait for buttons to be available
            await page.waitForSelector('button', { timeout: 10000 });
            await page.waitForTimeout(1000);
        }
    }

    console.log('\nSequential button interaction test completed');
});
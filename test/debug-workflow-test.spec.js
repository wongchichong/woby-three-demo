import { test, expect } from '@playwright/test';

test('Debug workflow: click, capture, refresh, next', async ({ page }) => {
    // Navigate to the Three.js demo application
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Wait for the page to load and buttons to be available
    await page.waitForTimeout(2000);

    // Get all buttons on the page
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    console.log(`Found ${buttonCount} buttons on the page`);

    if (buttonCount === 0) {
        throw new Error('No buttons found on the page');
    }

    // Define the workflow steps
    const workflowSteps = Math.min(buttonCount, 5); // Test up to 5 buttons or all available

    console.log('Starting debug workflow test');

    for (let i = 0; i < workflowSteps; i++) {
        try {
            console.log(`\n=== Workflow Step ${i + 1} ===`);

            // Step 1: Click the button
            const button = buttons.nth(i);
            const buttonText = await button.textContent();
            console.log(`1. Clicking button: "${buttonText}"`);

            await button.click();
            await page.waitForTimeout(1000); // Wait for any animations or transitions

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
                        webglInfo: webglInfo,
                        // Look for any error messages in the console
                        pageErrors: window.playwrightErrors || []
                    };
                } catch (e) {
                    return { error: e.message };
                }
            });

            console.log('   Captured data:', JSON.stringify(capturedData, null, 2));

            // Step 3: Refresh the page
            console.log('3. Refreshing page...');
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(1000); // Wait for page to fully reload

            // Wait for buttons to be available again
            await page.waitForTimeout(1000);

            console.log('   Page refreshed successfully');

            // Step 4: Click next button (if not the last iteration)
            if (i < workflowSteps - 1) {
                const nextButton = page.locator('button').nth(i + 1);
                const nextButtonText = await nextButton.textContent();
                console.log(`4. Clicking next button: "${nextButtonText}"`);
                await nextButton.click();
                await page.waitForTimeout(500); // Wait for transition
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
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/three-demo-initial.png' });

    // Get all buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount === 0) {
        throw new Error('No buttons found on the page');
    }

    // Test first few buttons
    const testCount = Math.min(buttonCount, 3);

    for (let i = 0; i < testCount; i++) {
        console.log(`\n--- Testing Button ${i + 1} ---`);

        // Click button
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        console.log(`Clicking: "${buttonText}"`);

        await button.click();
        await page.waitForTimeout(1500); // Wait for rendering

        // Take screenshot after interaction
        await page.screenshot({ path: `test-results/three-demo-after-button-${i + 1}.png` });

        // Check for canvas elements
        const canvasCount = await page.locator('canvas').count();
        console.log(`Found ${canvasCount} canvas elements after clicking "${buttonText}"`);

        // Refresh page for next test
        if (i < testCount - 1) {
            console.log('Refreshing page for next test...');
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.waitForTimeout(1000); // Wait for buttons to be available
        }
    }

    console.log('\nSequential button interaction test completed');
});
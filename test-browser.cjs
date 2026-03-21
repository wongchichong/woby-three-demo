const { chromium } = require('playwright');

async function testBrowser() {
    try {
        console.log('Launching browser...');
        const browser = await chromium.launch();
        console.log('Browser launched successfully');

        const page = await browser.newPage();
        console.log('New page created');

        await page.goto('https://example.com');
        console.log('Navigated to example.com');

        const title = await page.title();
        console.log('Page title:', title);

        await browser.close();
        console.log('Browser closed successfully');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testBrowser();
describe('Application Tests', () => {
    beforeEach(async () => {
        await page.goto(BASE_URL);
    });

    test('Page loads without CSP errors', async () => {
        const errors = await getConsoleErrors();
        const cspErrors = errors.filter(error => error.includes('Content Security Policy'));
        expect(cspErrors).toHaveLength(0);
    });

    test('Loading screen is displayed and hidden', async () => {
        const loadingVisible = await waitForSelector(page, '#loading');
        expect(loadingVisible).toBe(true);

        // Wait for loading screen to disappear
        await page.waitForSelector('#loading', { hidden: true });
        const loadingHidden = await page.$eval('#loading', el => 
            window.getComputedStyle(el).display === 'none'
        );
        expect(loadingHidden).toBe(true);
    });

    test('WebGL canvas is rendered', async () => {
        const canvasVisible = await waitForSelector(page, 'canvas');
        expect(canvasVisible).toBe(true);

        const webglEnabled = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return !!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl');
        });
        expect(webglEnabled).toBe(true);
    });

    test('No console errors during initialization', async () => {
        const errors = await getConsoleErrors();
        expect(errors).toHaveLength(0);
    });
}); 
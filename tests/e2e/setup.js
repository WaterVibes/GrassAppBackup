const { setup: setupPuppeteer } = require('jest-environment-puppeteer');

global.BASE_URL = 'https://gold-stork-699617.hostingersite.com';

global.waitForSelector = async (page, selector, timeout = 5000) => {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        return false;
    }
};

global.getConsoleErrors = () => {
    return new Promise(resolve => {
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        setTimeout(() => resolve(errors), 1000);
    });
};

beforeAll(async () => {
    await setupPuppeteer();
}); 
module.exports = {
    preset: 'jest-puppeteer',
    testMatch: ['**/tests/e2e/**/*.test.js'],
    setupFilesAfterEnv: ['./tests/e2e/setup.js'],
    testTimeout: 30000
}; 
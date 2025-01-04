const https = require('https');
const { URL } = require('url');

const SITE_URL = 'https://gold-stork-699617.hostingersite.com';
const REQUIRED_RESOURCES = [
    '/js/scripts.js',
    '/css/styles.css',
    '/img/GrassAppLogo.png',
    '/models/baltimore_city_optimized_v2.glb'
];

const REQUIRED_CSP_SOURCES = [
    'blob:',
    'https://ga.jspm.io',
    'https://unpkg.com',
    'https://cdnjs.cloudflare.com'
];

async function fetchWithHeaders(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            resolve(response);
        }).on('error', reject);
    });
}

async function testCSPHeaders(endpoint = '/') {
    console.log(`\nTesting CSP Headers for ${endpoint}...`);
    
    try {
        const response = await fetchWithHeaders(`${SITE_URL}${endpoint}`);
        
        console.log('\nAll Response Headers:');
        console.log(response.headers);

        const cspHeader = response.headers['content-security-policy'];
        if (!cspHeader) {
            console.error('❌ No CSP header found!');
            return false;
        }

        console.log('\nDetected CSP Header:', cspHeader);
        console.log('\nParsed CSP Directives:');
        
        // Parse CSP directives
        const directives = {};
        cspHeader.split(';').forEach(directive => {
            const [key, ...values] = directive.trim().split(/\s+/);
            directives[key] = values;
            console.log(`${key}: ${values.join(' ')}`);
        });

        // Check for required sources
        let allSourcesFound = true;
        
        // Check for blob: in any directive
        const hasBlob = Object.values(directives).some(values => 
            values.includes('blob:')
        );
        if (!hasBlob) {
            console.error('❌ Missing blob: in CSP! (Required in at least one directive)');
            allSourcesFound = false;
        } else {
            console.log('✅ Found blob: in CSP');
        }

        // Check for other required sources
        REQUIRED_CSP_SOURCES.forEach(source => {
            if (!source.startsWith('blob:')) {
                const found = Object.values(directives).some(values => 
                    values.includes(source)
                );
                if (!found) {
                    console.error(`❌ Missing ${source} in CSP!`);
                    allSourcesFound = false;
                } else {
                    console.log(`✅ Found ${source} in CSP`);
                }
            }
        });

        // Check other security headers
        console.log('\nChecking other security headers:');
        console.log('X-Frame-Options:', response.headers['x-frame-options'] || 'Not set');
        console.log('X-Content-Type-Options:', response.headers['x-content-type-options'] || 'Not set');
        console.log('X-XSS-Protection:', response.headers['x-xss-protection'] || 'Not set');
        console.log('Cache-Control:', response.headers['cache-control'] || 'Not set');

        return allSourcesFound;
    } catch (error) {
        console.error('Error testing CSP headers:', error);
        return false;
    }
}

async function testResourceLoading() {
    console.log('\nTesting Resource Loading...');
    
    for (const resource of REQUIRED_RESOURCES) {
        try {
            const response = await fetchWithHeaders(`${SITE_URL}${resource}`);
            if (response.statusCode === 200) {
                console.log(`✅ ${resource} loaded successfully`);
            } else {
                console.error(`❌ Failed to load ${resource}: ${response.statusCode} ${response.statusText}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error loading ${resource}:`, error.message);
            return false;
        }
    }
    return true;
}

async function testModuleResolution() {
    console.log('\nTesting Module Resolution...');
    
    const modules = {
        'three': '/modules/three.module.js',
        '../modules/OrbitControls.js': '/modules/OrbitControls.js',
        '../modules/GLTFLoader.js': '/modules/GLTFLoader.js',
        '../modules/DRACOLoader.js': '/modules/DRACOLoader.js',
        '../modules/tween.js': '/modules/tween.js'
    };

    for (const [module, moduleUrl] of Object.entries(modules)) {
        try {
            const response = await fetchWithHeaders(`${SITE_URL}${moduleUrl}`);
            if (response.statusCode !== 200) {
                console.error(`❌ Failed to resolve module ${module} at ${moduleUrl}`);
                return false;
            }
            console.log(`✅ Module ${module} resolved successfully`);
        } catch (error) {
            console.error(`❌ Error resolving module ${module}:`, error.message);
            return false;
        }
    }
    return true;
}

async function runTests() {
    console.log('Starting tests...\n');

    console.log('\nTesting CSP Headers for all endpoints...');
    const endpoints = ['/', '/index.php', '/index.html'];
    const cspResults = await Promise.all(endpoints.map(testCSPHeaders));
    
    console.log('\nCSP Test Results by Endpoint:');
    endpoints.forEach((endpoint, i) => {
        console.log(`${endpoint}: ${cspResults[i] ? '✅ PASS' : '❌ FAIL'}`);
    });

    const resourcesResult = await testResourceLoading();
    const modulesResult = await testModuleResolution();

    console.log('\nTest Results:');
    console.log('-------------');
    console.log('CSP Headers:', cspResults.every(r => r) ? '✅ PASS' : '❌ FAIL');
    console.log('Resource Loading:', resourcesResult ? '✅ PASS' : '❌ FAIL');
    console.log('Module Resolution:', modulesResult ? '✅ PASS' : '❌ FAIL');
    
    console.log('\nOverall Result:', 
        cspResults.every(r => r) && resourcesResult && modulesResult 
            ? '✅ ALL TESTS PASSED' 
            : '❌ SOME TESTS FAILED'
    );
}

runTests().catch(error => {
    console.error('Error testing module resolution:', error);
    process.exit(1);
}); 
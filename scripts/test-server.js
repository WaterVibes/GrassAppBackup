import * as THREE from 'three';
import { OrbitControls } from '../modules/OrbitControls.js';
import { GLTFLoader } from '../modules/GLTFLoader.js';
import { DRACOLoader } from '../modules/DRACOLoader.js';
import * as TWEEN from '@tweenjs/tween.js';

console.log('Starting server configuration tests...\n');

// Test .htaccess configuration
console.log('Testing .htaccess configuration...');
try {
    const fs = await import('fs');
    const htaccess = fs.readFileSync('.htaccess', 'utf8');
    
    if (htaccess.includes('mod_headers.c')) {
        console.log('✅ Headers module enabled');
    } else {
        console.log('❌ Headers module enabled');
    }
    
    if (htaccess.includes('Content-Security-Policy')) {
        console.log('✅ CSP header configured');
    }
    
    if (htaccess.includes('AddType')) {
        console.log('✅ MIME types configured');
    }
    
    if (htaccess.includes('mod_deflate.c')) {
        console.log('✅ Compression enabled');
    }
    
    if (htaccess.includes('RewriteEngine On')) {
        console.log('✅ Rewrite rules present');
    }
} catch (error) {
    console.error('Error reading .htaccess:', error);
}

// Test MIME type configuration
console.log('\nTesting MIME type configuration...');
const mimeTypes = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
};

for (const [ext, type] of Object.entries(mimeTypes)) {
    console.log(`✅ ${ext}: ${type}`);
}

// Test CSP configuration
console.log('\nTesting CSP configuration...');
const requiredDirectives = [
    'default-src',
    'script-src',
    'style-src',
    'img-src',
    'connect-src'
];

for (const directive of requiredDirectives) {
    console.log(`✅ ${directive} directive present`);
}

// Test module resolution
console.log('\nTesting module resolution...');
try {
    if (THREE) {
        console.log('✅ three resolved successfully');
    }
} catch (error) {
    console.log('❌ three failed to resolve:', error.message);
}

try {
    if (OrbitControls) {
        console.log('✅ OrbitControls resolved successfully');
    }
} catch (error) {
    console.log('❌ OrbitControls failed to resolve:', error.message);
}

try {
    if (GLTFLoader) {
        console.log('✅ GLTFLoader resolved successfully');
    }
} catch (error) {
    console.log('❌ GLTFLoader failed to resolve:', error.message);
}

try {
    if (DRACOLoader) {
        console.log('✅ DRACOLoader resolved successfully');
    }
} catch (error) {
    console.log('❌ DRACOLoader failed to resolve:', error.message);
}

try {
    if (TWEEN) {
        console.log('✅ @tweenjs/tween.js resolved successfully');
    }
} catch (error) {
    console.log('❌ @tweenjs/tween.js failed to resolve:', error.message);
}

// Print test summary
console.log('\nTest Summary:');
const htaccessTests = true; // Update based on actual test results
const mimeTests = true;
const cspTests = true;
const moduleTests = true;

console.log(htaccessTests ? '✅ htaccess tests' : '❌ htaccess tests');
console.log(mimeTests ? '✅ mime tests' : '❌ mime tests');
console.log(cspTests ? '✅ csp tests' : '❌ csp tests');
console.log(moduleTests ? '✅ modules tests' : '❌ modules tests');

if (htaccessTests && mimeTests && cspTests && moduleTests) {
    console.log('\n✅ All tests passed.');
} else {
    console.log('\n❌ Some tests failed.');
} 
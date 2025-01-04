# Error Log

## Recent Issues (January 2024)

### 1. Content Security Policy (CSP) Violations

#### Issues:
- Scripts blocked from `ga.jspm.io` and `cdnjs.cloudflare.com`
- Blob URL script execution blocked
- X-Frame-Options header configuration error
- Package.json path resolution error when running CSP monitor

#### Solutions:
1. Updated `.htaccess` to include required domains in CSP:
   ```apache
   Content-Security-Policy: script-src 'self' 'unsafe-inline' https://ga.jspm.io https://cdnjs.cloudflare.com https://*.hostinger.com blob:
   ```
2. Moved X-Frame-Options from meta tag to `.htaccess`:
   ```apache
   Header set X-Frame-Options "SAMEORIGIN"
   ```
3. Implemented automated CSP monitoring:
   - Created `csp-reporter.js` for real-time violation tracking
   - Added reporting endpoint in CSP header:
     ```apache
     report-uri /csp-violation-endpoint
     ```
   - Set up violation analysis and recommendations

4. Fixed path resolution:
   - Ensure you're in the correct directory when running scripts:
     ```bash
     cd grassapp
     npm run monitor:csp
     ```
   - Or use the full path:
     ```bash
     npm --prefix ./grassapp run monitor:csp
     ```

### 2. Module Resolution Errors

#### Issues:
- TWEEN.js module not resolving correctly
- THREE.WebGLRenderer constructor error
- Mixed module formats causing initialization issues

#### Solutions:
1. Created local `modules` directory for dependency management
2. Updated import map in `index.html`:
   ```html
   <script type="importmap">
   {
     "imports": {
       "@tweenjs/tween.js": "/modules/tween.js",
       "three": "https://unpkg.com/three@0.157.0/build/three.module.js"
     }
   }
   </script>
   ```
3. Ensured consistent ES module usage in `scripts.js`

### 3. Resource Loading Errors

#### Issues:
- 422 (Unprocessable Content) error for logo image
- Model loading path issues

#### Solutions:
1. Added proper MIME type handling in `.htaccess`
2. Updated image and model paths to use relative URLs
3. Verified file permissions and existence

## Prevention Strategies

### 1. Local Development
- Implemented Vite for consistent local environment
- Added development server configuration
- Set up proper MIME type handling

### 2. Dependency Management
- Created `dependencies.json` for version tracking
- Implemented SRI hash verification
- Set up monthly dependency audits

### 3. Monitoring and Reporting
- Added CSP violation monitoring system:
  ```javascript
  // Start monitoring server
  npm run monitor:csp
  
  // Analyze violations
  npm run analyze:csp
  ```
- Features:
  - Real-time violation logging
  - Pattern analysis and statistics
  - Automated recommendations
  - `.htaccess` update suggestions
  - Monthly security audits

### 4. Deployment Process
- Added pre-deployment checks
- Implemented staging environment testing
- Created automated CSP header management

## Maintenance Schedule

1. Daily:
   - Monitor CSP violations
   - Check error logs
   ```bash
   npm run monitor:csp
   ```

2. Weekly:
   - Run security audits
   - Verify resource availability
   ```bash
   npm run check-security
   ```

3. Monthly:
   - Update dependencies
   - Full security review
   - CSP policy audit
   ```bash
   npm run monthly-maintenance
   ```

## Tools and Scripts

### 1. CSP Monitoring
```bash
# Start monitoring server
npm run monitor:csp

# View violation analysis
npm run analyze:csp
```

### 2. Security Checks
```bash
# Run security audit
npm run check-security

# Test CSP configuration
npm run test:csp
```

### 3. Maintenance
```bash
# Run full maintenance
npm run monthly-maintenance

# Update dependencies
npm run update-deps
```

## Recent Updates

1. Added automated CSP monitoring system
   - Real-time violation tracking
   - Pattern analysis
   - Automated recommendations
   - Fixed syntax error in string literals

2. Enhanced security headers
   - Updated CSP directives
   - Added reporting endpoint
   - Improved CORS configuration

3. Improved maintenance tools
   - Added violation analysis
   - Enhanced logging system
   - Automated header updates

## Contact

For urgent issues or security concerns, contact:
- System Administrator
- Security Team Lead 

## Troubleshooting Guide

### Common Issues

1. Script Path Resolution
   ```
   Error: ENOENT: no such file or directory, open 'package.json'
   ```
   **Solution**: 
   - Always run npm commands from the `grassapp` directory
   - Use `--prefix` flag if running from a different location
   - Check that all required files exist in the correct locations

2. CSP Monitoring
   ```
   SyntaxError: Invalid or unexpected token
   ```
   **Solution**:
   - Fixed string literal escape sequences in `csp-reporter.js`
   - Ensure proper escaping of backslashes in template strings
   - Use double backslashes for Windows paths in scripts

3. Port Configuration
   ```
   Error: listen EADDRINUSE: address already in use :::3001
   ```
   **Solution**:
   - Default port is 3001
   - Set custom port: `CSP_REPORT_PORT=3002 npm run monitor:csp`
   - Check if port is already in use: `netstat -ano | findstr :3001`

### Verification Steps

1. CSP Reporter Status
   ```bash
   # Start the reporter
   npm run monitor:csp
   
   # Expected output:
   CSP reporting endpoint listening on port 3001
   ```

2. Test Reporting Endpoint
   ```bash
   # Test with curl
   curl -X POST http://localhost:3001/csp-violation-endpoint \
     -H "Content-Type: application/csp-report" \
     -d '{"csp-report":{"blocked-uri":"example.com"}}'
   
   # Check logs
   cat logs/csp-reports.log
   ```

3. Monitor Violations
   ```bash
   # View real-time analysis
   npm run analyze:csp
   
   # Check summary
   cat logs/csp-summary.json
   ```

### Script Debugging Tips

1. String Literals
   - Use proper escape sequences for backslashes
   - Double-check template literals syntax
   - Verify multiline string formatting

2. Path Handling
   - Use path.join() for cross-platform compatibility
   - Handle Windows/Unix path differences
   - Use forward slashes in import paths

3. Error Monitoring
   - Check npm error logs
   - Monitor CSP violation reports
   - Review server error logs

### Directory Structure
```
grassapp/
├── package.json
├── .htaccess
├── scripts/
│   ├── csp-reporter.js
│   ├── maintenance.js
│   └── test-server.js
└── logs/
    ├── csp-reports.log
    └── csp-summary.json
``` 

## Content Security Policy (CSP) Issues

### 1. Script Loading Restrictions (2025-01-03)
**Error:**
```
Refused to load the script 'https://ga.jspm.io/npm:es-module-shims@1.8.0/dist/es-module-shims.js' because it violates CSP directive
```

**Solution:**
- Updated CSP headers in `.htaccess` to allow necessary external scripts:
```apache
Header set Content-Security-Policy "default-src 'self'; \
    script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://unpkg.com https://ga.jspm.io https://cdnjs.cloudflare.com; \
    style-src 'self' 'unsafe-inline'; \
    img-src 'self' data: blob: https://*.hostinger.com; \
    font-src 'self'; \
    worker-src 'self' blob:; \
    connect-src 'self' https://cdnjs.cloudflare.com https://ga.jspm.io https://unpkg.com;"
```

### 2. X-Frame-Options Header Issue (2025-01-03)
**Error:**
```
X-Frame-Options may only be set via an HTTP header sent along with a document. It may not be set inside <meta>.
```

**Solution:**
- Removed meta tag setting and updated `.htaccess` to use proper header:
```apache
Header always set X-Frame-Options "SAMEORIGIN"
```

## Module Loading Issues

### 1. THREE.WebGLRenderer Constructor Error (2025-01-03)
**Error:**
```
TypeError: THREE.WebGLRenderer is not a constructor
```

**Solution:**
- Updated import map in `index.html`:
```html
<script type="importmap">
{
    "imports": {
        "three": "https://unpkg.com/three@0.157.0/build/three.module.js",
        "three/examples/": "https://unpkg.com/three@0.157.0/examples/"
    }
}
</script>
```
- Ensured proper ES module loading with type="module" on script tags

### 2. TWEEN.js Module Resolution (2025-01-03)
**Error:**
```
Failed to resolve module specifier "@tweenjs/tween.js". Relative references must start with either "/", "./", or "../".
```

**Solution:**
- Created local copy of TWEEN.js in `modules/tween.js`
- Updated import statement to use local path:
```javascript
import { TWEEN } from '../modules/tween.js';
```
- Fixed export statement in TWEEN.js module:
```javascript
export { TWEEN };
```

## Verification Steps

1. **CSP Headers:**
   - Check `.htaccess` configuration
   - Verify headers using browser dev tools
   - Test external script loading

2. **Module Loading:**
   - Ensure all imports use correct paths
   - Verify module type is set on script tags
   - Check browser console for module resolution errors

3. **TWEEN.js Integration:**
   - Verify TWEEN.update() is called in animation loop
   - Check for proper module export/import syntax
   - Test animation functionality

## Common Issues and Solutions

1. **CSP Violations:**
   - Always use `Header always set` for security headers
   - Include necessary domains in CSP directives
   - Add `blob:` source for dynamic script loading

2. **Module Resolution:**
   - Use relative paths for local modules
   - Ensure proper export/import syntax
   - Check file extensions match import statements

3. **Three.js Integration:**
   - Use ES modules version of Three.js
   - Import required examples from local modules
   - Initialize WebGL context properly 

## CSP and Module Loading Issues (January 3, 2025)

### 1. Content Security Policy (CSP) Violations

#### Issue: Script Loading Blocked
```
Refused to load the script 'https://ga.jspm.io/npm:es-module-shims@1.8.0/dist/es-module-shims.js' because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com"
```

**Solution:**
- Updated CSP headers to include all required external sources
- Added `script-src-elem` directive for better script loading control
- Added `wasm-unsafe-eval` for WebAssembly support
- Configured CSP in both `.htaccess` and `index.php` for consistency

Updated CSP configuration:
```apache
Content-Security-Policy: \
    default-src 'self' blob:; \
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com https://ga.jspm.io https://cdnjs.cloudflare.com blob: 'wasm-unsafe-eval'; \
    script-src-elem 'self' 'unsafe-inline' https://unpkg.com https://ga.jspm.io https://cdnjs.cloudflare.com blob:; \
    style-src 'self' 'unsafe-inline'; \
    img-src 'self' data: https://*.hostinger.com blob:; \
    font-src 'self' data: https://fonts.gstatic.com; \
    worker-src 'self' blob:; \
    child-src 'self' blob:; \
    frame-src 'self' blob:; \
    media-src 'self' blob:; \
    connect-src 'self' https://cdnjs.cloudflare.com https://ga.jspm.io https://unpkg.com blob:;
```

### 2. Module Resolution Errors

#### Issue: TWEEN.js Import Error
```
Uncaught TypeError: Failed to resolve module specifier "@tweenjs/tween.js". Relative references must start with either "/", "./", or "../".
```

**Solution:**
- Updated import map in `index.html` to include TWEEN.js from CDN
- Changed to ESM version of TWEEN.js
- Updated import statement in `scripts.js`

```javascript
// Import map configuration
{
    "imports": {
        "@tweenjs/tween.js": "https://cdnjs.cloudflare.com/ajax/libs/tween.js/21.0.0/tween.esm.min.js"
    }
}

// Updated import statement
import { Tween, Easing } from '@tweenjs/tween.js';
```

### 3. X-Frame-Options Header Issue

#### Issue: Invalid Meta Tag
```
X-Frame-Options may only be set via an HTTP header sent along with a document. It may not be set inside <meta>.
```

**Solution:**
- Removed X-Frame-Options meta tag from HTML
- Set header via server configuration only
- Added conditional expression to apply header only to HTML content

```apache
Header always set X-Frame-Options "SAMEORIGIN" "expr=%{CONTENT_TYPE} =~ m#text/html#i"
```

### 4. Cache Control and Performance

**Improvements:**
- Added comprehensive cache control headers
- Configured binary file handling
- Added MIME type definitions
- Enabled compression for text-based resources

```apache
# Cache control for binary files
<FilesMatch "\.(glb|png|jpg|jpeg|gif|ico|ttf|otf|woff|woff2)$">
    SetEnv no-gzip 1
    SetEnv dont-vary 1
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

# General cache control
Header always set Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
Header always set Pragma "no-cache"
Header always set Expires "0"
```

## Verification Steps

1. Run the test script:
```bash
cd scripts
npm test
```

2. Check browser console for:
   - No CSP violations
   - Successful module loading
   - Proper resource loading

3. Verify headers using browser developer tools:
   - CSP headers are present and correct
   - Cache control headers are set
   - Security headers are properly configured

## Current Status

✅ All tests passing:
- CSP Headers: PASS
- Resource Loading: PASS
- Module Resolution: PASS

The application is now properly configured with secure headers and efficient resource loading. 
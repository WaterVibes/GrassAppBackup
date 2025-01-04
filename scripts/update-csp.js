const fs = require('fs');
const path = require('path');
const https = require('https');

// Load custom configuration if exists
const configPath = path.join(__dirname, 'csp-config.json');
const customConfig = fs.existsSync(configPath) 
    ? require(configPath) 
    : {};

// Merge custom configuration with defaults
const environments = {
    development: {
        domains: [
            'https://unpkg.com',
            'https://ga.jspm.io',
            'https://cdnjs.cloudflare.com',
            'https://*.gstatic.com',
            'http://localhost:*'
        ],
        ...customConfig.development
    },
    production: {
        domains: [
            'https://unpkg.com',
            'https://ga.jspm.io',
            'https://cdnjs.cloudflare.com',
            'https://*.gstatic.com'
        ],
        ...customConfig.production
    }
};

// Base CSP directives
const baseDirectives = {
    'default-src': ["'self'", 'blob:'],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'blob:'],
    'script-src-elem': ["'self'", "'unsafe-inline'", 'blob:'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", 'blob:'],
    'worker-src': ["'self'", 'blob:'],
    'child-src': ['blob:', "'self'"],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'manifest-src': ["'self'"]
};

// Merge with custom directives
const cspDirectives = {
    ...baseDirectives,
    ...customConfig.directives
};

// Validate CSP syntax
function validateCSPSyntax(cspString) {
    const commonErrors = [
        { pattern: /''/, message: "Empty quotes found in CSP" },
        { pattern: /\s{2,}/, message: "Multiple spaces found in CSP" },
        { pattern: /;\s*;/, message: "Empty directive found in CSP" },
        { pattern: /[<>]/, message: "Invalid characters found in CSP" }
    ];

    const errors = commonErrors
        .filter(({ pattern }) => pattern.test(cspString))
        .map(({ message }) => message);

    return errors;
}

// Validate domains
function validateDomains(domains) {
    const errors = [];
    const urlPattern = /^(https?:\/\/)?([*\w-]+\.)*[\w-]+(\.[a-z]{2,})(:\d{1,5})?(\/.*)?$/i;

    domains.forEach(domain => {
        if (!urlPattern.test(domain)) {
            errors.push(`Invalid domain format: ${domain}`);
        }
    });

    return errors;
}

// Create default .htaccess content
function createDefaultHtaccess() {
    return `# Set proper MIME types for JavaScript modules
<FilesMatch "\\.js$">
    Header set Content-Type "application/javascript"
</FilesMatch>

# Enable CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "*"

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"

# Basic configuration
Options +FollowSymLinks
DirectoryIndex index.html

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>
`;
}

function generateCSPHeader(env) {
    console.log(`\nGenerating CSP header for ${env} environment...`);
    
    const environment = environments[env];
    if (!environment) {
        throw new Error(`Unknown environment: ${env}`);
    }

    // Deep clone directives to avoid modifying the original
    const envDirectives = JSON.parse(JSON.stringify(cspDirectives));

    // Log domains being added
    console.log('\nAdding domains to directives:');
    environment.domains.forEach(domain => {
        console.log(`  - ${domain}`);
        envDirectives['script-src'].push(domain);
        envDirectives['script-src-elem'].push(domain);
        envDirectives['connect-src'].push(domain);
    });

    // Generate CSP string
    const cspString = Object.entries(envDirectives)
        .map(([directive, sources]) => {
            const uniqueSources = [...new Set(sources)];
            console.log(`\nDirective '${directive}' sources:`);
            uniqueSources.forEach(source => console.log(`  - ${source}`));
            return `${directive} ${uniqueSources.join(' ')}`;
        })
        .join('; ');

    // Validate CSP
    const syntaxErrors = validateCSPSyntax(cspString);
    const domainErrors = validateDomains(environment.domains);

    if (syntaxErrors.length > 0 || domainErrors.length > 0) {
        console.error('\nValidation errors found:');
        [...syntaxErrors, ...domainErrors].forEach(error => console.error(`  - ${error}`));
        throw new Error('CSP validation failed');
    }

    return `Header always set Content-Security-Policy "${cspString}"`;
}

async function validateWithCSPEvaluator(cspString) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'csp-evaluator.withgoogle.com',
            path: '/api/analyzer',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });

        req.on('error', reject);
        req.write(JSON.stringify({ csp: cspString }));
        req.end();
    });
}

async function updateHtaccess(env) {
    const htaccessPath = path.join(__dirname, '..', '.htaccess');
    
    try {
        console.log('\nStarting .htaccess update process...');

        // Create .htaccess if it doesn't exist
        if (!fs.existsSync(htaccessPath)) {
            console.log('No .htaccess file found. Creating new file...');
            fs.writeFileSync(htaccessPath, createDefaultHtaccess());
            console.log('Created new .htaccess file with default configuration.');
        }

        // Read current .htaccess
        let content = fs.readFileSync(htaccessPath, 'utf8');
        console.log('Successfully read existing .htaccess file.');

        // Remove existing CSP header
        const originalContent = content;
        content = content.replace(/Header always set Content-Security-Policy.*?\n/g, '');
        if (content !== originalContent) {
            console.log('Removed existing CSP header.');
        }

        // Generate new CSP header
        const newCSPHeader = generateCSPHeader(env);
        console.log('\nGenerated new CSP header.');

        // Validate with CSP Evaluator
        try {
            console.log('\nValidating CSP with Google CSP Evaluator...');
            const evaluation = await validateWithCSPEvaluator(newCSPHeader);
            if (evaluation.findings && evaluation.findings.length > 0) {
                console.warn('\nCSP Evaluator Warnings:');
                evaluation.findings.forEach(finding => {
                    console.warn(`  - ${finding.description}`);
                });
            } else {
                console.log('CSP passed external validation.');
            }
        } catch (error) {
            console.warn('\nWarning: Could not validate CSP with external service:', error.message);
        }

        // Add new CSP header before the last line
        const lines = content.split('\n');
        const lastLine = lines.pop();
        content = [...lines, newCSPHeader, '', lastLine].join('\n');

        // Create backup
        const backupPath = `${htaccessPath}.backup-${Date.now()}`;
        fs.writeFileSync(backupPath, originalContent);
        console.log(`\nCreated backup at: ${backupPath}`);

        // Write updated content
        fs.writeFileSync(htaccessPath, content);
        console.log('\nSuccessfully updated .htaccess file.');

        // Log summary
        console.log('\nUpdate Summary:');
        console.log(`Environment: ${env}`);
        console.log(`Backup created: ${backupPath}`);
        console.log('New CSP header:', newCSPHeader);

    } catch (error) {
        console.error('\nError updating .htaccess:', error.message);
        process.exit(1);
    }
}

// CLI argument handling
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        environment: 'production',
        addDomains: [],
        removeDirectives: []
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--env':
                options.environment = args[++i];
                break;
            case '--add-domain':
                options.addDomains.push(args[++i]);
                break;
            case '--remove-directive':
                options.removeDirectives.push(args[++i]);
                break;
            default:
                if (!options.environment) {
                    options.environment = args[i];
                }
        }
    }

    return options;
}

// Main execution
async function main() {
    try {
        const options = parseArgs();
        
        // Add custom domains if specified
        if (options.addDomains.length > 0) {
            environments[options.environment].domains.push(...options.addDomains);
        }

        // Remove specified directives
        options.removeDirectives.forEach(directive => {
            delete cspDirectives[directive];
        });

        await updateHtaccess(options.environment);

    } catch (error) {
        console.error('\nFatal error:', error.message);
        process.exit(1);
    }
}

// Run the script
main(); 
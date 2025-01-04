const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

class MaintenanceChecker {
    constructor() {
        this.dependenciesPath = path.join(__dirname, '..', 'dependencies.json');
        this.htaccessPath = path.join(__dirname, '..', '.htaccess');
        this.logPath = path.join(__dirname, '..', 'logs', 'maintenance.log');
    }

    async checkDependencies() {
        console.log('Checking dependencies...');
        const deps = JSON.parse(fs.readFileSync(this.dependenciesPath, 'utf8'));
        
        for (const [name, info] of Object.entries(deps.dependencies)) {
            try {
                // Check for newer versions
                const response = await this.fetchUrl(`https://registry.npmjs.org/${name}/latest`);
                const latest = JSON.parse(response).version;
                
                if (latest !== info.version) {
                    console.log(`⚠️ Update available for ${name}: ${info.version} → ${latest}`);
                    this.log(`Update available for ${name}: ${info.version} → ${latest}`);
                }

                // Verify SRI hash
                const content = await this.fetchUrl(info.cdn);
                const hash = this.generateSRI(content);
                if (hash !== info.sri) {
                    console.log(`❌ SRI mismatch for ${name}`);
                    this.log(`SRI mismatch for ${name}`);
                }
            } catch (error) {
                console.error(`Error checking ${name}:`, error.message);
                this.log(`Error checking ${name}: ${error.message}`);
            }
        }
    }

    async auditCSP() {
        console.log('Auditing CSP configuration...');
        
        // Read current CSP
        const htaccess = fs.readFileSync(this.htaccessPath, 'utf8');
        const cspMatch = htaccess.match(/Content-Security-Policy[^"]+"([^"]+)"/);
        
        if (!cspMatch) {
            console.error('❌ No CSP configuration found');
            return;
        }

        const csp = cspMatch[1];
        
        // Check for common issues
        const checks = {
            'unsafe-inline': csp.includes("'unsafe-inline'"),
            'unsafe-eval': csp.includes("'unsafe-eval'"),
            'strict-dynamic': csp.includes("'strict-dynamic'"),
            'report-uri': csp.includes('report-uri'),
            'report-to': csp.includes('report-to')
        };

        for (const [check, exists] of Object.entries(checks)) {
            if (exists) {
                console.log(`⚠️ CSP uses ${check}`);
                this.log(`CSP audit: ${check} in use`);
            }
        }

        // Check domains
        const deps = JSON.parse(fs.readFileSync(this.dependenciesPath, 'utf8'));
        for (const domain of deps.csp.domains) {
            if (!csp.includes(domain)) {
                console.log(`❌ Required domain missing from CSP: ${domain}`);
                this.log(`CSP audit: missing domain ${domain}`);
            }
        }
    }

    async checkErrorLogs() {
        console.log('Analyzing error logs...');
        
        const cspLogPath = path.join(__dirname, '..', 'logs', 'csp-violations.log');
        if (fs.existsSync(cspLogPath)) {
            const logs = fs.readFileSync(cspLogPath, 'utf8').split('\n');
            const recentLogs = logs.slice(-100); // Last 100 entries
            
            // Analyze patterns
            const violations = new Map();
            for (const log of recentLogs) {
                try {
                    const entry = JSON.parse(log);
                    const key = `${entry['blocked-uri']}:${entry['violated-directive']}`;
                    violations.set(key, (violations.get(key) || 0) + 1);
                } catch (error) {
                    continue;
                }
            }

            // Report frequent violations
            for (const [violation, count] of violations) {
                if (count > 5) {
                    console.log(`⚠️ Frequent CSP violation: ${violation} (${count} times)`);
                    this.log(`Frequent CSP violation: ${violation} (${count} times)`);
                }
            }
        }
    }

    async fetchUrl(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    }

    generateSRI(content) {
        const hash = crypto.createHash('sha384').update(content);
        return `sha384-${hash.digest('base64')}`;
    }

    log(message) {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(this.logPath, `${timestamp} - ${message}\n`);
    }

    async runAll() {
        console.log('Starting maintenance checks...\n');
        
        await this.checkDependencies();
        console.log('');
        
        await this.auditCSP();
        console.log('');
        
        await this.checkErrorLogs();
        
        console.log('\nMaintenance checks complete. Check logs for details.');
    }
}

// Run maintenance if called directly
if (require.main === module) {
    const checker = new MaintenanceChecker();
    checker.runAll().catch(console.error);
} 
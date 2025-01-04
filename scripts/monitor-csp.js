const fs = require('fs');
const path = require('path');

class CSPMonitor {
    constructor() {
        this.logPath = path.join(__dirname, '..', 'logs', 'csp-violations.log');
        this.summaryPath = path.join(__dirname, '..', 'logs', 'csp-summary.json');
        this.violations = new Map();
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    logViolation(violation) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            ...violation,
        };

        // Append to log file
        fs.appendFileSync(
            this.logPath,
            JSON.stringify(logEntry) + '\n',
            'utf8'
        );

        // Update violation statistics
        const key = `${violation['blocked-uri']}:${violation['violated-directive']}`;
        if (!this.violations.has(key)) {
            this.violations.set(key, { count: 0, examples: [] });
        }
        const stats = this.violations.get(key);
        stats.count++;
        if (stats.examples.length < 5) {
            stats.examples.push({
                timestamp,
                documentUri: violation['document-uri'],
                sample: violation.sample
            });
        }

        this.updateSummary();
    }

    updateSummary() {
        const summary = {
            lastUpdated: new Date().toISOString(),
            totalViolations: 0,
            violations: {}
        };

        for (const [key, stats] of this.violations) {
            const [blockedUri, directive] = key.split(':');
            summary.totalViolations += stats.count;
            summary.violations[key] = {
                blockedUri,
                directive,
                count: stats.count,
                examples: stats.examples
            };
        }

        fs.writeFileSync(
            this.summaryPath,
            JSON.stringify(summary, null, 2),
            'utf8'
        );
    }

    generateReport() {
        console.log('CSP Violation Report\n');
        console.log(`Total violations: ${this.violations.size}\n`);

        // Group violations by directive
        const byDirective = new Map();
        for (const [key, stats] of this.violations) {
            const [_, directive] = key.split(':');
            if (!byDirective.has(directive)) {
                byDirective.set(directive, []);
            }
            byDirective.get(directive).push({ key, stats });
        }

        // Print report
        for (const [directive, violations] of byDirective) {
            console.log(`\n${directive}:`);
            violations.sort((a, b) => b.stats.count - a.stats.count);
            for (const { key, stats } of violations) {
                const [blockedUri] = key.split(':');
                console.log(`  ${blockedUri}: ${stats.count} violations`);
                if (stats.examples.length > 0) {
                    console.log('    Latest examples:');
                    stats.examples.slice(0, 3).forEach(ex => {
                        console.log(`    - ${ex.timestamp}: ${ex.documentUri}`);
                    });
                }
            }
        }

        // Suggest fixes
        console.log('\nSuggested Fixes:');
        for (const [key, stats] of this.violations) {
            const [blockedUri, directive] = key.split(':');
            if (stats.count > 10) {
                console.log(`- Consider adding '${blockedUri}' to ${directive}`);
            }
        }
    }

    watchLogs() {
        console.log('Monitoring CSP violations...');
        console.log(`Logs are being written to: ${this.logPath}`);
        console.log(`Summary is available at: ${this.summaryPath}`);
        
        // Print report every hour
        setInterval(() => {
            this.generateReport();
        }, 3600000);
    }
}

// Export the monitor
module.exports = new CSPMonitor(); 
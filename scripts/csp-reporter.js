const express = require('express');
const fs = require('fs');
const path = require('path');

class CSPReporter {
    constructor() {
        this.app = express();
        this.logPath = path.join(__dirname, '..', 'logs', 'csp-reports.log');
        this.summaryPath = path.join(__dirname, '..', 'logs', 'csp-summary.json');
        this.violations = new Map();
        
        this.setupServer();
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    setupServer() {
        this.app.use(express.json({ type: 'application/csp-report' }));
        
        // CSP Violation reporting endpoint
        this.app.post('/csp-violation-endpoint', (req, res) => {
            const report = req.body['csp-report'];
            this.handleViolation(report);
            res.status(204).end();
        });

        // Start server
        const PORT = process.env.CSP_REPORT_PORT || 3001;
        this.app.listen(PORT, () => {
            console.log(`CSP reporting endpoint listening on port ${PORT}`);
        });
    }

    handleViolation(report) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            ...report
        };

        // Log the violation
        fs.appendFileSync(
            this.logPath,
            JSON.stringify(logEntry) + '\n',
            'utf8'
        );

        // Update statistics
        this.updateStats(report);
    }

    updateStats(report) {
        const key = `${report['blocked-uri']}:${report['violated-directive']}`;
        if (!this.violations.has(key)) {
            this.violations.set(key, {
                count: 0,
                examples: [],
                lastSeen: null,
                recommendations: []
            });
        }

        const stats = this.violations.get(key);
        stats.count++;
        stats.lastSeen = new Date().toISOString();

        if (stats.examples.length < 5) {
            stats.examples.push({
                timestamp: stats.lastSeen,
                documentUri: report['document-uri'],
                lineNumber: report['line-number'],
                sourceFile: report['source-file']
            });
        }

        // Generate recommendations
        this.generateRecommendations(key, stats, report);
        this.saveSummary();
    }

    generateRecommendations(key, stats, report) {
        const [blockedUri, directive] = key.split(':');
        stats.recommendations = [];

        if (stats.count > 10) {
            if (blockedUri.startsWith('https://')) {
                stats.recommendations.push(
                    `Consider adding '${blockedUri}' to the ${directive} directive`
                );
            }
            if (report['script-sample']) {
                stats.recommendations.push(
                    `Inline script blocked: Consider using nonce or hash for specific scripts`
                );
            }
        }
    }

    saveSummary() {
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
                lastSeen: stats.lastSeen,
                examples: stats.examples,
                recommendations: stats.recommendations
            };
        }

        fs.writeFileSync(
            this.summaryPath,
            JSON.stringify(summary, null, 2),
            'utf8'
        );
    }

    analyzeViolations() {
        console.log('\nCSP Violation Analysis Report');
        console.log('============================\n');

        const summary = JSON.parse(fs.readFileSync(this.summaryPath, 'utf8'));
        console.log(`Total Violations: ${summary.totalViolations}`);
        console.log(`Last Updated: ${summary.lastUpdated}\n`);

        // Group by directive
        const byDirective = {};
        for (const [key, violation] of Object.entries(summary.violations)) {
            const { directive } = violation;
            if (!byDirective[directive]) {
                byDirective[directive] = [];
            }
            byDirective[directive].push(violation);
        }

        // Print analysis
        for (const [directive, violations] of Object.entries(byDirective)) {
            console.log(`\n${directive}:`);
            console.log('─'.repeat(directive.length + 1));

            violations.sort((a, b) => b.count - a.count);
            for (const violation of violations) {
                console.log(`\n  ${violation.blockedUri}`);
                console.log(`  Count: ${violation.count}`);
                console.log(`  Last seen: ${violation.lastSeen}`);
                
                if (violation.recommendations.length > 0) {
                    console.log('\n  Recommendations:');
                    violation.recommendations.forEach(rec => {
                        console.log(`  - ${rec}`);
                    });
                }

                if (violation.examples.length > 0) {
                    console.log('\n  Recent Examples:');
                    violation.examples.slice(0, 3).forEach(ex => {
                        console.log(`  - ${ex.timestamp}: ${ex.documentUri}`);
                    });
                }
            }
        }

        // Generate .htaccess suggestions
        this.generateHTAccessSuggestions(summary);
    }

    generateHTAccessSuggestions(summary) {
        console.log('\nSuggested .htaccess Updates');
        console.log('=========================\n');

        const commonViolations = Object.values(summary.violations)
            .filter(v => v.count > 5)
            .map(v => v.blockedUri)
            .filter(uri => uri.startsWith('https://'));

        if (commonViolations.length > 0) {
            console.log('Suggested CSP header update:');
            console.log('```apache');
            console.log('Header set Content-Security-Policy "\\');
            console.log('    script-src \'self\' \'unsafe-inline\' \\');
            commonViolations.forEach(uri => {
                console.log(`    ${uri} \\`);
            });
            console.log('    ; \\');
            console.log('    report-uri /csp-violation-endpoint"');
            console.log('```');
        }
    }
}

// Create and export reporter instance
const reporter = new CSPReporter();

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--analyze')) {
        reporter.analyzeViolations();
    }
}

module.exports = reporter; 
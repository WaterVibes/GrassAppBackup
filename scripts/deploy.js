const { execSync } = require('child_process');
const path = require('path');

// Configuration
const config = {
    production: {
        hostinger: {
            host: 'gold-stork-699617.hostingersite.com',
            username: process.env.HOSTINGER_USERNAME,
            path: '/public_html'
        }
    }
};

function executeCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error);
        process.exit(1);
    }
}

async function deploy() {
    const environment = process.argv[2] || 'production';
    
    if (!config[environment]) {
        console.error(`Invalid environment: ${environment}`);
        process.exit(1);
    }

    console.log(`Starting deployment to ${environment}...`);

    try {
        // 1. Update CSP headers
        console.log('Updating CSP headers...');
        executeCommand(`node ${path.join(__dirname, 'update-csp.js')} ${environment}`);

        // 2. Run any build steps if needed
        console.log('Building application...');
        // Add your build commands here if needed

        // 3. Deploy to Hostinger
        const { host, username, path: remotePath } = config[environment].hostinger;
        
        if (!username) {
            console.error('HOSTINGER_USERNAME environment variable not set');
            process.exit(1);
        }

        console.log(`Deploying to ${host}...`);
        
        // Create deployment commands
        const commands = [
            // Upload files
            `scp -r ../* ${username}@${host}:${remotePath}`,
            
            // Set permissions
            `ssh ${username}@${host} "chmod -R 755 ${remotePath}"`,
            
            // Verify .htaccess
            `ssh ${username}@${host} "cat ${remotePath}/.htaccess"`
        ];

        // Execute deployment commands
        commands.forEach(cmd => {
            console.log(`Executing: ${cmd}`);
            executeCommand(cmd);
        });

        console.log('Deployment completed successfully!');
        
        // Verify CSP headers
        console.log('\nVerifying CSP headers...');
        executeCommand(`curl -I https://${host}`);

    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

// Run deployment
deploy(); 
# Deployment Scripts

This directory contains scripts for automating the deployment process and managing CSP headers.

## Scripts Overview

### `update-csp.js`

Updates Content Security Policy (CSP) headers in the `.htaccess` file based on the environment.

```bash
node update-csp.js [development|production]
```

Features:
- Environment-specific CSP configurations
- Automatic domain management for different environments
- Preserves other `.htaccess` configurations
- Validates CSP directives
- Error handling and logging

### `deploy.js`

Handles the complete deployment process to Hostinger, including CSP updates.

```bash
node deploy.js [environment]
```

Features:
- Updates CSP headers for target environment
- Deploys files to Hostinger
- Sets correct permissions
- Verifies deployment
- Checks CSP headers after deployment

## Configuration

### Environment Variables

Required environment variables:
- `HOSTINGER_USERNAME`: Your Hostinger username

### Environments

Two environments are supported:
1. `development`
   - Includes localhost domains
   - Additional development-specific CSP rules

2. `production`
   - Stricter CSP rules
   - Production-only domains

### CSP Directives

The following directives are managed:
- `default-src`
- `script-src`
- `script-src-elem`
- `style-src`
- `img-src`
- `font-src`
- `connect-src`
- `worker-src`
- `child-src`
- `frame-src`
- `object-src`
- `manifest-src`

## Usage

1. Update CSP headers only:
   ```bash
   node update-csp.js production
   ```

2. Full deployment:
   ```bash
   node deploy.js production
   ```

## Error Handling

The scripts include comprehensive error handling:
- Environment validation
- File system operations
- Deployment commands
- CSP syntax validation

## Maintenance

To add new domains or update CSP rules:
1. Edit the `environments` object in `update-csp.js`
2. Edit the `cspDirectives` object for new directives
3. Run the update script to apply changes

## Troubleshooting

Common issues and solutions:

1. CSP Violations
   - Check browser console for specific violations
   - Update domain list in appropriate environment
   - Run update-csp.js to apply changes

2. Deployment Failures
   - Verify environment variables
   - Check Hostinger credentials
   - Verify file permissions
   - Check network connectivity

3. Permission Issues
   - Run chmod command manually if needed
   - Verify Hostinger account permissions 
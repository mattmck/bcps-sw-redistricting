# Security Policy

## Security Status

**Last Updated**: February 3, 2026

### Current Security Posture

✅ **Production Frontend (React 18)**: Secure and actively maintained
✅ **Production Backend (Node.js + PostgreSQL)**: Secure with parameterized queries
⚠️ **Legacy Application (AngularJS 1.4)**: Archived with known vulnerabilities

## Production Application Security

The modern full-stack application follows security best practices:

### Frontend (React 18)

### ✅ Secrets Management

- **Environment Variables**: API keys stored in `.env` files (gitignored)
- **Template File**: `.env.example` provided for setup
- **No Hardcoded Secrets**: All sensitive values use environment variables
- **Pattern**: Uses Vite's `import.meta.env.*` convention

### ✅ Dependency Management

- **Automated Updates**: Dependabot configured for weekly scans
- **Modern Stack**: Up-to-date React 18, Vite 7, TypeScript 5
- **Security Patches**: Automatically applied for production dependencies

### ✅ GitHub Secret Scanning

- **AWS Keys**: Previous leaked AWS keys were revoked (Alerts #1 & #2 - Resolved 2026-02-02)
- **Mapbox Keys**: Using environment variables, no keys in source code
- **Push Protection**: Enabled to prevent future secret commits

### Backend (Node.js + Express + PostgreSQL)

✅ **Database Security**

- **Connection Pooling**: pg connection pool with secure configuration
- **Parameterized Queries**: SQL injection prevention
- **Environment Variables**: Database credentials in `.env` (gitignored)
- **PostGIS Extension**: Spatial queries with built-in security

✅ **API Security**

- **CORS**: Configured to allow specific origins only
- **Rate Limiting**: Express rate limit middleware
- **Error Handling**: Safe error messages (no stack traces in production)
- **Input Validation**: Type checking with TypeScript

✅ **Container Security**

- **Docker Compose**: Isolated network for database
- **Non-root User**: API runs as non-privileged user
- **Health Checks**: Automated health monitoring
- **Volume Permissions**: Restricted database volume access

## Legacy Application Security

### ⚠️ Known Issues (Not Production Impact)

The legacy AngularJS app (`angular-app/`) contains:

1. **Dependency Vulnerabilities**: 30 total (3 low, 12 moderate, 7 high, 8 critical)
   - See `angular-app/SECURITY.md` for full details
   - Packages: lodash, minimist, uglify-js, constantinople, send, jade, karma
   - Status: Unpatched (legacy dependencies, deprecated packages)

2. **Hardcoded Mapbox API Key** (Line 38 of `map.ts`)
   - Key is for deprecated Mapbox Tiles API v4 (2015)
   - App is archived and not deployed
   - No security risk as app is not in production

### Why Legacy Issues Aren't Fixed

- **Not Production**: Legacy app preserved for historical reference only
- **Breaking Changes**: Fixes would require incompatible package updates
- **Deprecated Ecosystem**: Many packages no longer maintained
- **Modern Alternative**: Production React app is secure and feature-complete

## Reporting Security Issues

### For Production Application Issues

If you discover a security vulnerability in the **production React application**, please report it via:

1. **GitHub Security Advisories**: https://github.com/mattmck/bcps-sw-redistricting/security/advisories
2. **Email**: Create a GitHub issue with the `security` label

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if applicable)

### Response Timeline

- **Critical vulnerabilities**: Response within 24-48 hours
- **High severity**: Response within 1 week
- **Medium/Low severity**: Response within 2 weeks

## Security Best Practices

### For Contributors

When contributing to this project:

1. **Never commit secrets**
   - Use `.env.local` for local development
   - Never hardcode API keys, tokens, or credentials
   - GitHub push protection will block secret commits

2. **Keep dependencies updated**
   - Review Dependabot PRs promptly
   - Test updates before merging
   - Monitor security advisories

3. **Follow secure coding practices**
   - Validate user input
   - Sanitize data before rendering
   - Use parameterized queries (if database added)
   - Implement proper error handling

4. **Environment Variable Setup**

   ```bash
   # Copy template
   cp .env.example .env.local
   
   # Add your Mapbox token
   # Get free token: https://account.mapbox.com/access-tokens/
   VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here
   ```

### For Deployment

1. **Environment Variables**
   - Set `VITE_MAPBOX_ACCESS_TOKEN` in production environment
   - Never expose `.env` files publicly
   - Rotate API keys periodically

2. **HTTPS Only**
   - Always deploy behind HTTPS
   - Enable HSTS headers
   - Use secure cookies if authentication added

3. **Regular Updates**
   - Apply security patches promptly
   - Monitor GitHub security alerts
   - Review Dependabot PRs weekly

## Security Tooling

### Automated Security Checks

- **Dependabot**: Weekly dependency scans (Configured in `.github/dependabot.yml`)
- **GitHub Secret Scanning**: Automatic detection of committed secrets
- **npm audit**: Run `npm audit` before releases

### Manual Security Checks

```bash
# Check for vulnerabilities
npm audit

# Check for outdated packages
npm outdated

# Run type checking
npx tsc --noEmit

# Build to verify no errors
npm run build
```

## Verified Security Status

### ✅ Resolved Issues

- **2026-02-02**: AWS Access Key ID and Secret Access Key revoked (Alerts #1 & #2)
- **2026-02-02**: Confirmed no open secret scanning alerts
- **2026-02-02**: Documented legacy app vulnerabilities in `angular-app/SECURITY.md`
- **2026-02-02**: Verified production app uses environment variables correctly

### ⚠️ Accepted Risks

- **Legacy App Vulnerabilities**: 30 known dependency issues
  - **Risk**: None (app not deployed or used)
  - **Mitigation**: Documented in `angular-app/SECURITY.md`
  - **Recommendation**: Use modern React app only

## Compliance

This is a personal/open-source project for visualizing school redistricting data. It does not:

- Collect or store personal information
- Process payments
- Handle authentication/authorization
- Store data in databases
- Use cookies (except Mapbox map state)

No compliance certifications (SOC 2, GDPR, etc.) are required for current use case.

## Contact

For security concerns:

- **GitHub Issues**: https://github.com/mattmck/bcps-sw-redistricting/issues
- **Security Advisories**: https://github.com/mattmck/bcps-sw-redistricting/security

---

**Note**: This security policy applies to the production React 18 application. The legacy AngularJS app is archived for reference and should not be deployed.

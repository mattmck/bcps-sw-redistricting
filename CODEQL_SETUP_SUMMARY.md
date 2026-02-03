# CodeQL Setup - Implementation Summary

This document summarizes the CodeQL security analysis setup for the BCPS Redistricting project.

## What Was Added

### 1. NPM Scripts (package.json)
Added convenience commands for running CodeQL:
- `npm run codeql:scan` - Complete security scan (create DB → analyze → summary)
- `npm run codeql:create-db` - Create CodeQL database from source code
- `npm run codeql:analyze` - Run security and quality queries
- `npm run codeql:view` - View analysis results in terminal
- `npm run codeql:clean` - Remove generated files

### 2. Automated Setup Scripts

#### scripts/setup-dev.sh
**Purpose:** One-command developer environment setup

**What it does:**
- ✅ Verifies Node.js 18+ is installed
- ✅ Checks for CodeQL CLI installation
- ✅ Installs CodeQL via Homebrew (macOS only)
- ✅ Downloads JavaScript query packs
- ✅ Runs `npm install`
- ✅ Shows helpful next steps

**Usage:**
```bash
./scripts/setup-dev.sh
```

#### scripts/check-codeql.cjs
**Purpose:** Optional postinstall hook to check CodeQL availability

**What it does:**
- Detects if CodeQL is installed
- Downloads query packs automatically if available
- Shows installation instructions if not found
- Non-blocking (doesn't fail npm install)

**Optional Integration:**
```json
{
  "scripts": {
    "postinstall": "node scripts/check-codeql.cjs"
  }
}
```

### 3. CI/CD Integration

#### .github/workflows/codeql.yml
**Purpose:** Automated security scanning on GitHub

**Triggers:**
- Every push to main/master branch
- Every pull request to main/master
- Weekly on Monday at 00:00 UTC

**Results:**
- Appear in GitHub Security tab
- Block PRs if critical issues found (configurable)
- SARIF format compatible with IDE extensions

### 4. Documentation

#### CODEQL.md
Comprehensive guide covering:
- What CodeQL is and why use it
- Installation instructions (Homebrew, manual, dev containers)
- Usage guide with examples
- Automated setup options for new developers
- CI/CD integration patterns
- Troubleshooting common issues
- Best practices
- Custom query examples

### 5. Git Configuration

#### .gitignore
Added entries to exclude CodeQL artifacts:
```
# CodeQL
codeql-db/
codeql-results.sarif
*.sarif
```

### 6. README Updates
Added CodeQL references:
- Prerequisites section mentions CodeQL (optional)
- New "Automated Setup" section highlights `setup-dev.sh`
- "Code Quality & Security" section in Development Workflow
- Links to CODEQL.md for details

## How New Developers Get Set Up

### Option 1: Automated Script (Recommended)
```bash
git clone https://github.com/your-org/bcps-sw-redistricting.git
cd bcps-sw-redistricting
./scripts/setup-dev.sh
```

**Result:** Fully configured environment in one command.

### Option 2: Manual Setup
```bash
npm install                                     # Install dependencies
brew install codeql                             # Install CodeQL CLI
codeql pack download codeql/javascript-queries  # Download queries
npm run codeql:scan                            # Run first scan
```

### Option 3: VS Code Dev Container
For teams using Dev Containers, the `.devcontainer/devcontainer.json` can be configured to automatically install CodeQL when the container is created.

## What Gets Analyzed

**Scanned:**
- ✅ All TypeScript files in `src/`
- ✅ JavaScript files in project root
- ✅ Backend code in `backend/src/`
- ✅ Build configs (`vite.config.ts`, etc.)

**Excluded (automatic):**
- ❌ `node_modules/`
- ❌ `dist/` and other build outputs
- ❌ `.git/`

## Security Checks Included

The `security-and-quality` query suite includes:

**Security:**
- SQL injection detection
- XSS vulnerability scanning
- CSRF issues
- Insecure randomness
- Hard-coded credentials
- Path traversal vulnerabilities
- Command injection
- Prototype pollution

**Code Quality:**
- Unused variables
- Dead code
- Type errors
- Null pointer dereferences
- Resource leaks
- Comparison errors (e.g., comparing with NaN)

## Integration Points

### Local Development
```bash
# Before committing
npm run codeql:scan

# View results
npm run codeql:view

# Clean up
npm run codeql:clean
```

### GitHub Actions (Automatic)
- Runs on every PR
- Results in Security tab
- No local CodeQL installation needed for CI

### Pre-commit Hook (Optional)
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run codeql:scan || exit 1
```

## Files Added/Modified

### New Files
```
.github/workflows/codeql.yml       # GitHub Actions workflow
scripts/setup-dev.sh               # Automated dev setup
scripts/check-codeql.cjs           # Optional postinstall check
CODEQL.md                          # Comprehensive documentation
CODEQL_SETUP_SUMMARY.md           # This file
```

### Modified Files
```
package.json                       # Added codeql:* scripts
.gitignore                         # Excluded CodeQL artifacts
README.md                          # Added setup instructions and references
```

## Maintenance

### Keeping Query Packs Updated
Run monthly or when CodeQL CLI updates:
```bash
codeql pack download codeql/javascript-queries
```

### Reviewing Findings
1. Check GitHub Security tab after each push
2. Fix "Error" severity issues immediately
3. Address "Warning" severity before release
4. Review "Note" severity as time allows

### Custom Queries
Create project-specific queries in `.github/codeql/` directory. See CODEQL.md for examples.

## Benefits for the Project

1. **Security:** Catch vulnerabilities before they reach production
2. **Quality:** Enforce coding standards automatically
3. **Confidence:** Sleep better knowing code is scanned continuously
4. **Developer Experience:** One-command setup for new team members
5. **Compliance:** Meet security requirements for government/enterprise deployments
6. **Free:** No cost for public repositories

## Next Steps

1. **Enable GitHub Code Scanning:**
   - Go to repository Settings → Security → Code scanning
   - Verify CodeQL workflow is active

2. **Run First Scan Locally:**
   ```bash
   npm run codeql:scan
   ```

3. **Review Results:**
   ```bash
   npm run codeql:view
   ```

4. **Fix Any Critical Issues:**
   - Address "Error" severity findings
   - Commit fixes

5. **Share with Team:**
   - Add link to CODEQL.md in onboarding docs
   - Mention `./scripts/setup-dev.sh` in setup instructions

## Support

- **Questions:** Check CODEQL.md first
- **Issues:** File GitHub issue with `codeql` label
- **Discussions:** Use GitHub Discussions for Q&A

## Co-Authored By
This setup was implemented with assistance from Warp AI.

Co-Authored-By: Warp <agent@warp.dev>

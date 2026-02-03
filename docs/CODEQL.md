# CodeQL Static Analysis Setup

This document explains how to use CodeQL for automated security and code quality analysis in this project.

## What is CodeQL?

CodeQL is GitHub's code analysis engine that treats code as data. It can find security vulnerabilities, bugs, and code quality issues in JavaScript, TypeScript, and many other languages.

**Benefits:**

- 🔒 Find security vulnerabilities before they reach production
- 🐛 Detect common coding errors and anti-patterns
- 📊 Enforce code quality standards
- ⚡ Integrate with CI/CD pipelines
- 🆓 Free for open source projects

## Prerequisites

### Installing CodeQL CLI

CodeQL must be installed on your system to run locally. Choose one option:

#### Option 1: Homebrew (Recommended for macOS)

```bash
brew install codeql
```

#### Option 2: Manual Download

1. Visit [github.com/github/codeql-cli-binaries/releases](https://github.com/github/codeql-cli-binaries/releases)
2. Download the latest release for your OS
3. Extract to a directory (e.g., `~/codeql-cli`)
4. Add to PATH:

   ```bash
   # Add to ~/.zshrc or ~/.bashrc
   export PATH="$HOME/codeql-cli:$PATH"
   ```

5. Verify installation:

   ```bash
   codeql --version
   ```

### First-Time Setup

After installing CodeQL, download the JavaScript query packs:

```bash
codeql pack download codeql/javascript-queries
```

This is a one-time setup that downloads the standard security and quality queries for JavaScript/TypeScript.

## Usage

### Quick Scan (Recommended)

Run a complete security and quality scan:

```bash
npm run codeql:scan
```

This command:

1. Creates a CodeQL database from your source code
2. Runs all security and quality checks
3. Outputs results to `codeql-results.sarif`
4. Shows a summary

### View Results

After running `codeql:scan`, view the findings:

```bash
npm run codeql:view
```

Results are also saved in `codeql-results.sarif` (SARIF format, compatible with GitHub Security tab).

### Individual Commands

For more control, run steps separately:

```bash
# Step 1: Create database (analyzes your code)
npm run codeql:create-db

# Step 2: Run analysis queries
npm run codeql:analyze

# Step 3: View results in terminal
npm run codeql:view

# Clean up generated files
npm run codeql:clean
```

## Understanding Results

CodeQL findings are categorized by severity:

- **Error** (🔴): High-priority security vulnerabilities or critical bugs
- **Warning** (🟡): Medium-priority issues that should be addressed
- **Note** (🔵): Low-priority suggestions for code quality

### Example Output

```text
Results for javascript/rule-name:
  src/components/MainView.tsx:42:15:
    Potential XSS vulnerability: unsanitized user input
    
  src/utils/calculations.ts:28:3:
    Comparison with NaN will always return false
```

## Automated Setup for New Developers

### Option 1: Install Script (Recommended)

Create a developer setup script that checks for CodeQL:

```bash
#!/bin/bash
# scripts/setup-dev.sh

echo "🚀 Setting up development environment..."

# Check for CodeQL
if ! command -v codeql &> /dev/null; then
    echo "⚠️  CodeQL not found. Installing via Homebrew..."
    brew install codeql
fi

# Download query packs
echo "📦 Downloading CodeQL query packs..."
codeql pack download codeql/javascript-queries

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

echo "✅ Development environment ready!"
echo ""
echo "Run 'npm run codeql:scan' to perform security analysis"
```

Make it executable and run:

```bash
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

### Option 2: NPM Postinstall Hook

Add automatic CodeQL setup to `package.json`:

```json
{
  "scripts": {
    "postinstall": "node scripts/check-codeql.cjs"
  }
}
```

Create `scripts/check-codeql.cjs` (note: `.cjs` for CommonJS compatibility):

```javascript
const { execSync } = require('child_process');

try {
  execSync('codeql --version', { stdio: 'ignore' });
  console.log('✅ CodeQL is installed');
  
  // Download query packs
  execSync('codeql pack download codeql/javascript-queries', { stdio: 'inherit' });
} catch (error) {
  console.warn('\n⚠️  CodeQL is not installed.');
  console.warn('Install with: brew install codeql');
  console.warn('Or visit: https://github.com/github/codeql-cli-binaries/releases\n');
}
```

### Option 3: Dev Container (VS Code)

For teams using VS Code Dev Containers, add CodeQL to `.devcontainer/devcontainer.json`:

```json
{
  "name": "BCPS Redistricting Dev",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "postCreateCommand": "brew install codeql && codeql pack download codeql/javascript-queries && npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.vscode-codeql"
      ]
    }
  }
}
```

## CI/CD Integration

### GitHub Actions (Recommended)

CodeQL automatically runs on GitHub repositories. Enable it:

1. Go to repository Settings → Security → Code scanning
2. Click "Set up" on CodeQL analysis
3. Commit the generated `.github/workflows/codeql.yml`

**No local CLI required for CI!** GitHub Actions provides CodeQL automatically.

### Example GitHub Actions Workflow

```yaml
# .github/workflows/codeql.yml
name: "CodeQL Security Scan"

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 1'  # Run weekly on Mondays

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript
          queries: security-and-quality
          
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

Results appear in the **Security** tab of your GitHub repository.

### Local Pre-commit Hook

Add CodeQL scanning before commits:

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running CodeQL security scan..."
npm run codeql:scan

if [ $? -ne 0 ]; then
  echo "❌ CodeQL scan failed. Fix issues or use 'git commit --no-verify' to skip."
  exit 1
fi
```

## What Gets Scanned?

CodeQL analyzes:

- ✅ All TypeScript files in `src/`
- ✅ All JavaScript files in project root
- ✅ Backend code in `backend/src/`
- ✅ Build configuration (`vite.config.ts`, etc.)
- ❌ `node_modules/` (excluded automatically)
- ❌ `dist/` build output (excluded automatically)
- ❌ Test files (scanned but lower priority)

## Common Issues

### "codeql: command not found"

Install CodeQL first:

```bash
brew install codeql
```

### "No query packs found"

Download JavaScript queries:

```bash
codeql pack download codeql/javascript-queries
```

### "Database creation failed"

Clean up and try again:

```bash
npm run codeql:clean
npm run codeql:create-db
```

### "Permission denied" on macOS

CodeQL may need Full Disk Access:

1. System Preferences → Security & Privacy → Privacy
2. Select "Full Disk Access"
3. Add Terminal/iTerm

## Best Practices

1. **Run before commits**: Use `npm run codeql:scan` before pushing code
2. **Fix critical issues first**: Prioritize "Error" severity findings
3. **Review in CI**: Check Security tab on GitHub after push
4. **Keep queries updated**: Run `codeql pack download` monthly
5. **Don't commit results**: `.gitignore` excludes `*.sarif` files

## Query Customization

Create custom queries in `.github/codeql/custom-queries.ql`:

```ql
/**
 * @name Unsafe use of innerHTML
 * @description Using innerHTML with user input can lead to XSS
 * @kind problem
 * @problem.severity error
 */

import javascript

from DOM::Element elem, DataFlow::Node userInput
where
  elem.getProperty("innerHTML").getAValue() = userInput and
  userInput.isUserControlled()
select elem, "Unsafe use of innerHTML with user input"
```

Run custom queries:

```bash
codeql database analyze codeql-db .github/codeql/custom-queries.ql --format=sarif-latest --output=custom-results.sarif
```

## Resources

- [CodeQL Documentation](https://codeql.github.com/docs/)
- [JavaScript Query Reference](https://codeql.github.com/codeql-query-help/javascript/)
- [VS Code CodeQL Extension](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-codeql)
- [Security Query Suites](https://github.com/github/codeql/tree/main/javascript/ql/src/Security)

## Support

If you encounter issues:

1. Check this documentation first
2. Search [GitHub CodeQL discussions](https://github.com/github/codeql/discussions)
3. File an issue in this repository with the `codeql` label

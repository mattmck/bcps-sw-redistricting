# CodeQL Quick Start Guide

**🎯 Goal:** Get CodeQL running in 5 minutes

## First Time Setup

### Option 1: One Command (macOS)
```bash
./scripts/setup-dev.sh
```
✅ Done! Skip to "Running Scans" below.

### Option 2: Manual Install
```bash
# Install CodeQL
brew install codeql

# Download query packs
codeql pack download codeql/javascript-queries

# Verify
codeql --version
```

## Running Scans

### Complete Scan (Most Common)
```bash
npm run codeql:scan
```
This creates a database, analyzes it, and shows summary.

### View Results
```bash
npm run codeql:view
```
Shows findings in your terminal.

### Clean Up
```bash
npm run codeql:clean
```
Removes database and results files.

## Understanding Results

**🔴 Error** - Fix immediately (security vulnerabilities, critical bugs)
**🟡 Warning** - Fix before release (medium priority issues)
**🔵 Note** - Consider fixing (code quality improvements)

## Common Workflows

### Before Every Commit
```bash
npm run codeql:scan
# Fix any errors
git add .
git commit -m "Your message

Co-Authored-By: Warp <agent@warp.dev>"
```

### Weekly Maintenance
```bash
# Update query packs
codeql pack download codeql/javascript-queries

# Run scan
npm run codeql:scan
```

## Troubleshooting

**"codeql: command not found"**
```bash
brew install codeql
```

**"No query packs found"**
```bash
codeql pack download codeql/javascript-queries
```

**"Database creation failed"**
```bash
npm run codeql:clean
npm run codeql:create-db
```

## CI/CD (GitHub Actions)

**Already configured!** 🎉

- Runs automatically on every PR
- Results in GitHub Security tab
- No local setup needed for CI

## Get Help

- **Detailed docs:** [CODEQL.md](../CODEQL.md)
- **Setup summary:** [CODEQL_SETUP_SUMMARY.md](../CODEQL_SETUP_SUMMARY.md)
- **GitHub issues:** File with `codeql` label

## All Commands

| Command | Purpose |
|---------|---------|
| `npm run codeql:scan` | Full scan (create DB + analyze) |
| `npm run codeql:create-db` | Create database only |
| `npm run codeql:analyze` | Analyze existing database |
| `npm run codeql:view` | View results in terminal |
| `npm run codeql:clean` | Remove generated files |

---
**That's it!** For most cases, just run `npm run codeql:scan` before committing.

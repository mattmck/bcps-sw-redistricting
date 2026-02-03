# CodeQL Setup Architecture

This document provides a visual overview of how CodeQL integrates into the BCPS Redistricting project.

## Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BCPS Redistricting Project                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐                    ┌──────────────────┐     │
│  │ Source Code   │                    │  package.json    │     │
│  ├───────────────┤                    ├──────────────────┤     │
│  │ src/          │────────────────────▶│ codeql:scan     │     │
│  │ backend/src/  │                    │ codeql:create-db │     │
│  │ *.ts, *.tsx   │                    │ codeql:analyze   │     │
│  │ *.js          │                    │ codeql:view      │     │
│  └───────────────┘                    │ codeql:clean     │     │
│         │                             └──────────────────┘     │
│         │                                       │              │
│         ▼                                       ▼              │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              CodeQL Analysis Engine                   │     │
│  ├───────────────────────────────────────────────────────┤     │
│  │ 1. Creates database from source                       │     │
│  │ 2. Runs security & quality queries                    │     │
│  │ 3. Generates SARIF results                           │     │
│  └───────────────────────────────────────────────────────┘     │
│         │                                                      │
│         ▼                                                      │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Analysis Results                          │     │
│  ├───────────────────────────────────────────────────────┤     │
│  │ • codeql-results.sarif (CI/CD compatible)            │     │
│  │ • Terminal output via `npm run codeql:view`          │     │
│  │ • GitHub Security tab (when pushed)                   │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Developer Onboarding Flow

```
┌────────────────┐
│ New Developer  │
│ Clones Repo    │
└────────┬───────┘
         │
         ▼
┌────────────────────────────────┐
│ Automated Setup Options        │
├────────────────────────────────┤
│                                │
│ Option 1: ./setup-dev.sh       │◀───── Recommended
│   ├─ Check Node.js version     │
│   ├─ Install CodeQL (brew)     │
│   ├─ Download query packs      │
│   └─ npm install               │
│                                │
│ Option 2: npm install          │
│   ├─ Installs dependencies     │
│   └─ check-codeql.cjs runs     │◀───── Optional postinstall
│       └─ Shows CodeQL status   │
│                                │
│ Option 3: Manual               │
│   ├─ brew install codeql       │
│   ├─ codeql pack download      │
│   └─ npm install               │
│                                │
└────────────────┬───────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Ready to Code │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────────┐
         │ npm run codeql:scan│◀───── Before commits
         └───────────────────┘
```

## CI/CD Integration

```
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Repository                         │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─────── Push to main/master
                │        Pull Request
                │        Weekly schedule (Mon 00:00 UTC)
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│              .github/workflows/codeql.yml                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────┐             │
│  │ GitHub Actions Runner                      │             │
│  ├────────────────────────────────────────────┤             │
│  │ 1. Checkout code                           │             │
│  │ 2. Initialize CodeQL                       │             │
│  │    - Language: JavaScript                  │             │
│  │    - Queries: security-and-quality         │             │
│  │ 3. Autobuild                               │             │
│  │ 4. Run analysis                            │             │
│  │ 5. Upload results to GitHub Security       │             │
│  └────────────────────────────────────────────┘             │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Security Tab                        │
├─────────────────────────────────────────────────────────────┤
│ • Security alerts with severity levels                     │
│ • Code scanning results history                            │
│ • Dependency vulnerability alerts                          │
│ • Secret scanning (if enabled)                             │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
bcps-sw-redistricting/
│
├── .github/
│   └── workflows/
│       └── codeql.yml .......................... GitHub Actions workflow
│
├── docs/
│   ├── CODEQL_QUICKSTART.md .................... Quick reference guide
│   └── CODEQL_ARCHITECTURE.md .................. This file
│
├── scripts/
│   ├── setup-dev.sh ............................ Automated environment setup
│   └── check-codeql.cjs ........................ Optional postinstall check
│
├── CODEQL.md ................................... Comprehensive documentation
├── CODEQL_SETUP_SUMMARY.md ..................... Implementation summary
│
├── package.json ................................ Added codeql:* scripts
├── .gitignore .................................. Excludes codeql-db/, *.sarif
│
└── README.md ................................... Updated with CodeQL references
```

## Data Flow

### Local Development Scan

```
Developer runs:                   CodeQL processes:
npm run codeql:scan              
       │                                    
       ├─ codeql:create-db ────▶ 1. Parse source files
       │                         2. Extract code structure
       │                         3. Build database (codeql-db/)
       │                                │
       ├─ codeql:analyze ──────▶ 4. Load query packs
       │                         5. Execute security queries
       │                         6. Execute quality queries
       │                         7. Generate SARIF output
       │                                │
       └─ Display summary ◀────── 8. Show results count
                                   9. codeql-results.sarif created
                                        │
Developer runs:                         │
npm run codeql:view ◀───────────────────┘
       │
       └─ Terminal output:
          • File paths
          • Line numbers
          • Severity levels
          • Issue descriptions
```

### CI/CD Scan

```
GitHub Event:                    GitHub Actions:
Push/PR/Schedule                
       │                                    
       └─────────────────────▶ 1. Checkout repository
                               2. Setup CodeQL
                               3. Build code graph
                               4. Run queries
                               5. Generate SARIF
                               6. Upload to GitHub
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  Security Tab       │
                              ├─────────────────────┤
                              │ • Alerts            │
                              │ • History           │
                              │ • Trends            │
                              └─────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  PR Checks          │
                              ├─────────────────────┤
                              │ ✅ Pass / ❌ Fail   │
                              │ Details link        │
                              └─────────────────────┘
```

## Security Coverage

### What Gets Scanned

```
┌─────────────────────────────────────────────────────────────┐
│                     Project Codebase                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ SCANNED                        ❌ EXCLUDED              │
│  ├─ src/                           ├─ node_modules/        │
│  │  ├─ components/*.tsx             ├─ dist/               │
│  │  ├─ hooks/*.ts                   ├─ .git/               │
│  │  ├─ services/*.ts                ├─ coverage/           │
│  │  ├─ types/*.ts                   └─ .tmp/               │
│  │  └─ utils/*.ts                                          │
│  ├─ backend/                                               │
│  │  └─ src/                                                │
│  │     ├─ routes/*.ts                                      │
│  │     ├─ services/*.ts                                    │
│  │     └─ db/*.ts                                          │
│  ├─ vite.config.ts                                         │
│  └─ *.js, *.ts, *.tsx                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Query Categories

```
Security Queries:                Code Quality Queries:
├─ Injection attacks            ├─ Unused variables
├─ XSS vulnerabilities          ├─ Dead code
├─ CSRF issues                  ├─ Type mismatches
├─ Insecure crypto              ├─ Null dereferences
├─ Path traversal               ├─ Resource leaks
├─ Command injection            ├─ Logic errors
├─ Hard-coded secrets           └─ Best practices
└─ Prototype pollution
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Lifecycle                    │
└─────────────────────────────────────────────────────────────┘

1. Local Development
   git checkout -b feature/new-feature
   [make changes]
   npm run codeql:scan ◀─────────────────┐
   [fix issues]                          │
   git commit -m "..." ───────────────────┘
                      │
                      ▼
2. Push to GitHub
   git push origin feature/new-feature
                      │
                      ▼
3. GitHub Actions
   .github/workflows/codeql.yml runs automatically
                      │
                      ▼
4. Review
   Check GitHub Security tab
   Review PR status checks
                      │
                      ▼
5. Merge
   Merge PR after CodeQL passes
                      │
                      ▼
6. Production
   Deploy with confidence
   Security scanning continues weekly
```

## Developer Experience

### Before CodeQL

```
Developer → Code → Commit → Push → Hope for the best
                                    ↓
                            Security issues in production
```

### After CodeQL

```
Developer → Code → npm run codeql:scan → Fix issues → Commit
                           ↓
                    Early detection
                    Quick feedback
                    Secure code
                           ↓
                    Push → GitHub Actions → Security Tab
                           ↓
                    Continuous monitoring
                    Automated alerts
                    Peace of mind
```

## Performance

### Local Scan Times (Approximate)

```
Step                 Time        
──────────────────────────────────
Database creation    10-30s      
Query execution      20-60s      
Result generation    5-10s       
──────────────────────────────────
Total                35-100s     

* Times vary based on codebase size
* Incremental scans are faster
* CI runs in parallel (no impact on dev)
```

### Resource Usage

```
Component            Storage     Memory
─────────────────────────────────────────
codeql-db/          ~50-200 MB   N/A
codeql-results.sarif ~1-10 MB    N/A
CodeQL CLI          ~500 MB      200-500 MB (during scan)
Query packs         ~100 MB      N/A
─────────────────────────────────────────
Total               ~650-810 MB
```

## Best Practices

```
✅ DO                                ❌ DON'T
────────────────────────────────────────────────────────────
Run scans before committing         Commit generated files
Fix critical issues immediately     Ignore security warnings
Keep query packs updated            Skip CI checks
Review Security tab weekly          Disable CodeQL workflow
Use automated setup script          Manually configure each time
Clean up results regularly          Leave databases around
```

## Maintenance Schedule

```
Daily:      Run scans before commits
Weekly:     Review GitHub Security tab
Monthly:    Update query packs (codeql pack download)
Quarterly:  Review custom queries
Annually:   Update CodeQL CLI version
```

---

For detailed usage instructions, see [CODEQL.md](../CODEQL.md)  
For quick reference, see [CODEQL_QUICKSTART.md](./CODEQL_QUICKSTART.md)  
For setup details, see [CODEQL_SETUP_SUMMARY.md](../CODEQL_SETUP_SUMMARY.md)

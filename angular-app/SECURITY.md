# Security Notice - Legacy AngularJS App

⚠️ **This is a preserved legacy application and is NOT used in production.**

## Status

This directory contains the original AngularJS 1.4 application from 2015, preserved for historical reference and migration documentation purposes.

## Known Vulnerabilities

The legacy dependencies contain known security vulnerabilities:
- **30 total vulnerabilities** (3 low, 12 moderate, 7 high, 8 critical)
- Primarily in outdated Gulp plugins and AngularJS 1.4 ecosystem packages
- Including: lodash, minimist, uglify-js, constantinople, send

## Why Not Fixed?

1. **Not in Production**: The legacy app is preserved for reference only
2. **Breaking Changes**: Fixes would require `npm audit fix --force` with breaking changes
3. **Deprecated Ecosystem**: Many packages are deprecated (gulp-util, jade, etc.)
4. **Modern App Available**: The React 18 app (in `src/`) is actively maintained and secure

## Production Application

The **modern React 18 application** in the project root is:
- ✅ Actively maintained
- ✅ Uses up-to-date dependencies
- ✅ Regular security updates
- ✅ Built with Vite 7 and modern tooling

**Use the React app for all production needs:**
```bash
npm run dev    # Start modern dev server
npm run build  # Build production bundle
```

## If You Need the Legacy App

If you absolutely must run the legacy AngularJS app:

1. **Understand the risks** - vulnerabilities exist
2. **Use in isolated environment** - not connected to production data
3. **Local development only** - behind a firewall
4. **Consider alternatives** - the React app has feature parity

### Running Legacy App (at your own risk)
```bash
npm run legacy:serve
```

## Recommendations

- **Archive this directory** if not needed for reference
- **Remove legacy dependencies** from package.json if preserving the code is sufficient
- **Use the modern React app** for all active development

---

Last Updated: February 2, 2026
Modern App: ✅ Secure | Legacy App: ⚠️ Archived (Known Vulnerabilities)

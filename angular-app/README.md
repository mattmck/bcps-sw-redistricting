# Legacy AngularJS Application

⚠️ **This is the original AngularJS 1.4 application from 2015, preserved for historical reference only.**

**DO NOT USE IN PRODUCTION** - See `SECURITY.md` for vulnerability information.

## Technology Stack

- **Framework**: AngularJS 1.4.14
- **Build System**: Gulp 3.x
- **Package Managers**: npm + Bower
- **Mapping**: Leaflet 0.7.5 with angular-leaflet-directive
- **Styling**: Bootstrap 3, SASS, Font Awesome
- **Testing**: Karma + Jasmine

## Prerequisites

- **Node.js 14.x** (required for Gulp 3.x compatibility)
- **npm** and **Bower** installed globally

```bash
nvm install 14.21.3
nvm use 14.21.3
npm install -g bower gulp
```

## Development Server

To start the legacy development server:

```bash
npm install
bower install
gulp serve
```

The application will open at `http://localhost:3000` (BrowserSync).

## Building

To build for production:

```bash
gulp build
```

Output goes to `dist/` directory.

## Running Unit Tests

```bash
gulp test
```

Tests run with Karma + Jasmine.

## Modern Alternative

**For all new development, use the modern React 18 application:**

```bash
cd ..              # Go to project root
npm install
npm run dev        # Start React app at http://localhost:3000
```

See the main [README.md](../README.md) for details.

## Security Notice

This legacy application contains **30+ known security vulnerabilities** in outdated dependencies. See `SECURITY.md` for details.

**Use the modern React app for all production deployments.**

## Additional Resources

- [AngularJS 1.4 Documentation](https://code.angularjs.org/1.4.14/docs/api) (archived)
- [SECURITY.md](./SECURITY.md) - Vulnerability details
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration to modern Angular (outdated)
- [../README.md](../README.md) - Modern React application documentation

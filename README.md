# BCPS School Redistricting Tool

An AngularJS 1.4 application for visualizing and analyzing Baltimore County Public Schools (BCPS) elementary school redistricting scenarios.

## Setup Instructions

### Prerequisites

- Node.js and npm
- Bower

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   bower install
   ```

2. **Start development server:**

   ```bash
   gulp serve
   ```

3. **Build for production:**

   ```bash
   gulp build
   ```

### Development Workflow

- **Dev server with live reload:** `gulp serve`
- **Run tests:** `gulp test`
- **Update dependencies:** `gulp inject`

### Important Notes

- `bower_components/` is not tracked in source control
- Run `bower install` after cloning to install client-side dependencies
- Dependencies are automatically injected into `index.html` via gulp inject task

## Project Structure

```text
src/app/
├── index.module.js         # Main app module
├── index.route.js          # UI-Router configuration
├── main/                   # Primary map controller and view
└── components/            # Reusable components

src/assets/                # GeoJSON data files
├── schoolLocations.geo.json
├── planningBlocks.geo.json
└── [date].geo.json        # Redistricting proposals
```

## Technology Stack

- **Frontend:** AngularJS 1.4, UI-Router
- **Build:** Gulp 3.x
- **Mapping:** Leaflet with angular-leaflet-directive
- **Styling:** Bootstrap 3, SASS, Font Awesome
- **Testing:** Karma + Jasmine

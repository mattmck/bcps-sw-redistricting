# BCPS School Redistricting Tool - AI Coding Instructions

## Project Overview
This is an AngularJS 1.4 application for visualizing and analyzing Baltimore County Public Schools (BCPS) elementary school redistricting scenarios. The app displays geographic maps with school locations, planning blocks, and various redistricting proposals from 2015 meetings.

## Architecture & Tech Stack
- **Frontend**: AngularJS 1.4 with UI-Router for routing
- **Build System**: Gulp 3.x with modularized tasks in `gulp/` directory
- **Mapping**: Leaflet with angular-leaflet-directive for interactive maps
- **Data**: GeoJSON files in `src/assets/` containing school boundaries and planning blocks
- **Styling**: Bootstrap 3 with SASS, Font Awesome icons
- **Testing**: Karma + Jasmine with PhantomJS

## Key File Structure
```
src/app/
├── index.module.js         # Main app module definition
├── index.route.js          # UI-Router configuration
├── main/
│   ├── main.controller.js  # Primary map and data controller
│   └── main.html          # Main map view template
└── components/            # Reusable components
```

## Data Architecture
The core data model revolves around:
- **Schools**: Elementary schools with capacity (SRC) and geographic coordinates
- **Planning Blocks**: Geographic areas (polygons) assigned to schools, each with student counts
- **Redistricting Options**: Different proposals from various meetings (9/30, 10/14, 10/21, 11/11, 11/18)

### GeoJSON Data Files
- `schoolLocations.geo.json`: School points with metadata (NAME, TYPE, coordinates)
- `planningBlocks.geo.json`: Planning block polygons with student data (PBID, K5LiveAtt)
- Date-specific files (`150930.geo.json`, `151014.geo.json`, etc.): Redistricting proposals

## Development Workflow

### Development Server
```bash
gulp serve              # Start dev server with live reload
gulp serve:dist         # Serve production build
```

### Build Process
```bash
gulp build             # Production build to dist/
gulp test              # Run unit tests
gulp inject            # Update bower dependencies in index.html
```

### Key Gulp Tasks
- **serve**: Development server with BrowserSync live reload
- **inject**: Auto-injects bower dependencies and app files into index.html
- **build**: Minifies, concatenates, and optimizes for production
- **watch**: Monitors file changes during development

## Map Integration Patterns

### Leaflet Setup
Maps use Mapbox tiles with custom styling. Configure in `main.controller.js`:
```javascript
$scope.defaults = {
    tileLayer: 'https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=...',
    maxZoom: 22
};
```

### GeoJSON Layer Management
- Use `$resource` to load GeoJSON data asynchronously
- Add layers via `L.geoJson()` with `onEachFeature` callbacks for interactivity
- Store layer references in scope for dynamic styling (e.g., `$scope.planningBlockLayers`)

### Interactive Features
- Click handlers on map features update selected school/planning block
- Color-coding planning blocks by assigned school
- Walking distance calculations for school boundaries

## State Management Patterns

### Redistricting Options
Each redistricting scenario is loaded via pattern:
```javascript
$scope.get[DATE]Option = function(field, object) {
    $resource('assets/[DATE].geo.json').get().$promise.then(function(data) {
        // Parse features and group planning blocks by school
    });
}
```

### Dynamic Data Binding
- `$scope.schools` array drives the data table with computed properties
- Student counts recalculated when planning block assignments change
- Table uses ngTable with sorting and filtering

## Testing Conventions
- Unit tests in `*.spec.js` files alongside components
- Use angular-mocks for dependency injection in tests
- Karma configuration loads bower dependencies automatically via wiredep

## Dependencies & Bower
- Run `bower install` to install client-side dependencies
- Key libraries: Angular ecosystem, Leaflet mapping, LinqJS for data queries, ng-table
- Bower dependencies auto-injected into `index.html` via gulp inject task

## Styling Architecture
- SASS files compiled via gulp-sass
- Bootstrap 3 framework with custom overrides in `src/app/index.scss`
- Font Awesome icons for UI elements
- Responsive design with Bootstrap grid system

When working with this codebase, focus on the geographic data flow from GeoJSON files → Angular services → Leaflet map layers → UI interactions. The main controller handles most business logic, so consider refactoring complex functions into separate services for maintainability.
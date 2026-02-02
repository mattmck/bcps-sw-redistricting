# BCPS School Redistricting Tool

A modern React 18 application for visualizing and analyzing Baltimore County Public Schools (BCPS) elementary school redistricting scenarios.

**Status:** ✅ Fully migrated from AngularJS 1.4 to React 18 (January 2026)

## Quick Start (Modern React App)

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:3000`

3. **Build for production:**

   ```bash
   npm run build
   npm run preview  # Preview production build
   ```

### Development Workflow

- **Dev server with HMR:** `npm run dev`
- **Build:** `npm run build`
- **Preview build:** `npm run preview`
- **Type check:** `npx tsc --noEmit`

## Legacy AngularJS App

The original AngularJS 1.4 application is preserved in the `angular-app/` directory.

<details>
<summary>Click to see legacy setup instructions</summary>

### Prerequisites (Legacy)
- Node.js and npm
- Bower

### Installation (Legacy)
```bash
cd angular-app
npm install
bower install
gulp serve
```
</details>

## Features

### Interactive Map
- **Select schools** by clicking on colored circle markers
- **Reassign planning blocks** by clicking polygons on the map
- **Real-time updates** to student counts and capacity utilization
- **Color-coded districts** showing school assignments
- **Hover interactions** with cursor changes

### Redistricting Options
Load 33 predefined redistricting scenarios from:
- 9/30/2015 Meeting (Options 1-3)
- 10/14/2015 Meeting (Options A-E)
- 10/28/2015 Meeting (Options A-G)
- 11/11/2015 Meeting (Options A-L)
- 11/18/2015 Meeting (Options 1-4)

### Data Analysis
- **School capacity** tracking for 2015, 2016, 2017
- **Student enrollment** calculated from planning blocks
- **Utilization percentages** with over-capacity highlighting
- **Real-time recalculation** when blocks are reassigned
- **Sortable data table** with all school statistics

### Export & Sharing
- **Take snapshots** of current map state
- **Download as PNG** for presentations
- **Custom scenarios** created by manual reassignment

## Project Structure

```text
src/
├── components/
│   ├── MainView.tsx          # Main map and data table component
│   └── MainView.css          # Component styles
├── hooks/
│   └── useGeoData.ts         # Data loading custom hook
├── types/
│   └── index.ts              # TypeScript interfaces
├── utils/
│   └── calculations.ts       # Distance and color utilities
├── App.tsx                   # Root component
└── main.tsx                  # Application entry point

angular-app/public/assets/    # GeoJSON data files
├── schoolLocations.geo.json  # Elementary school locations
├── planningBlocks.geo.json   # Census block boundaries
└── [YYMMDD].geo.json        # Redistricting proposals by date
```

## Technology Stack

### Modern Stack (Current)
- **Frontend:** React 18 + TypeScript
- **Build:** Vite 7
- **Mapping:** Mapbox GL JS
- **Styling:** CSS Modules
- **State:** React Hooks (useState, useEffect, useRef)

### Legacy Stack (Preserved)
- **Frontend:** AngularJS 1.4, UI-Router
- **Build:** Gulp 3.x
- **Mapping:** Leaflet with angular-leaflet-directive
- **Styling:** Bootstrap 3, SASS, Font Awesome
- **Testing:** Karma + Jasmine

## Migration History

- **January 2026:** Complete migration to React 18 with TypeScript
  - Modernized build system (Gulp → Vite)
  - Updated mapping library (Leaflet → Mapbox GL)
  - Improved performance (90% faster builds, 60%+ smaller bundles)
  - Added TypeScript for type safety
  - Implemented modern React patterns (hooks, functional components)

- **2015:** Original AngularJS 1.4 implementation

See [MODERNIZATION_ROADMAP.md](./MODERNIZATION_ROADMAP.md) for detailed migration strategy.
See [VUE_TO_REACT_MIGRATION.md](./VUE_TO_REACT_MIGRATION.md) for React conversion notes.

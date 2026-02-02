# BCPS School Redistricting Tool - AI Coding Instructions

## Project Overview
This is a **React 18 + TypeScript** application for visualizing and analyzing Baltimore County Public Schools (BCPS) elementary school redistricting scenarios. The app displays interactive maps with school locations, planning blocks, and various redistricting proposals from 2015 meetings.

**Status:** ✅ Fully modernized from AngularJS 1.4 to React 18 (February 2026)

**Legacy Note:** The original AngularJS app is preserved in `angular-app/` directory.

## Architecture & Tech Stack

### Modern Stack (Current)
- **Frontend**: React 18 with TypeScript (strict mode)
- **Build System**: Vite 7 with hot module replacement
- **Mapping**: Mapbox GL JS for GPU-accelerated vector maps
- **Data**: GeoJSON files in `angular-app/public/assets/` (shared with legacy app)
- **Styling**: Plain CSS (no framework)
- **State**: React Hooks (useState, useEffect, useRef)
- **Package Manager**: npm (Node 18+)

### Legacy Stack (Preserved)
- **Frontend**: AngularJS 1.4 with UI-Router
- **Build**: Gulp 3.x
- **Mapping**: Leaflet 0.7.5
- **Location**: `angular-app/` directory

## Key File Structure
```
src/
├── components/
│   ├── MainView.tsx          # Main map and data table component
│   └── MainView.css          # Component styles
├── hooks/
│   └── useGeoData.ts         # Custom hook for GeoJSON loading
├── types/
│   └── index.ts              # TypeScript interfaces
├── utils/
│   └── calculations.ts       # Distance and color utilities
├── App.tsx                   # Root component
├── main.tsx                  # Entry point
└── vite-env.d.ts            # Vite type definitions

angular-app/public/assets/   # GeoJSON data (shared)
├── schoolLocations.geo.json
├── planningBlocks.geo.json
└── [YYMMDD].geo.json        # Redistricting options
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

### Quick Start
```bash
npm install            # Install dependencies
npm run dev            # Start dev server at http://localhost:3000
npm run build          # Production build to dist/
npm run preview        # Preview production build
```

### Development Commands
- **dev**: Vite dev server with HMR (Hot Module Replacement)
- **build**: TypeScript compilation + Vite production build
- **preview**: Serve production build locally
- **Type checking**: `npx tsc --noEmit`

## Map Integration Patterns

### Mapbox GL Setup
Maps use Mapbox GL JS with vector tiles. Configure in `MainView.tsx`:
```typescript
const map = new mapboxgl.Map({
  container: mapContainerRef.current,
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-76.730514, 39.271697],
  zoom: 12,
  preserveDrawingBuffer: true  // Required for snapshots
})
```

### GeoJSON Layer Management
- Load data via `useGeoData` custom hook (runs once on mount)
- Add layers using Mapbox GL sources and layers API
- Use Mapbox expressions for dynamic styling (not callbacks)
- Store map reference in `useRef` for persistence

### Interactive Features
- Click handlers on map layers (schools-circle, planning-blocks-fill)
- **Important**: Use `selectedSchoolRef.current` in event handlers (not state)
- Color-coding via Mapbox expressions with ['match', ['get', 'PBID'], ...]
- Real-time updates using functional setState

### Critical Patterns
```typescript
// ✅ Correct - using ref in event handler
map.on('click', 'layer-name', (e) => {
  const selected = selectedSchoolRef.current
  // Use selected...
})

// ❌ Wrong - using state directly (stale closure)
map.on('click', 'layer-name', (e) => {
  if (selectedSchool) { }  // May be stale
})

// ✅ Correct - functional state update
setSchools(currentSchools => currentSchools.map(...))

// ❌ Wrong - direct state update
setSchools(schools.map(...))  // Uses stale schools
```

## State Management Patterns

### Data Loading
All GeoJSON loaded via `useGeoData` custom hook:
```typescript
export function useGeoData() {
  const [data, setData] = useState<GeoDataState>({ loading: true, ... })
  
  useEffect(() => {
    const loadData = async () => {
      const planningBlocks = await fetch('/assets/planningBlocks.geo.json')
      const schools = await fetch('/assets/schoolLocations.geo.json')
      const options = await loadOptions()  // Load all 33 options
      setData({ schools, planningBlocks, options, loading: false })
    }
    loadData()
  }, [])
  
  return data
}
```

### State Architecture
```typescript
// Component state
const [schools, setSchools] = useState<School[]>([])           // School data
const [selectedSchool, setSelectedSchool] = useState<string>('')  // UI state
const selectedSchoolRef = useRef<string>('')                   // For closures

// Sync ref with state
useEffect(() => {
  selectedSchoolRef.current = selectedSchool
}, [selectedSchool])
```

### Data Updates
- Student counts calculated on-demand in `calculateStudents()`
- Planning block reassignment updates schools array immutably
- Map colors updated via `setPaintProperty()` with new expression
- Table re-renders automatically when schools state changes

## TypeScript & Type Safety

### Key Interfaces
```typescript
interface School {
  NAME: string
  SRC: number                    // 2015 capacity
  SRC2016?: number               // 2016 capacity
  SRC2017?: number               // 2017 capacity
  students: number               // Calculated enrollment
  planningBlocks: string[]       // Assigned PBID list
}

interface PlanningBlock {
  PBID: string                   // Unique identifier
  K5LiveAtt: string              // Student count (string in data)
}

interface RedistrictingOption {
  [schoolName: string]: string[] // School name -> PBID array
}
```

### Type Checking
- Strict mode enabled in tsconfig.json
- All props and state typed
- GeoJSON types from custom interfaces
- Run `npx tsc --noEmit` to check types

## Testing

### Manual Testing Checklist
No automated tests currently. Verify:
- [ ] Map loads with planning blocks and schools
- [ ] Current districting loads on page load
- [ ] School click selects (banner shows)
- [ ] Planning block click reassigns to selected school
- [ ] Student counts update in table
- [ ] All 33 options load correctly
- [ ] Snapshot captures map state
- [ ] Build succeeds: `npm run build`

## Styling
- Plain CSS, no framework
- Component-specific: `MainView.css`
- Global styles: `App.css`
- No CSS modules or styled-components
- Minimal inline styles (only for dynamic colors)

## Important Notes

### Closure Issues
Always use refs for values accessed in event handlers that are set up once:
```typescript
const selectedSchoolRef = useRef<string>('')

useEffect(() => {
  selectedSchoolRef.current = selectedSchool  // Keep in sync
}, [selectedSchool])

map.on('click', () => {
  const current = selectedSchoolRef.current  // Always fresh
})
```

### Mapbox Expressions
Use expressions for performance (evaluated on GPU):
```typescript
'fill-color': [
  'match',
  ['get', 'PBID'],
  '123', '#FF0000',
  '456', '#00FF00',
  '#888888'  // default
]
```

### Asset Loading
Vite configured to serve from `angular-app/public/`:
```typescript
// vite.config.ts
export default defineConfig({
  publicDir: 'angular-app/public'
})
```

## Git Workflow

This project uses **GitHub Flow** for version control:

### Branch Strategy
- **master** - Main production branch (always deployable)
- **Feature branches** - Short-lived branches for each task
- **Naming convention**:
  - `feature/description` - New features
  - `fix/description` - Bug fixes  
  - `docs/description` - Documentation
  - `refactor/description` - Code refactoring

### Development Process

#### 1. Create GitHub Issue
```bash
# Using GitHub CLI (recommended)
gh issue create --title "Feature: Your feature" --body "Description..."

# Or manually at github.com
```

#### 2. Create Branch from Issue
```bash
# Option 1: Manual
git checkout -b feature/your-feature

# Option 2: GitHub CLI (auto-links to issue)
gh issue develop <issue-number> --checkout
```

#### 3. Commit with Co-Author Attribution
```bash
git add .
git commit -m "Add feature summary

Detailed explanation of changes.

Co-Authored-By: Warp <agent@warp.dev>"
```

**IMPORTANT**: Always include `Co-Authored-By: Warp <agent@warp.dev>` in commit messages when AI-assisted.

#### 4. Push and Create PR
```bash
# Push branch
git push -u origin feature/your-feature

# Create PR with auto-close syntax
gh pr create --title "Feature title" --body "Closes #123

Changes made..."
```

#### 5. After Merge
```bash
git checkout master
git pull
git branch -d feature/your-feature
```

### Quick Commands
```bash
# Setup GitHub CLI
brew install gh
gh auth login

# Full workflow
gh issue create --title "Fix: Bug description"
gh issue develop 10 --checkout
# ... make changes ...
git add . && git commit -m "Fix bug\n\nCo-Authored-By: Warp <agent@warp.dev>"
git push -u origin fix/bug-description
gh pr create --title "Fix bug" --body "Closes #10"
```

## When Working With This Codebase

1. **Focus on data flow**: GeoJSON → useGeoData → React state → Map + Table
2. **Use functional updates**: Always when new state depends on old state
3. **Refs for events**: Use refs in event handlers, not direct state
4. **Test interactively**: Click schools, reassign blocks, verify table updates
5. **Check console**: Debug logs throughout for troubleshooting
6. **Preserve compatibility**: Don't change GeoJSON structure
7. **Single component**: MainView handles everything (intentionally monolithic)
8. **Commit format**: ALWAYS include `Co-Authored-By: Warp <agent@warp.dev>` in commits

## Additional Documentation
- [README.md](../README.md) - User guide and setup
- [INSTRUCTIONS.md](../INSTRUCTIONS.md) - Detailed developer docs
- [MODERNIZATION_ROADMAP.md](../MODERNIZATION_ROADMAP.md) - Migration details
- [VUE_TO_REACT_MIGRATION.md](../VUE_TO_REACT_MIGRATION.md) - React conversion notes

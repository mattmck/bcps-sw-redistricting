# BCPS Redistricting App - Modernization Roadmap

## Current State (2015 Tech Stack)

- AngularJS 1.4 (EOL, security risks)
- Gulp 3.x (deprecated)
- Bower (deprecated 2017)
- Bootstrap 3 (2013)
- Leaflet 0.7.5 (2014)
- Node.js 0.10+ (ancient)

## Target State (2025 Modern Stack)

- React 18 + TypeScript
- Vite (build tool)
- npm/yarn (package management)
- Tailwind CSS (styling)
- React Leaflet (mapping)
- Node.js 20+ LTS

## Migration Strategy: Gradual Approach

### Phase 1: Infrastructure Modernization (1-2 weeks)

#### Step 1: Package Management Migration

```bash
# Remove Bower
rm bower.json
rm -rf bower_components

# Initialize modern package.json
npm init -y
npm install --save-dev vite @vitejs/plugin-react react react-dom typescript
npm install --save-dev @types/react @types/react-dom
```

#### Step 2: Build System Migration

Replace Gulp with Vite:

**New vite.config.ts:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

**New package.json scripts:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

### Phase 2: Library Updates (1-2 weeks)

#### Step 1: Mapping Modernization

```bash
npm install leaflet@latest react-leaflet
npm install --save-dev @types/leaflet
```

**Modern Leaflet Component:**

```typescript
import { useState, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface GeoJsonLayer {
  id: string
  data: any
  options?: any
}

interface MapComponentProps {
  geoJsonLayers: GeoJsonLayer[]
  onFeatureClick?: (e: any) => void
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  geoJsonLayers, 
  onFeatureClick 
}) => {
  const [zoom] = useState(12)
  const [center] = useState<[number, number]>([39.271697, -76.730514])
  const mapRef = useRef<LeafletMap>(null)
  const tileUrl = 'https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=...'

  return (
    <MapContainer 
      ref={mapRef}
      center={center} 
      zoom={zoom} 
      style={{ height: '400px' }}
    >
      <TileLayer url={tileUrl} />
      {geoJsonLayers.map((layer) => (
        <GeoJSON
          key={layer.id}
          data={layer.data}
          {...layer.options}
          eventHandlers={{
            click: onFeatureClick
          }}
        />
      ))}
    </MapContainer>
  )
}
```

#### Step 2: Styling Modernization

```bash
npm install tailwindcss autoprefixer postcss
npx tailwindcss init -p
```

Replace Bootstrap 3 classes with Tailwind:

```html
<!-- Old Bootstrap 3 -->
<div class="container-fluid">
  <div class="row">
    <div class="col-md-12">

<!-- New Tailwind -->
<div class="w-full">
  <div class="flex flex-wrap">
    <div class="w-full">
```

### Phase 3: Framework Migration (2-4 weeks)

#### Convert AngularJS Controller to React Component

**Old AngularJS Controller:**

```javascript
function MainController($scope, $resource) {
  $scope.schools = [];
  $scope.selectedSchool = null;
  
  $scope.loadOption = function(option) {
    // Complex logic here
  };
}
```

**New React Component:**

```typescript
import { useState, useMemo } from 'react'
import { useSchoolData } from '@/hooks/useSchoolData'
import { useMapInteractions } from '@/hooks/useMapInteractions'
import type { School, RedistrictingOption } from '@/types'

export const MainView: React.FC = () => {
  // State
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)

  // Custom hooks for reusable logic
  const { loadSchoolData, loadRedistrictingOption } = useSchoolData()
  const { handleSchoolClick, handlePlanningBlockClick } = useMapInteractions()

  // Computed values
  const schoolsWithStudentCounts = useMemo(() => {
    return schools.map(school => ({
      ...school,
      students: calculateStudentCount(school)
    }))
  }, [schools])

  // Methods
  const loadOption = async (option: RedistrictingOption) => {
    await loadRedistrictingOption(option)
    // Update map layers
  }

  return (
    <div className="main-view">
      {/* Component JSX here */}
    </div>
  )
}
```

#### Data Management Modernization

**Replace $resource with modern fetch/axios:**

```typescript
// hooks/useSchoolData.ts
import { useState } from 'react'
import type { School } from '@/types'

export function useSchoolData() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  
  const loadSchoolData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/assets/schoolLocations.geo.json')
      const data = await response.json()
      setSchools(processSchoolData(data))
    } finally {
      setLoading(false)
    }
  }
  
  return { schools, loading, loadSchoolData }
}
```

## Migration Benefits

### Performance Improvements

- **Bundle size**: 60-80% reduction (AngularJS ~150KB → React 18 ~45KB)
- **Build time**: 90% faster (Gulp ~30s → Vite ~3s)
- **Dev server**: Hot Module Replacement (instant updates)
- **Modern JavaScript**: Tree shaking, code splitting

### Developer Experience

- **TypeScript**: Type safety, better IDE support
- **Modern tooling**: ESLint, Prettier, Vitest
- **Component-based**: Reusable, testable components
- **Reactive system**: Automatic UI updates

### Maintainability

- **Security**: No EOL dependencies
- **Documentation**: Modern, actively maintained libraries
- **Community**: Large, active ecosystems
- **Future-proof**: Regular updates and improvements

## Implementation Timeline

### ✅ Phase 1: Infrastructure (Completed)

- [x] Set up Vite build system
- [x] Migrate from Bower to npm
- [x] Update Node.js tooling
- [x] Set up TypeScript with strict mode

### ✅ Phase 2: Framework Migration (Completed)

- [x] Create React components for major UI sections
- [x] Convert AngularJS services to React hooks
- [x] Migrate templates to JSX/TSX
- [x] Implement state management with useState/useRef

### ✅ Phase 3: Mapping & Data (Completed)

- [x] Upgrade to Mapbox GL JS (from Leaflet)
- [x] Implement GeoJSON data loading
- [x] Add interactive click handlers
- [x] Real-time data updates

### ✅ Phase 4: Features & Polish (Completed)

- [x] All 33 redistricting options
- [x] Interactive school/block selection
- [x] Real-time student calculations
- [x] Snapshot export functionality
- [x] Documentation updates

## ✅ Migration Complete (February 2026)

All core functionality has been successfully migrated to React 18.

## Risk Mitigation

1. **Maintain parallel versions** during migration
2. **Feature flags** for gradual rollout
3. **Comprehensive testing** at each phase
4. **Data backup** and validation
5. **User acceptance testing** with stakeholders

## Alternative: Quick Security Fix

If full modernization isn't feasible immediately, consider this minimal security update:

```bash
# Update to latest AngularJS (still EOL but more secure)
npm install angular@1.8.3

# Update critical security dependencies
npm audit fix

# Replace Bower with npm equivalents
npm install bootstrap@3.4.1 leaflet@1.9.x
```

This buys time while planning the full modernization.

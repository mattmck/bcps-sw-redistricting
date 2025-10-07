# BCPS Redistricting App - Modernization Roadmap

## Current State (2015 Tech Stack)
- AngularJS 1.4 (EOL, security risks)
- Gulp 3.x (deprecated)
- Bower (deprecated 2017)
- Bootstrap 3 (2013)
- Leaflet 0.7.5 (2014)
- Node.js 0.10+ (ancient)

## Target State (2025 Modern Stack)
- Vue 3 + TypeScript
- Vite (build tool)
- npm/yarn (package management)
- Tailwind CSS (styling)
- Leaflet 1.9+ (mapping)
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
npm install --save-dev vite @vitejs/plugin-vue vue@next typescript
```

#### Step 2: Build System Migration
Replace Gulp with Vite:

**New vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
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
npm install leaflet@latest vue-leaflet @vue-leaflet/vue-leaflet
```

**Modern Leaflet Component:**
```vue
<template>
  <LMap 
    ref="map"
    :zoom="zoom"
    :center="center"
    style="height: 400px"
  >
    <LTileLayer :url="tileUrl" />
    <LGeoJson 
      v-for="layer in geoJsonLayers" 
      :key="layer.id"
      :geojson="layer.data"
      :options="layer.options"
      @click="handleFeatureClick"
    />
  </LMap>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { LMap, LTileLayer, LGeoJson } from '@vue-leaflet/vue-leaflet'

const zoom = ref(12)
const center = ref([39.271697, -76.730514])
const tileUrl = 'https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=...'
</script>
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

#### Convert AngularJS Controller to Vue Composition API

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

**New Vue Composition API:**
```typescript
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSchoolData } from '@/composables/useSchoolData'
import { useMapInteractions } from '@/composables/useMapInteractions'

// Reactive state
const schools = ref<School[]>([])
const selectedSchool = ref<School | null>(null)

// Composables for reusable logic
const { loadSchoolData, loadRedistrictingOption } = useSchoolData()
const { handleSchoolClick, handlePlanningBlockClick } = useMapInteractions()

// Computed properties
const schoolsWithStudentCounts = computed(() => {
  return schools.value.map(school => ({
    ...school,
    students: calculateStudentCount(school)
  }))
})

// Methods
const loadOption = async (option: RedistrictingOption) => {
  await loadRedistrictingOption(option)
  // Update map layers
}
</script>
```

#### Data Management Modernization

**Replace $resource with modern fetch/axios:**
```typescript
// composables/useSchoolData.ts
import { ref } from 'vue'

export function useSchoolData() {
  const schools = ref<School[]>([])
  const loading = ref(false)
  
  const loadSchoolData = async () => {
    loading.value = true
    try {
      const response = await fetch('/assets/schoolLocations.geo.json')
      const data = await response.json()
      schools.value = processSchoolData(data)
    } finally {
      loading.value = false
    }
  }
  
  return { schools, loading, loadSchoolData }
}
```

## Migration Benefits

### Performance Improvements
- **Bundle size**: 60-80% reduction (AngularJS ~150KB → Vue 3 ~40KB)
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

### Week 1-2: Infrastructure
- [ ] Set up Vite build system
- [ ] Migrate from Bower to npm
- [ ] Update Node.js and tooling
- [ ] Set up TypeScript

### Week 3-4: Libraries
- [ ] Upgrade Leaflet and mapping components
- [ ] Migrate to Tailwind CSS
- [ ] Update testing framework
- [ ] Replace utility libraries

### Week 5-8: Framework
- [ ] Create Vue components for major UI sections
- [ ] Convert AngularJS services to Vue composables
- [ ] Migrate templates to Vue syntax
- [ ] Implement state management with Pinia

### Week 9-10: Polish & Testing
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Deployment configuration

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
# Developer Instructions

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)

### Quick Start
```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development Guide

### Project Structure
```
src/
├── components/          # React components
│   ├── MainView.tsx    # Main map and table component
│   └── MainView.css    # Component styles
├── hooks/              # Custom React hooks
│   └── useGeoData.ts   # GeoJSON data loading
├── types/              # TypeScript type definitions
│   └── index.ts        # Shared interfaces
├── utils/              # Utility functions
│   └── calculations.ts # Distance, color helpers
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

### Key Technologies

#### React 18
- **Functional components** with hooks
- **useState** for local component state
- **useEffect** for side effects (data loading, map initialization)
- **useRef** for mutable values and DOM references

#### TypeScript
- Strict mode enabled
- Full type safety for GeoJSON data structures
- Type-safe props and state

#### Mapbox GL
- Interactive vector maps
- Click handlers for schools and planning blocks
- Dynamic color styling with expressions
- Canvas snapshot export

### Data Flow

1. **Page Load**
   - `useGeoData` hook loads all GeoJSON files
   - Planning blocks and school locations fetched
   - 33 redistricting options loaded from different meeting dates

2. **Map Initialization**
   - Mapbox GL map created with preserveDrawingBuffer for snapshots
   - Planning blocks added as fill layer
   - Schools added as circle markers
   - Click handlers attached

3. **User Interactions**
   - Click school marker → updates `selectedSchool` state
   - Click planning block → calls `handleBlockClick`
   - Block reassignment updates schools array
   - Map colors and table update reactively

4. **State Management**
   - `schools` - array of School objects with planning block assignments
   - `selectedSchool` - currently selected school name
   - `selectedSchoolRef` - ref to avoid closure issues in event handlers

### Adding New Features

#### Adding a New Redistricting Option
1. Place GeoJSON file in `angular-app/public/assets/`
2. Update `useGeoData.ts` to load the new option
3. Add button in MainView.tsx options panel
4. Update TypeScript types if needed

#### Modifying the Map
Map configuration in `MainView.tsx`:
```typescript
const map = new mapboxgl.Map({
  container: mapContainerRef.current,
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-76.730514, 39.271697],
  zoom: 12,
  preserveDrawingBuffer: true  // Required for snapshots
})
```

#### Adding Student Calculation Adjustments
Update the `adjustments` object in `calculateStudents`:
```typescript
const adjustments: Record<string, number> = {
  'School Name ES': additionalStudents,
  // ...
}
```

### Common Tasks

#### Update Dependencies
```bash
npm update
```

#### Type Check Without Building
```bash
npx tsc --noEmit
```

#### Lint/Format Code
```bash
# Add these to package.json if needed
npm run lint
npm run format
```

#### Debug Map Issues
Enable console logging by checking browser DevTools. Key logs:
- "useGeoData: Starting to load data..."
- "Initializing map layers..."
- "Map colors updated successfully"

### Performance Considerations

1. **State Updates**
   - Use functional updates for state that depends on previous state
   - Avoid unnecessary re-renders with proper dependency arrays

2. **Map Rendering**
   - Mapbox GL is GPU-accelerated
   - Use Mapbox expressions for styling (not per-feature callbacks)
   - preserveDrawingBuffer has slight performance cost but needed for snapshots

3. **Data Loading**
   - All GeoJSON loaded on initial page load
   - Consider lazy loading for very large datasets

### Troubleshooting

#### Map Not Displaying
- Check Mapbox access token is valid
- Verify `mapbox-gl/dist/mapbox-gl.css` is imported
- Check browser console for WebGL errors

#### Planning Blocks Not Clickable
- Ensure click handler uses `selectedSchoolRef.current` not `selectedSchool`
- Verify layer name matches: `'planning-blocks-fill'`
- Check features are being returned in click event

#### Student Counts Wrong
- Verify GeoJSON PBID matches between planning blocks and options
- Check `K5LiveAtt` property exists in planning block data
- Review adjustment values in `calculateStudents`

#### Snapshot Export Blank
- Map must have `preserveDrawingBuffer: true`
- Ensure map has finished loading before snapshot
- Check canvas.toDataURL() browser support

## Deployment

### Production Build
```bash
npm run build
```

Output goes to `dist/` directory.

### Environment Variables
Create `.env` file for custom configuration:
```
VITE_MAPBOX_TOKEN=your_token_here
```

Access in code:
```typescript
const token = import.meta.env.VITE_MAPBOX_TOKEN
```

### Hosting
The built app is static and can be hosted anywhere:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static file server

## Testing

### Manual Testing Checklist
- [ ] Map loads with planning blocks and schools visible
- [ ] Current districting loads on page load
- [ ] Click school marker selects it (banner appears)
- [ ] Click planning block reassigns it to selected school
- [ ] Student counts update in table
- [ ] Over-capacity schools show in red
- [ ] All 33 redistricting options load correctly
- [ ] Snapshot button captures map and allows download
- [ ] Map is interactive (pan, zoom)

### Automated Testing (Future)
Consider adding:
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests

## Additional Resources

- [React Documentation](https://react.dev)
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

## Support

For questions or issues:
1. Check existing documentation in this repo
2. Review console logs for errors
3. Check git history for recent changes
4. See MODERNIZATION_ROADMAP.md for architecture decisions

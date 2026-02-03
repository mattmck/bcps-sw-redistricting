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
src/                    # Frontend (React)
├── components/          # React components
│   ├── MainView.tsx    # Main map and table component
│   └── MainView.css    # Component styles
├── hooks/              # Custom React hooks
│   ├── useGeoData.ts   # Static GeoJSON loading
│   └── useGeoData.api.ts # API-based data loading
├── services/           # API integration
│   └── apiClient.ts    # Backend API client
├── types/              # TypeScript type definitions
│   └── index.ts        # Shared interfaces
├── utils/              # Utility functions
│   └── calculations.ts # Distance, color helpers
├── App.tsx             # Root component
└── main.tsx            # Entry point

backend/                # Backend API (optional)
├── src/
│   ├── routes/         # API endpoint handlers
│   ├── services/       # Business logic
│   ├── db/             # PostgreSQL connection
│   └── index.ts        # Express server
├── migrations/         # Flyway SQL migrations
└── scripts/
    └── migrate-data.ts # Data import script
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

#### Working with Backend API

Switch between static and API data modes:

```typescript
// Use static GeoJSON files (default)
import { useGeoData } from '@/hooks/useGeoData'

// Use backend API (requires backend running)
import { useGeoData } from '@/hooks/useGeoData.api'
```

Start the backend:

```bash
cd backend
docker-compose up -d  # PostgreSQL + API on port 4000
npm run migrate       # Import data (first time only)
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

## IDE Setup & Linting

### Documentation Linting

All markdown files are linted with `markdownlint` to maintain consistent formatting and style.

#### VS Code (Recommended)

1. Install the [markdownlint extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) by David Anson
2. Reload VS Code
3. The linter automatically detects `.markdownlintrc.json` in the workspace root
4. Violations appear as squiggly lines; hover for details

The `.vscode/settings.json` file is pre-configured with linting rules.

#### IntelliJ/WebStorm

1. Open **Settings** → **Languages & Frameworks** → **Markdown**
2. Enable **Markdown linting** checkbox
3. Configure linter settings in **Markdown** → **Code Style**
4. Violations appear as inspections in the editor

#### Sublime Text

1. Install [Package Control](https://packagecontrol.io)
2. Install `SublimeLinter` package
3. Install `SublimeLinter-contrib-markdownlint` package
4. Linter runs automatically on markdown files

#### Vim/Neovim

Use one of:

- **ALE plugin**: Add to config:
  ```vim
  let b:ale_linters = ['markdownlint']
  ```

- **Neomake plugin**: Configure for markdown:
  ```vim
  let g:neomake_markdown_enabled_makers = ['markdownlint']
  ```

#### Command Line

Run linter manually:

```bash
npx markdownlint --config .markdownlintrc.json "*.md" "docs/*.md"
```

Auto-fix fixable issues:

```bash
npx markdownlint --config .markdownlintrc.json --fix "*.md" "docs/*.md"
```

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

## Git Workflow

This project uses **GitHub Flow** - a lightweight, branch-based workflow suitable for continuous delivery.

### Branching Strategy

- **`master`** - Main production branch (always deployable)
- **Feature branches** - Short-lived branches for features, fixes, or docs
- **Branch naming**:
  - `feature/description` - New features
  - `fix/description` - Bug fixes
  - `docs/description` - Documentation updates
  - `refactor/description` - Code refactoring
  - `chore/description` - Maintenance tasks
  - `test/description` - Test-only changes
  - `task/description` - General work items

### Pull Request Title Convention

Use a Conventional Commits-style title:

```
type(scope?): summary
```

Allowed `type` values: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `task`.

Examples:

- `feat(map): add block hover tooltip`
- `fix(api): handle empty options list`
- `docs: clarify deployment steps`

### Development Process

#### 1. Create a Feature Request

Start with a GitHub issue to track the work:

```bash
# Using GitHub CLI (recommended)
gh issue create --title "Feature: Add school boundary editing" \
  --body "Allow drag-and-drop reassignment of planning blocks"

# Or create manually at github.com/your-username/bcps-sw-redistricting/issues
```

Use labels like `enhancement`, `bug`, `documentation` to categorize.

#### 2. Create Branch from Issue

```bash
# Option 1: Manual branch creation
git checkout -b feature/school-boundary-editing

# Option 2: Using GitHub CLI (automatically links branch to issue)
gh issue develop <issue-number> --checkout
```

#### 3. Make Changes and Commit

Write meaningful commit messages with co-author attribution:

```bash
# Stage your changes
git add src/components/MainView.tsx

# Commit with descriptive message
git commit -m "Add drag-and-drop for planning blocks

Implements interactive boundary editing with visual feedback.
Updates map colors in real-time as blocks are reassigned.

Co-Authored-By: Warp <agent@warp.dev>"
```

**Commit message format:**

- First line: Brief summary (50 chars or less)
- Blank line
- Detailed explanation (wrap at 72 chars)
- Blank line
- `Co-Authored-By: Warp <agent@warp.dev>` (if AI-assisted)

#### 4. Push Branch to Remote

```bash
# First push (creates remote branch)
git push -u origin feature/school-boundary-editing

# Subsequent pushes
git push
```

#### 5. Create Pull Request

```bash
# Using GitHub CLI
gh pr create --title "feat(map): add school boundary editing" \
  --body "Closes #42

## Changes
- Implemented drag-and-drop for planning blocks
- Added visual feedback during reassignment
- Updated map rendering logic

## Testing
- [x] Manual testing with all 33 redistricting options
- [x] Verified student count recalculation
- [x] Checked snapshot export functionality"

# Or create manually at github.com
```

**PR best practices:**

- Reference the issue with `Closes #123` (auto-closes on merge)
- Include a summary of changes
- List testing done
- Add screenshots for UI changes
- Keep PRs focused (one feature/fix per PR)

#### 6. Code Review and Merge

```bash
# After PR approval, merge via GitHub UI or CLI
gh pr merge --squash  # Squash commits into one
# or
gh pr merge --merge   # Keep all commits
# or
gh pr merge --rebase  # Rebase and merge
```

#### 7. Clean Up

```bash
# Switch back to master
git checkout master

# Pull latest changes
git pull

# Delete local feature branch
git branch -d feature/school-boundary-editing

# Delete remote branch (if not auto-deleted)
git push origin --delete feature/school-boundary-editing
```

### Quick Reference

```bash
# Full workflow example
gh issue create --title "Fix: Student count calculation"
gh issue develop 15 --checkout  # Creates branch for issue #15

# Make changes...
git add .
git commit -m "Fix student count calculation

Co-Authored-By: Warp <agent@warp.dev>"

git push -u origin fix/student-count-calculation
gh pr create --title "Fix student count calculation" --body "Closes #15"

# After merge...
git checkout master
git pull
git branch -d fix/student-count-calculation
```

### GitHub CLI Setup

Install and authenticate:

```bash
# Install (macOS)
brew install gh

# Authenticate with GitHub
gh auth login

# Verify setup
gh auth status
```

### Tips

- **Keep branches short-lived**: Merge within days, not weeks
- **Commit often**: Small, focused commits are easier to review
- **Write clear messages**: Future you will thank present you
- **Test before pushing**: Run `npm run build` and test manually
- **Stay updated**: Regularly pull from master to avoid conflicts
- **Co-author attribution**: Always include `Co-Authored-By: Warp <agent@warp.dev>` when AI-assisted

## Support

For questions or issues:

1. Check existing documentation in this repo
2. Review console logs for errors
3. Check git history for recent changes
4. See MODERNIZATION_ROADMAP.md for architecture decisions

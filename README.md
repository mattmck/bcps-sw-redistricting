# BCPS School Redistricting Tool

A full-stack application for visualizing and analyzing Baltimore County Public Schools (BCPS) elementary school redistricting scenarios.

**Status:**

- ✅ Frontend: Fully migrated from AngularJS 1.4 to React 18 (February 2026)
- ✅ Backend: PostGIS database with REST API (February 2026)

## 🚀 Production Deployment

This app supports full-stack deployment to **Azure** with infrastructure as code. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

**Full Stack:**

- **Frontend:** Azure Static Web Apps
- **Backend API:** Azure Container Apps
- **Database:** Azure PostgreSQL with PostGIS

**Frontend-Only:** For static deployment without backend, see [DEPLOYMENT_FRONTEND_ONLY.md](./DEPLOYMENT_FRONTEND_ONLY.md)

## Quick Start

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **Docker** and **Docker Compose** (for local backend development)
- **npm** or **yarn**
- **CodeQL CLI** (optional, for security analysis) - See [CODEQL.md](./docs/CODEQL.md)

### Automated Setup (Recommended for New Developers)

Run the automated setup script to install dependencies and configure CodeQL:

```bash
./scripts/setup-dev.sh
```

This script:

- ✅ Checks Node.js version
- ✅ Installs CodeQL CLI (macOS via Homebrew)
- ✅ Downloads CodeQL query packs
- ✅ Runs `npm install`
- ✅ Displays next steps and documentation links

### Option 1: Full Stack (with Backend)

1. **Start the backend services:**

   ```bash
   cd backend
   docker-compose up -d
   ```

   This starts PostgreSQL with PostGIS and the Express API on port 4000.

2. **Initialize the database (first time only):**

   ```bash
   npm install
   npm run migrate  # Imports GeoJSON data into PostgreSQL
   ```

3. **Start the frontend:**

   ```bash
   cd ..
   npm install
   npm run dev
   ```

   The app will open at `http://localhost:3000`

### Option 2: Frontend Only (Static Files)

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

   Uses static GeoJSON files from `angular-app/public/assets/`

### Development Workflow

#### Frontend

- **Dev server with HMR:** `npm run dev`
- **Build:** `npm run build`
- **Preview build:** `npm run preview`
- **Type check:** `npx tsc --noEmit`

#### Backend

- **Start services:** `cd backend && docker-compose up -d`
- **View API logs:** `docker-compose logs -f api`
- **View DB logs:** `docker-compose logs -f db`
- **Stop services:** `docker-compose down`
- **Migrate data:** `npm run migrate`
- **Dev mode:** `npm run dev` (uses nodemon for hot reload)

#### Code Quality & Security

- **Run CodeQL scan:** `npm run codeql:scan`
- **View scan results:** `npm run codeql:view`
- **Clean up:** `npm run codeql:clean`
- See [CODEQL.md](./docs/CODEQL.md) for detailed setup and usage

### Git Workflow

This project uses **GitHub Flow** for version control:

#### 1. Create Feature Request (GitHub Issue)

```bash
# Using GitHub CLI
gh issue create --title "Feature: Your feature name" --body "Description..."

# Or create manually at github.com
```

#### 2. Create Branch from Issue

```bash
# Option 1: Manual branch creation
git checkout -b feature/your-feature-name

# Option 2: Using GitHub CLI (auto-links to issue)
gh issue develop <issue-number> --checkout
```

#### 3. Commit Changes

```bash
git add .
git commit -m "Add feature description

Detailed explanation of changes

Co-Authored-By: Warp <agent@warp.dev>"
```

#### 4. Push and Create Pull Request

```bash
# Push branch
git push -u origin feature/your-feature-name

# Create PR (auto-links to issue with "Closes #123")
gh pr create --title "Add feature name" --body "Closes #123

Description of changes..."
```

#### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

#### Setup GitHub CLI

```bash
brew install gh
gh auth login
```

## Legacy AngularJS App

⚠️ **Security Notice**: The original AngularJS 1.4 application is preserved in the `angular-app/` directory for reference only. It contains known security vulnerabilities in outdated dependencies and should NOT be used in production. See `angular-app/SECURITY.md` for details.

**Use the modern React 18 app for all production needs.**

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

## Backend API

The backend provides a REST API for spatial data queries.

### Endpoints

#### Health Check

```http
GET /health
```

Returns API health and database connection status.

#### Schools

```http
GET /api/schools              # Get all schools (GeoJSON FeatureCollection)
GET /api/schools/:id          # Get single school by ID
```

#### Planning Blocks

```http
GET /api/planning-blocks      # Get all planning blocks (GeoJSON FeatureCollection)
GET /api/planning-blocks/:id  # Get single planning block by ID
```

#### Redistricting Options

```http
GET /api/options              # List all redistricting options
GET /api/options/:id          # Get option with school assignments
GET /api/options/:id/stats    # Get utilization statistics for option
POST /api/options             # Create new option
PUT /api/options/:id          # Update existing option
DELETE /api/options/:id       # Delete option
```

### Database Schema

**Tables:**

- `schools` - Elementary school locations (Point geometry)
- `planning_blocks` - Census planning blocks (Polygon geometry)
- `redistricting_options` - Redistricting scenarios metadata
- `option_assignments` - School-to-planning-block assignments
- `walking_radii` - Walking distance radii (future)

**Spatial Features:**

- PostGIS GEOGRAPHY type with SRID 4326 (WGS84)
- GIST spatial indexes for performance
- ST_AsGeoJSON for GeoJSON output

### Local Development

```bash
# Start backend services
cd backend
docker-compose up -d

# Check API health
curl http://localhost:4000/health | jq

# Test endpoints
curl http://localhost:4000/api/schools | jq '.features | length'
curl http://localhost:4000/api/planning-blocks | jq '.features | length'
curl http://localhost:4000/api/options | jq 'length'

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it bcps-postgres psql -U bcps_user -d bcps_redistricting

# Run queries
SELECT name, src, ST_AsText(location) FROM schools;
SELECT COUNT(*) FROM planning_blocks;
SELECT * FROM redistricting_options;
```

## Project Structure

```text
src/                          # Frontend (React)
├── components/
│   ├── MainView.tsx          # Main map and data table component
│   └── MainView.css          # Component styles
├── hooks/
│   ├── useGeoData.ts         # Static GeoJSON loading
│   └── useGeoData.api.ts     # API-based data loading
├── services/
│   └── apiClient.ts          # Backend API client
├── types/
│   └── index.ts              # TypeScript interfaces
├── utils/
│   └── calculations.ts       # Distance and color utilities
├── App.tsx                   # Root component
└── main.tsx                  # Application entry point

backend/                      # Backend (Node.js + Express)
├── src/
│   ├── routes/               # API endpoints
│   │   ├── schools.ts        # School data endpoints
│   │   ├── planningBlocks.ts # Planning block endpoints
│   │   └── options.ts        # Redistricting options endpoints
│   ├── services/
│   │   ├── geoJsonService.ts # GeoJSON formatting
│   │   └── statsService.ts   # Statistics calculations
│   ├── db/
│   │   └── connection.ts     # PostgreSQL connection pool
│   └── index.ts              # Express app entry point
├── migrations/               # Flyway database migrations
│   ├── V1__enable_postgis.sql
│   ├── V2__create_tables.sql
│   └── V3__create_indexes.sql
├── scripts/
│   └── migrate-data.ts       # GeoJSON → PostgreSQL migration
├── docker-compose.yml        # Local development stack
└── Dockerfile                # API container image

terraform/                    # Infrastructure as Code
├── main.tf                   # Azure resources
├── variables.tf              # Configuration variables
└── outputs.tf                # Resource outputs

angular-app/public/assets/    # Legacy GeoJSON data files
├── schoolLocations.geo.json  # Elementary school locations
├── planningBlocks.geo.json   # Census block boundaries
└── [YYMMDD].geo.json        # Redistricting proposals by date
```

## Technology Stack

### Modern Stack (Current)

#### Frontend

- **Framework:** React 18 + TypeScript
- **Build:** Vite 7 with HMR
- **Mapping:** Mapbox GL JS (GPU-accelerated)
- **Styling:** Plain CSS
- **State:** React Hooks (useState, useEffect, useRef)
- **API Client:** Fetch with TypeScript interfaces

#### Backend

- **Runtime:** Node.js 18+
- **Framework:** Express 4
- **Database:** PostgreSQL 15 with PostGIS 3.4
- **ORM:** node-postgres (pg) connection pool
- **Migrations:** Flyway
- **Container:** Docker + Docker Compose

#### Infrastructure

- **IaC:** Terraform
- **Cloud:** Azure
- **Frontend Hosting:** Azure Static Web Apps
- **API Hosting:** Azure Container Apps
- **Database:** Azure PostgreSQL Flexible Server
- **Monitoring:** Azure Log Analytics

### Legacy Stack (Preserved)

- **Frontend:** AngularJS 1.4, UI-Router
- **Build:** Gulp 3.x
- **Mapping:** Leaflet with angular-leaflet-directive
- **Styling:** Bootstrap 3, SASS, Font Awesome
- **Testing:** Karma + Jasmine

## Migration History

- **February 2026:** Backend development - PostGIS database with REST API
  - PostgreSQL 15 + PostGIS 3.4 spatial database
  - Express REST API with TypeScript
  - Docker Compose for local development
  - Flyway migrations for schema management
  - GeoJSON import scripts

- **February 2026:** Complete migration to React 18 with TypeScript
  - Modernized build system (Gulp → Vite)
  - Updated mapping library (Leaflet → Mapbox GL)
  - Improved performance (90% faster builds, 60%+ smaller bundles)
  - Added TypeScript for type safety
  - Implemented modern React patterns (hooks, functional components)

- **2015:** Original AngularJS 1.4 implementation

See [MODERNIZATION_ROADMAP.md](./MODERNIZATION_ROADMAP.md) for detailed migration strategy.
See [VUE_TO_REACT_MIGRATION.md](./VUE_TO_REACT_MIGRATION.md) for React conversion notes.

# BCPS Redistricting API

REST API for the Baltimore County Public Schools redistricting tool with PostGIS spatial database support.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express + TypeScript
- **Database**: PostgreSQL 15 + PostGIS 3.4
- **Schema Management**: Flyway
- **Container**: Docker + Docker Compose

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ with PostGIS (if running locally without Docker)

## Quick Start with Docker

### 1. Start all services (Database + Flyway migrations + API)

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL 15 with PostGIS 3.4 on port 5432
- Run Flyway migrations to create schema
- Start the API server on port 4000

### 2. Check service health

```bash
curl http://localhost:4000/health
```

### 3. View logs

```bash
# All services
docker-compose logs -f

# Just the API
docker-compose logs -f api

# Just the database
docker-compose logs -f db
```

### 4. Stop services

```bash
docker-compose down
```

### 5. Stop and remove volumes (WARNING: deletes all data)

```bash
docker-compose down -v
```

## Local Development (without Docker)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up PostgreSQL with PostGIS

Install PostgreSQL and PostGIS locally, then create the database:

```sql
CREATE DATABASE bcps_redistricting;
CREATE USER bcps_user WITH PASSWORD 'bcps_password';
GRANT ALL PRIVILEGES ON DATABASE bcps_redistricting TO bcps_user;
```

### 3. Run Flyway migrations

Install Flyway CLI, then:

```bash
flyway -configFiles=flyway.conf migrate
```

Or use Docker just for Flyway:

```bash
docker run --rm \
  --network=host \
  -v $(pwd)/migrations:/flyway/sql \
  flyway/flyway:10 \
  -url=jdbc:postgresql://localhost:5432/bcps_redistricting \
  -user=bcps_user \
  -password=bcps_password \
  migrate
```

### 4. Configure environment

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

### 5. Start development server

```bash
npm run dev
```

The API will start on `http://localhost:4000` with hot reloading.

### 6. Build for production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server and database health status.

### API Info
```
GET /api
```

Returns API version and available endpoints.

### API Endpoints

#### Schools
- `GET /api/schools` - List all schools (GeoJSON FeatureCollection)
- `GET /api/schools/:id` - Get single school by ID

#### Planning Blocks
- `GET /api/planning-blocks` - List all planning blocks (GeoJSON FeatureCollection)
- `GET /api/planning-blocks/:id` - Get single planning block by ID

#### Redistricting Options
- `GET /api/options` - List all redistricting options metadata
- `GET /api/options/:id` - Get specific option with school assignments
- `GET /api/options/:id/stats` - Get utilization statistics for option
- `POST /api/options` - Create new redistricting option
- `PUT /api/options/:id` - Update existing option
- `DELETE /api/options/:id` - Delete option

## Database Schema

The database schema is managed by Flyway migrations in the `migrations/` directory:

- **V1__enable_postgis.sql** - Enable PostGIS extension
- **V2__create_tables.sql** - Create tables (schools, planning_blocks, redistricting_options, option_assignments)
- **V3__create_indexes.sql** - Create spatial and performance indexes

### Tables

- **schools** - Elementary schools with Point geometry (SRID 4326)
- **planning_blocks** - Geographic areas with Polygon geometry (SRID 4326)
- **redistricting_options** - Different redistricting scenarios metadata
- **option_assignments** - Assignment of planning blocks to schools per option

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://bcps_user:bcps_password@localhost:5432/bcps_redistricting

# API
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Docker Commands

### Rebuild API container after code changes
```bash
docker-compose up -d --build api
```

### Run Flyway migrations manually
```bash
docker-compose run --rm flyway migrate
```

### Access PostgreSQL shell
```bash
docker exec -it bcps-postgres psql -U bcps_user -d bcps_redistricting
```

### View PostGIS version
```sql
SELECT PostGIS_Version();
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── db/
│   │   └── connection.ts     # PostgreSQL connection pool
│   ├── middleware/
│   │   └── errorHandler.ts   # Error handling
│   ├── routes/               # API route handlers
│   │   ├── schools.ts        # School endpoints
│   │   ├── planningBlocks.ts # Planning block endpoints
│   │   └── options.ts        # Redistricting options endpoints
│   ├── services/             # Business logic
│   │   ├── geoJsonService.ts # GeoJSON formatting
│   │   └── statsService.ts   # Statistics calculations
│   └── scripts/              # Utility scripts
├── migrations/               # Flyway SQL migrations
│   ├── V1__enable_postgis.sql
│   ├── V2__create_tables.sql
│   └── V3__create_indexes.sql
├── scripts/
│   └── migrate-data.ts       # GeoJSON to PostgreSQL import
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## Troubleshooting

### Database connection refused
- Ensure PostgreSQL is running: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Verify DATABASE_URL in `.env`

### Flyway migrations failed
- Check Flyway logs: `docker-compose logs flyway`
- Ensure database is healthy before running migrations
- Verify migration files are mounted: `docker-compose config`

### API won't start
- Check if port 4000 is available: `lsof -i :4000`
- Verify all dependencies are installed: `npm install`
- Check API logs: `docker-compose logs api`

### PostGIS not available
- Ensure you're using the `postgis/postgis` image, not plain `postgres`
- Run `SELECT PostGIS_Version();` to verify installation

## Implementation Status

- ✅ **Phase 1**: Database schema and migrations
- ✅ **Phase 2**: Data migration from GeoJSON files
- ✅ **Phase 3**: API endpoint implementation
- ✅ **Phase 4**: Frontend integration (useGeoData.api.ts)
- ✅ **Phase 5**: Testing & validation
- 🔲 **Phase 6**: Production deployment to Azure

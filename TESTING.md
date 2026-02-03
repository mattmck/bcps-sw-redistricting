# Testing & Validation Checklist - Phase 5

## Overview

This document provides comprehensive testing procedures for the BCPS Redistricting Tool with PostGIS backend.

## Prerequisites

- Docker running with backend services
- Backend API running on `http://localhost:4000`
- Frontend dev server running on `http://localhost:3000`

## Phase 5.1: Manual Frontend Testing

### Map Loading

- [ ] Open `http://localhost:3000`
- [ ] Verify map loads without errors
- [ ] Verify 182 planning blocks are visible (gray polygons)
- [ ] Verify 11 schools are visible (colored circles)
- [ ] Verify initial planning blocks are colored by school

### School Selection

- [ ] Click on a school (colored circle on map)
- [ ] Verify school name appears in banner at top
- [ ] Verify school color appears in banner
- [ ] Verify instructions appear: "Click planning blocks..."
- [ ] Click different schools and verify banner updates

### Planning Block Reassignment

- [ ] Select a school (click school circle)
- [ ] Click a planning block (polygon)
- [ ] Verify block changes color to match selected school
- [ ] Verify table below updates with new student count
- [ ] Verify utilization percentages update
- [ ] Try reassigning multiple blocks to same school
- [ ] Try reassigning blocks to different schools

### Redistricting Options Loading

- [ ] Click "Load Current Districting" button
- [ ] Verify map colors update to show current districting
- [ ] Verify table shows student counts for current districting

#### 9/30/2015 Meeting Options

- [ ] Click "Option 1" - verify map and table update
- [ ] Click "Option 2" - verify map and table update
- [ ] Click "Option 3" - verify map and table update

#### 10/14/2015 Meeting Options

- [ ] Click "Option A" through "Option E"
- [ ] Verify each option loads different color patterns

#### 10/28/2015 Meeting Options

- [ ] Click "Option A" through "Option G"
- [ ] Verify each option loads correctly

#### 11/11/2015 Meeting Options

- [ ] Click "Option A" through "Option L"
- [ ] Verify all 12 options load correctly

#### 11/18/2015 Meeting Options

- [ ] Click "Option 1" through "Option 4"
- [ ] Verify each option loads correctly

### School Table

- [ ] Verify table shows all 11 schools
- [ ] Verify each school has color indicator
- [ ] Verify capacity columns show correct values
- [ ] Verify utilization percentages are calculated
- [ ] Verify over-capacity schools (>100%) are highlighted
- [ ] Verify student counts update when blocks are reassigned
- [ ] Click a row and verify it highlights

### Snapshot Feature

- [ ] Click "Take Snapshot" button
- [ ] Verify button shows "Taking Snapshot..." while processing
- [ ] Verify snapshot image appears below
- [ ] Click "Download Image" and verify PNG downloads
- [ ] Click "Clear Snapshot" and verify image is removed

## Phase 5.2: API Endpoint Testing

### Health Check

```bash
curl http://localhost:4000/health | jq
# Expected: { status: "healthy", database: "connected" }
```

- [ ] Status is "healthy"
- [ ] Database is "connected"
- [ ] Timestamp is recent
- [ ] Uptime is positive

### Schools API

```bash
# Get all schools
curl http://localhost:4000/api/schools | jq '. | {type, count: (.features | length)}'
# Expected: { type: "FeatureCollection", count: 11 }

# Get single school
curl http://localhost:4000/api/schools/1 | jq '.properties.NAME'
# Expected: School name
```

- [ ] Returns 11 schools
- [ ] Type is "FeatureCollection"
- [ ] Each feature has properties: NAME, SRC, SRC2016, SRC2017, X, Y
- [ ] Each feature has Point geometry with coordinates
- [ ] Single school endpoint returns 404 for invalid ID

### Planning Blocks API

```bash
# Get all planning blocks
curl http://localhost:4000/api/planning-blocks | jq '. | {type, count: (.features | length)}'
# Expected: { type: "FeatureCollection", count: 182 }

# Get single block
curl http://localhost:4000/api/planning-blocks/1 | jq '.properties.PBID'
# Expected: Block ID
```

- [ ] Returns 182 planning blocks
- [ ] Type is "FeatureCollection"
- [ ] Each feature has properties: PBID, K5LiveAtt
- [ ] Each feature has Polygon geometry
- [ ] Polygons have valid coordinate arrays

### Redistricting Options API

```bash
# Get all options
curl http://localhost:4000/api/options | jq '[.[] | {id, name, is_current}]'
# Expected: Array of 5 options

# Get option with assignments
curl http://localhost:4000/api/options/1 | jq '{id, name, schools: (.assignments | keys)}'
# Expected: Option with 11 school assignments

# Get option statistics
curl http://localhost:4000/api/options/1/stats | jq '{option: .option.name, schoolCount: (.schools | length)}'
# Expected: Statistics for all schools
```

- [ ] Returns 5 redistricting options
- [ ] First option (150930) has is_current: true
- [ ] Option details include assignments object
- [ ] Assignments have school names as keys, PBID arrays as values
- [ ] Stats endpoint returns utilization for all 11 schools
- [ ] Utilization percentages are calculated correctly

### Create New Option (Optional)

```bash
# Create new option
curl -X POST http://localhost:4000/api/options \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-option",
    "displayName": "Test Option",
    "assignments": {
      "Arbutus ES": ["1", "2", "3"],
      "Catonsville ES": ["4", "5", "6"]
    }
  }' | jq
# Expected: New option created with ID
```

- [ ] POST creates new option successfully
- [ ] Returns 201 status code
- [ ] New option appears in GET /api/options list
- [ ] Assignments are saved correctly

### Update Option (Optional)

```bash
# Update option
curl -X PUT http://localhost:4000/api/options/6 \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Test Option"
  }' | jq
# Expected: Updated option
```

- [ ] PUT updates option successfully
- [ ] Changes are reflected in GET endpoint

### Delete Option (Optional)

```bash
# Delete option
curl -X DELETE http://localhost:4000/api/options/6 | jq
# Expected: { message: "Redistricting option deleted" }
```

- [ ] DELETE removes option successfully
- [ ] Option no longer appears in list
- [ ] Assignments are cascade deleted

## Phase 5.3: Performance Testing

### API Response Times

```bash
# Test schools endpoint
time curl -s http://localhost:4000/api/schools > /dev/null
# Target: < 100ms

# Test planning blocks endpoint
time curl -s http://localhost:4000/api/planning-blocks > /dev/null
# Target: < 500ms

# Test options list
time curl -s http://localhost:4000/api/options > /dev/null
# Target: < 50ms

# Test option with assignments
time curl -s http://localhost:4000/api/options/1 > /dev/null
# Target: < 200ms

# Test statistics
time curl -s http://localhost:4000/api/options/1/stats > /dev/null
# Target: < 200ms
```

**Results:**

- [ ] Schools: _____ ms (target: < 100ms)
- [ ] Planning blocks: _____ ms (target: < 500ms)
- [ ] Options list: _____ ms (target: < 50ms)
- [ ] Option details: _____ ms (target: < 200ms)
- [ ] Statistics: _____ ms (target: < 200ms)

### Frontend Load Time

- [ ] Open DevTools Network tab
- [ ] Clear cache and hard reload
- [ ] Measure total load time: _____ seconds
- [ ] Verify no errors in console
- [ ] Check API calls complete successfully

## Phase 5.4: Data Integrity Validation

### School Count

```bash
# Database
docker exec bcps-postgres psql -U bcps_user -d bcps_redistricting -c "SELECT COUNT(*) FROM schools;"
# Expected: 11

# API
curl -s http://localhost:4000/api/schools | jq '.features | length'
# Expected: 11
```

- [ ] Database has 11 schools
- [ ] API returns 11 schools
- [ ] Counts match

### Planning Block Count

```bash
# Database
docker exec bcps-postgres psql -U bcps_user -d bcps_redistricting -c "SELECT COUNT(*) FROM planning_blocks;"
# Expected: 182

# API
curl -s http://localhost:4000/api/planning-blocks | jq '.features | length'
# Expected: 182
```

- [ ] Database has 182 planning blocks
- [ ] API returns 182 planning blocks
- [ ] Counts match

### Redistricting Options Count

```bash
# Database
docker exec bcps-postgres psql -U bcps_user -d bcps_redistricting -c "SELECT COUNT(*) FROM redistricting_options;"
# Expected: 5

# API
curl -s http://localhost:4000/api/options | jq '. | length'
# Expected: 5
```

- [ ] Database has 5 options
- [ ] API returns 5 options
- [ ] Counts match

### Option Assignments

```bash
# Database - count assignments for option 1
docker exec bcps-postgres psql -U bcps_user -d bcps_redistricting -c "
  SELECT COUNT(*) FROM option_assignments WHERE option_id = 1;
"
# Expected: 176

# API - count assignments for option 1
curl -s http://localhost:4000/api/options/1 | jq '.assignments | to_entries | map(.value | length) | add'
# Expected: 176
```

- [ ] Database assignment counts match API
- [ ] All schools have assignments
- [ ] No duplicate assignments

### Spot Check School Data

```bash
# Check Arbutus ES capacity
curl -s http://localhost:4000/api/schools | jq '.features[] | select(.properties.NAME == "Arbutus ES") | .properties | {SRC, SRC2016, SRC2017}'
# Expected: { SRC: 405, SRC2016: null, SRC2017: null }

# Check Catonsville ES capacity (should have override)
curl -s http://localhost:4000/api/schools | jq '.features[] | select(.properties.NAME == "Catonsville ES") | .properties | {SRC, SRC2016, SRC2017}'
# Expected: { SRC: 405, SRC2016: 715, SRC2017: null }
```

- [ ] Arbutus ES: 405 capacity
- [ ] Catonsville ES: 405/715/null (override applied)
- [ ] Relay ES: 415/null/689 (override applied)
- [ ] Westchester ES: 599/699/null (override applied)
- [ ] Westowne ES: 480/650/null (override applied)

## Test Summary

**Phase 5.1: Manual Frontend Testing**

- Total tests: _____ / _____
- Pass rate: _____%

**Phase 5.2: API Endpoint Testing**

- Total tests: _____ / _____
- Pass rate: _____%

**Phase 5.3: Performance Testing**

- All endpoints meet performance targets: [ ] Yes [ ] No
- Notes: _______________

**Phase 5.4: Data Integrity**

- All data counts match: [ ] Yes [ ] No
- Capacity overrides correct: [ ] Yes [ ] No

## Issues Found

1. _____________________
2. _____________________
3. _____________________

## Sign-off

- [ ] All critical tests passing
- [ ] Performance targets met
- [ ] Data integrity verified
- [ ] Ready for Phase 6 deployment

**Tested by:** _______________
**Date:** _______________
**Version:** _______________

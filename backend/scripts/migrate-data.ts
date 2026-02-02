import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Path to GeoJSON assets (relative to this script)
const ASSETS_PATH = path.join(__dirname, '../../angular-app/public/assets');

interface SchoolFeature {
  type: string;
  properties: {
    NAME: string;
    OBJECTID: string;
    TYPE: string;
    X: string;
    Y: string;
    SRC: string;
    SRC2016?: string;
    SRC2017?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

interface PlanningBlockFeature {
  type: string;
  properties: {
    PBID: string;
    OBJECTID: string;
    K5LiveAtt: string;
    [key: string]: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface GeoJSONFeatureCollection {
  type: string;
  features: any[];
}

// Name corrections from frontend logic
const correctSchoolName = (name: string): string => {
  if (name === 'Edmonson Heights ES') return 'Edmondson Heights ES';
  if (name === 'Old Catonsville ES') return 'Catonsville ES';
  return name;
};

// Capacity overrides from frontend logic
const getCapacityOverrides = (name: string) => {
  const overrides: { SRC2016?: number; SRC2017?: number } = {};
  
  switch (name) {
    case 'Catonsville ES':
      overrides.SRC2016 = 715;
      break;
    case 'Relay ES':
      overrides.SRC2017 = 689;
      break;
    case 'Westchester ES':
      overrides.SRC2016 = 699;
      break;
    case 'Westowne ES':
      overrides.SRC2016 = 650;
      break;
  }
  
  return overrides;
};

async function migrateSchools() {
  console.log('\n=== Migrating Schools ===');
  
  const filePath = path.join(ASSETS_PATH, 'schoolLocations.geo.json');
  const content = await fs.readFile(filePath, 'utf-8');
  const data: GeoJSONFeatureCollection = JSON.parse(content);
  
  console.log(`Loaded ${data.features.length} schools from GeoJSON`);
  
  // Filter to SW area elementary schools (matching frontend logic)
  const filteredSchools = data.features.filter((feature: SchoolFeature) => {
    return (
      feature.properties.TYPE === 'ES' &&
      parseFloat(feature.properties.Y) < 39.313 &&
      parseFloat(feature.properties.X) < -76.6565 &&
      feature.properties.NAME !== 'NewCatonsville ES'
    );
  });
  
  console.log(`Filtered to ${filteredSchools.length} SW area elementary schools`);
  
  let inserted = 0;
  
  for (const feature of filteredSchools) {
    const props = feature.properties;
    let name = correctSchoolName(props.NAME);
    const overrides = getCapacityOverrides(name);
    
    const [lon, lat] = feature.geometry.coordinates;
    
    const query = `
      INSERT INTO schools (name, type, object_id, location, src_2015, src_2016, src_2017)
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, $7, $8)
      ON CONFLICT (name) DO UPDATE SET
        type = EXCLUDED.type,
        object_id = EXCLUDED.object_id,
        location = EXCLUDED.location,
        src_2015 = EXCLUDED.src_2015,
        src_2016 = EXCLUDED.src_2016,
        src_2017 = EXCLUDED.src_2017
    `;
    
    const values = [
      name,
      props.TYPE,
      parseInt(props.OBJECTID),
      lon,
      lat,
      parseInt(props.SRC),
      overrides.SRC2016 || (props.SRC2016 ? parseInt(props.SRC2016) : null),
      overrides.SRC2017 || (props.SRC2017 ? parseInt(props.SRC2017) : null),
    ];
    
    await pool.query(query, values);
    inserted++;
    console.log(`  ✓ Inserted: ${name}`);
  }
  
  console.log(`\n✓ Migrated ${inserted} schools`);
}

async function migratePlanningBlocks() {
  console.log('\n=== Migrating Planning Blocks ===');
  
  const filePath = path.join(ASSETS_PATH, 'planningBlocks.geo.json');
  const content = await fs.readFile(filePath, 'utf-8');
  const data: GeoJSONFeatureCollection = JSON.parse(content);
  
  console.log(`Loaded ${data.features.length} planning blocks from GeoJSON`);
  
  let inserted = 0;
  
  for (const feature of data.features) {
    const props = feature.properties;
    const geometry = feature.geometry;
    
    // Convert coordinates to WKT format for PostGIS
    const coords = geometry.coordinates[0]
      .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
      .join(', ');
    
    const query = `
      INSERT INTO planning_blocks (pbid, object_id, k5_live_att, geometry)
      VALUES ($1, $2, $3, ST_GeomFromText($4, 4326)::geography)
      ON CONFLICT (pbid) DO UPDATE SET
        object_id = EXCLUDED.object_id,
        k5_live_att = EXCLUDED.k5_live_att,
        geometry = EXCLUDED.geometry
    `;
    
    const values = [
      props.PBID,
      parseInt(props.OBJECTID),
      parseInt(props.K5LiveAtt),
      `POLYGON((${coords}))`,
    ];
    
    await pool.query(query, values);
    inserted++;
    
    if (inserted % 20 === 0) {
      console.log(`  Processed ${inserted}/${data.features.length} blocks...`);
    }
  }
  
  console.log(`\n✓ Migrated ${inserted} planning blocks`);
}

async function migrateRedistrictingOptions() {
  console.log('\n=== Migrating Redistricting Options ===');
  
  // List of option files based on frontend code
  const optionFiles = [
    { file: '150930.geo.json', name: 'option1', displayName: 'Option 1 (9/30/15)', meetingDate: '2015-09-30', isCurrent: true },
    { file: '151014.geo.json', name: 'option2', displayName: 'Option 2 (10/14/15)', meetingDate: '2015-10-14', isCurrent: false },
    { file: '151014.geo.json', name: 'option3', displayName: 'Option 3 (10/14/15)', meetingDate: '2015-10-14', isCurrent: false },
  ];
  
  // Get all geo.json files from assets directory
  const files = await fs.readdir(ASSETS_PATH);
  const geoJsonFiles = files.filter(f => f.endsWith('.geo.json') && f.match(/^\d{6}\.geo\.json$/));
  
  console.log(`Found ${geoJsonFiles.length} redistricting option files`);
  
  for (const file of geoJsonFiles) {
    await migrateOption(file);
  }
}

async function migrateOption(filename: string) {
  const filePath = path.join(ASSETS_PATH, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  const data: GeoJSONFeatureCollection = JSON.parse(content);
  
  // Extract date from filename (YYMMDD format)
  const dateMatch = filename.match(/^(\d{2})(\d{2})(\d{2})\.geo\.json$/);
  if (!dateMatch) {
    console.log(`  Skipping ${filename} - invalid format`);
    return;
  }
  
  const [, year, month, day] = dateMatch;
  const meetingDate = `20${year}-${month}-${day}`;
  const displayName = `Meeting ${month}/${day}/${year}`;
  
  // Determine if this is the current option (first one chronologically)
  const isCurrent = filename === '150930.geo.json';
  
  // Create redistricting option
  const optionQuery = `
    INSERT INTO redistricting_options (name, display_name, meeting_date, is_current)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (name) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      meeting_date = EXCLUDED.meeting_date,
      is_current = EXCLUDED.is_current
    RETURNING id
  `;
  
  const optionResult = await pool.query(optionQuery, [
    filename.replace('.geo.json', ''),
    displayName,
    meetingDate,
    isCurrent,
  ]);
  
  const optionId = optionResult.rows[0].id;
  
  console.log(`\n  Processing: ${displayName} (${filename})`);
  
  // Extract assignments from planning block properties
  // Each feature has Opt1, Opt2, Opt3, OptA, OptB, etc. properties
  const assignments: { [schoolName: string]: string[] } = {};
  
  // Build map of PBID to school assignments for this option
  // The option files have different property names for assignments
  const optionKeys = Object.keys(data.features[0]?.properties || {}).filter(
    key => key.startsWith('Opt') && key !== 'Opt11617' && key !== 'Opt2201617' && key !== 'Opt3201617'
  );
  
  // For this migration, we'll use the "current" assignment (ES1516 property)
  // since the option files structure varies
  let assignmentCount = 0;
  
  for (const feature of data.features) {
    const props = feature.properties;
    const pbid = props.PBID;
    const schoolName = correctSchoolName(props.ES1516 || props.ES1415 || '');
    
    if (schoolName && pbid) {
      // Get school ID
      const schoolResult = await pool.query('SELECT id FROM schools WHERE name = $1', [schoolName]);
      
      if (schoolResult.rows.length === 0) {
        continue; // Skip if school not found
      }
      
      const schoolId = schoolResult.rows[0].id;
      
      // Get planning block ID
      const blockResult = await pool.query('SELECT id FROM planning_blocks WHERE pbid = $1', [pbid]);
      
      if (blockResult.rows.length === 0) {
        continue; // Skip if block not found
      }
      
      const planningBlockId = blockResult.rows[0].id;
      
      // Insert assignment
      const assignmentQuery = `
        INSERT INTO option_assignments (option_id, school_id, planning_block_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (option_id, planning_block_id) DO UPDATE SET
          school_id = EXCLUDED.school_id
      `;
      
      await pool.query(assignmentQuery, [optionId, schoolId, planningBlockId]);
      assignmentCount++;
    }
  }
  
  console.log(`  ✓ Created ${assignmentCount} assignments for ${displayName}`);
}

async function validateMigration() {
  console.log('\n=== Validating Migration ===\n');
  
  // Count schools
  const schoolCount = await pool.query('SELECT COUNT(*) as count FROM schools');
  console.log(`✓ Schools: ${schoolCount.rows[0].count}`);
  
  // Count planning blocks
  const blockCount = await pool.query('SELECT COUNT(*) as count FROM planning_blocks');
  console.log(`✓ Planning blocks: ${blockCount.rows[0].count}`);
  
  // Count redistricting options
  const optionCount = await pool.query('SELECT COUNT(*) as count FROM redistricting_options');
  console.log(`✓ Redistricting options: ${optionCount.rows[0].count}`);
  
  // Count assignments
  const assignmentCount = await pool.query('SELECT COUNT(*) as count FROM option_assignments');
  console.log(`✓ Option assignments: ${assignmentCount.rows[0].count}`);
  
  // Test spatial query
  console.log('\n--- Testing Spatial Queries ---');
  
  const spatialTest = await pool.query(`
    SELECT name, ST_AsText(location::geometry) as location
    FROM schools
    LIMIT 1
  `);
  
  if (spatialTest.rows.length > 0) {
    console.log(`✓ Spatial query successful: ${spatialTest.rows[0].name} at ${spatialTest.rows[0].location}`);
  }
  
  // List all schools
  console.log('\n--- Schools ---');
  const schools = await pool.query('SELECT name, src_2015, src_2016, src_2017 FROM schools ORDER BY name');
  for (const school of schools.rows) {
    console.log(`  • ${school.name} (${school.src_2015}/${school.src_2016}/${school.src_2017})`);
  }
}

async function main() {
  console.log('=====================================');
  console.log('BCPS Redistricting Data Migration');
  console.log('=====================================');
  
  try {
    await migrateSchools();
    await migratePlanningBlocks();
    await migrateRedistrictingOptions();
    await validateMigration();
    
    console.log('\n=====================================');
    console.log('✓ Migration completed successfully!');
    console.log('=====================================\n');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

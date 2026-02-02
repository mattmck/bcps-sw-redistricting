-- Schools table with point geometry
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(10) DEFAULT 'ES',
  object_id INTEGER,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  src_2015 INTEGER NOT NULL,
  src_2016 INTEGER,
  src_2017 INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Planning blocks table with polygon geometry
CREATE TABLE planning_blocks (
  id SERIAL PRIMARY KEY,
  pbid VARCHAR(50) UNIQUE NOT NULL,
  object_id INTEGER,
  k5_live_att INTEGER NOT NULL,
  geometry GEOGRAPHY(POLYGON, 4326) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Redistricting scenarios/options table
CREATE TABLE redistricting_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  meeting_date DATE,
  description TEXT,
  is_current BOOLEAN DEFAULT false,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignment of planning blocks to schools in each redistricting option
CREATE TABLE option_assignments (
  id SERIAL PRIMARY KEY,
  option_id INTEGER NOT NULL REFERENCES redistricting_options(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  planning_block_id INTEGER NOT NULL REFERENCES planning_blocks(id) ON DELETE CASCADE,
  UNIQUE(option_id, planning_block_id)
);

-- Walking radius data (optional enhancement for future use)
CREATE TABLE walking_radii (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  radius_meters INTEGER NOT NULL,
  geometry GEOGRAPHY(POLYGON, 4326) NOT NULL
);

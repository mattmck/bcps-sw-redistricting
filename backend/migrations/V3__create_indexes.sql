-- Spatial indexes using GIST for geographic queries
CREATE INDEX idx_schools_location ON schools USING GIST(location);
CREATE INDEX idx_planning_blocks_geometry ON planning_blocks USING GIST(geometry);
CREATE INDEX idx_walking_radii_geometry ON walking_radii USING GIST(geometry);

-- Performance indexes for foreign key joins and queries
CREATE INDEX idx_assignments_option ON option_assignments(option_id);
CREATE INDEX idx_assignments_school ON option_assignments(school_id);
CREATE INDEX idx_assignments_planning_block ON option_assignments(planning_block_id);
CREATE INDEX idx_walking_radii_school ON walking_radii(school_id);

-- Index for filtering current redistricting option
CREATE INDEX idx_redistricting_options_is_current ON redistricting_options(is_current) WHERE is_current = true;

-- Index for school name lookups
CREATE INDEX idx_schools_name ON schools(name);

-- Index for planning block ID lookups
CREATE INDEX idx_planning_blocks_pbid ON planning_blocks(pbid);

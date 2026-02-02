/**
 * GeoJSON Service
 * Utilities for formatting PostGIS data as GeoJSON FeatureCollections
 */

export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Format PostGIS ST_AsGeoJSON output as a GeoJSON Feature
 */
export function formatFeature(
  properties: Record<string, any>,
  geometryJson: string
): GeoJSONFeature {
  const geometry = JSON.parse(geometryJson);
  
  return {
    type: 'Feature',
    properties,
    geometry,
  };
}

/**
 * Format multiple features as a GeoJSON FeatureCollection
 */
export function formatFeatureCollection(
  features: GeoJSONFeature[]
): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Create a GeoJSON Feature from a school row
 */
export function formatSchoolFeature(row: any): GeoJSONFeature {
  return formatFeature(
    {
      NAME: row.name,
      TYPE: row.type,
      OBJECTID: row.object_id,
      SRC: row.src_2015,
      SRC2016: row.src_2016,
      SRC2017: row.src_2017,
      X: row.lon,
      Y: row.lat,
    },
    row.geometry
  );
}

/**
 * Create a GeoJSON Feature from a planning block row
 */
export function formatPlanningBlockFeature(row: any): GeoJSONFeature {
  return formatFeature(
    {
      PBID: row.pbid,
      OBJECTID: row.object_id,
      K5LiveAtt: row.k5_live_att,
    },
    row.geometry
  );
}

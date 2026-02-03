import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { formatSchoolFeature, formatFeatureCollection } from '../services/geoJsonService.js';

const router = Router();

/**
 * GET /api/schools
 * List all schools as GeoJSON FeatureCollection
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        type,
        object_id,
        src_2015,
        src_2016,
        src_2017,
        ST_X(location::geometry) as lon,
        ST_Y(location::geometry) as lat,
        ST_AsGeoJSON(location::geometry) as geometry
      FROM schools
      ORDER BY name
    `);

    const features = result.rows.map(formatSchoolFeature);
    const featureCollection = formatFeatureCollection(features);

    res.json(featureCollection);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

/**
 * GET /api/schools/:id
 * Get a single school by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `
      SELECT 
        id,
        name,
        type,
        object_id,
        src_2015,
        src_2016,
        src_2017,
        ST_X(location::geometry) as lon,
        ST_Y(location::geometry) as lat,
        ST_AsGeoJSON(location::geometry) as geometry
      FROM schools
      WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    const feature = formatSchoolFeature(result.rows[0]);
    return res.json(feature);
  } catch (error) {
    console.error('Error fetching school:', error);
    return res.status(500).json({ error: 'Failed to fetch school' });
  }
});

export default router;

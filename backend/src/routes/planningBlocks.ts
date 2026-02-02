import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { formatPlanningBlockFeature, formatFeatureCollection } from '../services/geoJsonService.js';

const router = Router();

/**
 * GET /api/planning-blocks
 * List all planning blocks as GeoJSON FeatureCollection
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id,
        pbid,
        object_id,
        k5_live_att,
        ST_AsGeoJSON(geometry::geometry) as geometry
      FROM planning_blocks
      ORDER BY pbid::integer
    `);

    const features = result.rows.map(formatPlanningBlockFeature);
    const featureCollection = formatFeatureCollection(features);

    res.json(featureCollection);
  } catch (error) {
    console.error('Error fetching planning blocks:', error);
    res.status(500).json({ error: 'Failed to fetch planning blocks' });
  }
});

/**
 * GET /api/planning-blocks/:id
 * Get a single planning block by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `
      SELECT 
        id,
        pbid,
        object_id,
        k5_live_att,
        ST_AsGeoJSON(geometry::geometry) as geometry
      FROM planning_blocks
      WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Planning block not found' });
    }

    const feature = formatPlanningBlockFeature(result.rows[0]);
    return res.json(feature);
  } catch (error) {
    console.error('Error fetching planning block:', error);
    return res.status(500).json({ error: 'Failed to fetch planning block' });
  }
});

export default router;

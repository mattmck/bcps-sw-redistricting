import { Router, Request, Response } from 'express';
import { query, getClient } from '../db/connection.js';
import { calculateOptionStats } from '../services/statsService.js';

const router = Router();

/**
 * GET /api/options
 * List all redistricting options with metadata
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        display_name,
        meeting_date,
        description,
        is_current,
        created_by,
        created_at,
        updated_at
      FROM redistricting_options
      ORDER BY meeting_date, name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching options:', error);
    res.status(500).json({ error: 'Failed to fetch redistricting options' });
  }
});

/**
 * GET /api/options/:id
 * Get a specific redistricting option with school assignments
 * Returns format: { [schoolName]: [pbid1, pbid2, ...] }
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get option metadata
    const optionResult = await query(
      `
      SELECT 
        id,
        name,
        display_name,
        meeting_date,
        description,
        is_current,
        created_by,
        created_at,
        updated_at
      FROM redistricting_options
      WHERE id = $1
    `,
      [id]
    );

    if (optionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Redistricting option not found' });
    }

    const option = optionResult.rows[0];

    // Get assignments for this option
    const assignmentsResult = await query(
      `
      SELECT 
        s.name as school_name,
        pb.pbid
      FROM option_assignments oa
      JOIN schools s ON oa.school_id = s.id
      JOIN planning_blocks pb ON oa.planning_block_id = pb.id
      WHERE oa.option_id = $1
      ORDER BY s.name, pb.pbid::integer
    `,
      [id]
    );

    // Group assignments by school name
    const assignments: { [schoolName: string]: string[] } = {};
    
    for (const row of assignmentsResult.rows) {
      if (!assignments[row.school_name]) {
        assignments[row.school_name] = [];
      }
      assignments[row.school_name].push(row.pbid);
    }

    return res.json({
      ...option,
      assignments,
    });
  } catch (error) {
    console.error('Error fetching option:', error);
    return res.status(500).json({ error: 'Failed to fetch redistricting option' });
  }
});

/**
 * POST /api/options
 * Create a new redistricting option
 * Body: { name, displayName, assignments: { [schoolName]: [pbid] } }
 */
router.post('/', async (req: Request, res: Response) => {
  const client = await getClient();
  
  try {
    const { name, displayName, description, assignments } = req.body;

    if (!name || !assignments) {
      return res.status(400).json({ error: 'Missing required fields: name, assignments' });
    }

    await client.query('BEGIN');

    // Create option
    const optionResult = await client.query(
      `
      INSERT INTO redistricting_options (name, display_name, description, is_current)
      VALUES ($1, $2, $3, false)
      RETURNING id, name, display_name, meeting_date, description, is_current, created_at
    `,
      [name, displayName || name, description || null]
    );

    const option = optionResult.rows[0];

    // Insert assignments
    let assignmentCount = 0;

    for (const [schoolName, pbids] of Object.entries(assignments) as [string, string[]][]) {
      // Get school ID
      const schoolResult = await client.query(
        'SELECT id FROM schools WHERE name = $1',
        [schoolName]
      );

      if (schoolResult.rows.length === 0) {
        throw new Error(`School not found: ${schoolName}`);
      }

      const schoolId = schoolResult.rows[0].id;

      // Insert assignments for each planning block
      for (const pbid of pbids) {
        const blockResult = await client.query(
          'SELECT id FROM planning_blocks WHERE pbid = $1',
          [pbid]
        );

        if (blockResult.rows.length === 0) {
          throw new Error(`Planning block not found: ${pbid}`);
        }

        const planningBlockId = blockResult.rows[0].id;

        await client.query(
          `
          INSERT INTO option_assignments (option_id, school_id, planning_block_id)
          VALUES ($1, $2, $3)
        `,
          [option.id, schoolId, planningBlockId]
        );

        assignmentCount++;
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      ...option,
      assignmentCount,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating option:', error);
    return res.status(500).json({ error: 'Failed to create redistricting option' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/options/:id
 * Update an existing redistricting option
 */
router.put('/:id', async (req: Request, res: Response) => {
  const client = await getClient();
  
  try {
    const { id } = req.params;
    const { displayName, description, assignments } = req.body;

    await client.query('BEGIN');

    // Update option metadata
    const optionResult = await client.query(
      `
      UPDATE redistricting_options
      SET 
        display_name = COALESCE($1, display_name),
        description = COALESCE($2, description),
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, display_name, meeting_date, description, is_current, updated_at
    `,
      [displayName, description, id]
    );

    if (optionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Redistricting option not found' });
    }

    const option = optionResult.rows[0];

    // If assignments provided, update them
    if (assignments) {
      // Delete existing assignments
      await client.query('DELETE FROM option_assignments WHERE option_id = $1', [id]);

      // Insert new assignments
      let assignmentCount = 0;

      for (const [schoolName, pbids] of Object.entries(assignments) as [string, string[]][]) {
        const schoolResult = await client.query(
          'SELECT id FROM schools WHERE name = $1',
          [schoolName]
        );

        if (schoolResult.rows.length === 0) {
          throw new Error(`School not found: ${schoolName}`);
        }

        const schoolId = schoolResult.rows[0].id;

        for (const pbid of pbids) {
          const blockResult = await client.query(
            'SELECT id FROM planning_blocks WHERE pbid = $1',
            [pbid]
          );

          if (blockResult.rows.length === 0) {
            throw new Error(`Planning block not found: ${pbid}`);
          }

          const planningBlockId = blockResult.rows[0].id;

          await client.query(
            `
            INSERT INTO option_assignments (option_id, school_id, planning_block_id)
            VALUES ($1, $2, $3)
          `,
            [id, schoolId, planningBlockId]
          );

          assignmentCount++;
        }
      }

      await client.query('COMMIT');

      return res.json({
        ...option,
        assignmentCount,
      });
    }

    await client.query('COMMIT');
    return res.json(option);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating option:', error);
    return res.status(500).json({ error: 'Failed to update redistricting option' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/options/:id/stats
 * Calculate utilization statistics for a redistricting option
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if option exists
    const optionResult = await query(
      'SELECT id, name, display_name FROM redistricting_options WHERE id = $1',
      [id]
    );

    if (optionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Redistricting option not found' });
    }

    const stats = await calculateOptionStats(parseInt(id));

    return res.json({
      option: optionResult.rows[0],
      schools: stats,
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    return res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

/**
 * DELETE /api/options/:id
 * Delete a redistricting option (cascade deletes assignments)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM redistricting_options WHERE id = $1 RETURNING name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Redistricting option not found' });
    }

    return res.json({ message: 'Redistricting option deleted', name: result.rows[0].name });
  } catch (error) {
    console.error('Error deleting option:', error);
    return res.status(500).json({ error: 'Failed to delete redistricting option' });
  }
});

export default router;

import { query } from '../db/connection.js';

export interface SchoolStats {
  name: string;
  students: number;
  capacity2015: number;
  capacity2016: number | null;
  capacity2017: number | null;
  utilization2015: number;
  utilization2016: number | null;
  utilization2017: number | null;
}

/**
 * Calculate school statistics for a redistricting option
 */
export async function calculateOptionStats(optionId: number): Promise<SchoolStats[]> {
  const result = await query(
    `
    SELECT 
      s.name,
      s.src_2015 as capacity_2015,
      s.src_2016 as capacity_2016,
      s.src_2017 as capacity_2017,
      COALESCE(SUM(pb.k5_live_att), 0) as total_students
    FROM schools s
    LEFT JOIN option_assignments oa ON s.id = oa.school_id AND oa.option_id = $1
    LEFT JOIN planning_blocks pb ON oa.planning_block_id = pb.id
    GROUP BY s.id, s.name, s.src_2015, s.src_2016, s.src_2017
    ORDER BY s.name
  `,
    [optionId]
  );

  return result.rows.map((row) => {
    const students = parseInt(row.total_students);
    const capacity2015 = row.capacity_2015;
    const capacity2016 = row.capacity_2016;
    const capacity2017 = row.capacity_2017;

    return {
      name: row.name,
      students,
      capacity2015,
      capacity2016,
      capacity2017,
      utilization2015: capacity2015 > 0 ? (students / capacity2015) * 100 : 0,
      utilization2016: capacity2016 ? (students / capacity2016) * 100 : null,
      utilization2017: capacity2017 ? (students / capacity2017) * 100 : null,
    };
  });
}

import type { PGlite } from "@electric-sql/pglite";

export interface EntranceLog {
  id: number;
  timestamp: string;
  duration: number;
  created_at: string;
}

export interface DailyStat {
  date: string;
  count: number;
  avgDuration: number | null;
  lastEvent: string;
}

export const createLogRepository = (db: PGlite) => ({
  getRecent: async (limit: number): Promise<EntranceLog[]> => {
    const result = await db.query(
      "SELECT * FROM entrance_logs ORDER BY timestamp DESC LIMIT $1",
      [limit]
    );
    return result.rows as EntranceLog[];
  },

  getDailyStats: async (days: number): Promise<DailyStat[]> => {
    const result = await db.query(
      `
        SELECT
          DATE(timestamp)::text as date,
          COUNT(*) as count,
          AVG(CAST(duration AS FLOAT)) as "avgDuration",
          MAX(timestamp)::text as "lastEvent"
        FROM entrance_logs
        WHERE timestamp >= NOW() - INTERVAL '1 day' * $1
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `,
      [days]
    );
    return result.rows as DailyStat[];
  },

  getLiveStats: async (): Promise<{
    todayCount: number;
    avgDuration: number | null;
    lastEvent: string | null;
  }> => {
    const result = await db.query(`
      SELECT
        COUNT(*) as "todayCount",
        AVG(CAST(duration AS FLOAT)) as "avgDuration",
        MAX(timestamp)::text as "lastEvent"
      FROM entrance_logs
      WHERE DATE(timestamp) = CURRENT_DATE
    `);

    const row = result.rows[0] as {
      todayCount: number;
      avgDuration: number | null;
      lastEvent: string | null;
    };

    return {
      todayCount: Number(row.todayCount) || 0,
      avgDuration: row.avgDuration
        ? Math.round(row.avgDuration * 10) / 10
        : null,
      lastEvent: row.lastEvent
    };
  },

  create: async (duration: number): Promise<EntranceLog> => {
    const result = await db.query(
      "INSERT INTO entrance_logs (duration) VALUES ($1) RETURNING *",
      [duration]
    );
    return result.rows[0] as EntranceLog;
  }
});

export type LogRepository = ReturnType<typeof createLogRepository>;

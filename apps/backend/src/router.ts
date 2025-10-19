import { z } from "zod";
import { getRepositories } from "./db";
import { publicProcedure, router } from "./trpc";

// 스키마 정의
const GetRecentLogsInput = z.object({ limit: z.number().default(10) });
const GetDailyStatsInput = z.object({ days: z.number().default(7) });

// 타입 추출
export type GetRecentLogsInput = z.infer<typeof GetRecentLogsInput>;
export type GetDailyStatsInput = z.infer<typeof GetDailyStatsInput>;

export const appRouter = router({
  // Logs procedures
  "logs.getRecent": publicProcedure
    .input(GetRecentLogsInput)
    .query(async ({ input }) => {
      const { logs } = await getRepositories();
      return logs.getRecent(input.limit);
    }),

  "logs.getDailyStats": publicProcedure
    .input(GetDailyStatsInput)
    .query(async ({ input }) => {
      const { logs } = await getRepositories();
      return logs.getDailyStats(input.days);
    }),

  "logs.getLiveStats": publicProcedure.query(async () => {
    const { logs } = await getRepositories();
    return logs.getLiveStats();
  }),

  // Health check
  health: publicProcedure.query(async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString()
    };
  })
});

export type AppRouter = typeof appRouter;

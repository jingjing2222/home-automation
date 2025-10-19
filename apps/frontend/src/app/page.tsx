"use client";

import { trpc } from "@/lib/trpc-react";

export default function Home() {
  // Queries
  const recentLogsQuery = trpc["logs.getRecent"].useQuery({ limit: 20 });
  const dailyStatsQuery = trpc["logs.getDailyStats"].useQuery({ days: 7 });
  const liveStatsQuery = trpc["logs.getLiveStats"].useQuery();
  const healthQuery = trpc.health.useQuery();

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">스마트 현관 IoT</h1>
          {healthQuery.data && (
            <div className="text-sm text-gray-400">
              {new Date(healthQuery.data.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Live Stats */}
        {liveStatsQuery.data && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-600 p-6 rounded-lg">
              <p className="text-sm text-blue-100">오늘 감지 횟수</p>
              <p className="text-4xl font-bold">
                {liveStatsQuery.data.todayCount}
              </p>
            </div>
            <div className="bg-green-600 p-6 rounded-lg">
              <p className="text-sm text-green-100">평균 지속 시간</p>
              <p className="text-4xl font-bold">
                {liveStatsQuery.data.avgDuration
                  ? `${liveStatsQuery.data.avgDuration}초`
                  : "N/A"}
              </p>
            </div>
            <div className="bg-purple-600 p-6 rounded-lg">
              <p className="text-sm text-purple-100">마지막 이벤트</p>
              <p className="text-sm">
                {liveStatsQuery.data.lastEvent
                  ? new Date(liveStatsQuery.data.lastEvent).toLocaleTimeString()
                  : "없음"}
              </p>
            </div>
          </div>
        )}

        {/* Recent Logs */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">최근 이벤트</h2>
          {recentLogsQuery.isLoading && (
            <p className="text-gray-400">로딩 중...</p>
          )}
          {recentLogsQuery.error && <p className="text-red-400">오류 발생</p>}
          {recentLogsQuery.data && recentLogsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {recentLogsQuery.data.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-3 bg-gray-700 rounded"
                >
                  <div>
                    <p className="font-semibold">🚨 동작 감지</p>
                    <p className="text-sm text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {log.duration && (
                      <p className="text-sm">{log.duration}초</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">이벤트가 없습니다</p>
          )}
        </div>

        {/* Daily Stats */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">일일 통계</h2>
          {dailyStatsQuery.isLoading && (
            <p className="text-gray-400">로딩 중...</p>
          )}
          {dailyStatsQuery.error && <p className="text-red-400">오류 발생</p>}
          {dailyStatsQuery.data && dailyStatsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {dailyStatsQuery.data.map((stat) => (
                <div
                  key={stat.date}
                  className="flex justify-between items-center p-3 bg-gray-700 rounded"
                >
                  <div>
                    <p className="font-semibold">{stat.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">감지: {stat.count}회</p>
                    {stat.avgDuration && (
                      <p className="text-sm text-gray-400">
                        평균: {stat.avgDuration.toFixed(1)}초
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">데이터가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}

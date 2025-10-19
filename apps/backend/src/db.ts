import { PGlite } from "@electric-sql/pglite";
import { createLogRepository } from "./repositories/logRepository";

let db: PGlite;

interface Repositories {
  logs: ReturnType<typeof createLogRepository>;
}

let repositories: Repositories | null = null;

export async function initDb(): Promise<PGlite> {
  if (db) return db;

  db = new PGlite();

  // 테이블 생성
  await db.exec(`
    CREATE TABLE IF NOT EXISTS entrance_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      duration INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_timestamp ON entrance_logs(timestamp);
  `);

  // 샘플 entrance_logs 데이터 삽입 (테스트용)
  const now = new Date();
  for (let i = 0; i < 10; i++) {
    const timestamp = new Date(now.getTime() - i * 3600000);
    await db.query(
      "INSERT INTO entrance_logs (timestamp, duration) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [timestamp.toISOString(), Math.floor(Math.random() * 120) + 10]
    );
  }

  // Repository 생성
  repositories = {
    logs: createLogRepository(db)
  };

  return db;
}

export async function getDb(): Promise<PGlite> {
  if (!db) {
    await initDb();
  }
  return db;
}

export async function getRepositories(): Promise<Repositories> {
  if (!repositories) {
    await initDb();
  }
  return repositories!;
}

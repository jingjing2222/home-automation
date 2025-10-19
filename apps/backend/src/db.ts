import { PGlite } from "@electric-sql/pglite";
import { createUserRepository } from "./repositories/userRepository";
import { createDeviceRepository } from "./repositories/deviceRepository";

let db: PGlite;

interface Repositories {
  users: ReturnType<typeof createUserRepository>;
  devices: ReturnType<typeof createDeviceRepository>;
}

let repositories: Repositories | null = null;

export async function initDb(): Promise<PGlite> {
  if (db) return db;

  db = new PGlite();

  // 테이블 생성
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS devices (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'off',
      location TEXT NOT NULL
    );
  `);

  // 초기 데이터 삽입
  await db.exec(`
    INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com') ON CONFLICT DO NOTHING;
    INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com') ON CONFLICT DO NOTHING;
    INSERT INTO devices (name, status, location) VALUES ('Smart Light', 'on', 'Living Room') ON CONFLICT DO NOTHING;
    INSERT INTO devices (name, status, location) VALUES ('Smart AC', 'off', 'Bedroom') ON CONFLICT DO NOTHING;
  `);

  // Repository 생성
  repositories = {
    users: createUserRepository(db),
    devices: createDeviceRepository(db)
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

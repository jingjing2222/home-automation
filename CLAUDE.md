# 스마트 현관 IoT 시스템 아키텍처

## 시스템 구성

```
┌─────────────────────────────────────────────────────────────┐
│                     라즈베리파이 3                           │
│                                                             │
│  [PIR 센서] ─GPIO→ [Python] ─GPIO→ [릴레이] → [전등]        │
│                      ↓ HTTP POST                           │
│  ┌────────────────────────────────────────┐                │
│  │  Hono Backend (localhost:4000)         │                │
│  │  - Node.js 런타임                       │                │
│  │  - REST API (센서용)                    │                │
│  │  - tRPC API (프론트용)                  │                │
│  └────────────────────────────────────────┘                │
│                      ↓ SQL                                 │
│  ┌────────────────────────────────────────┐                │
│  │  PGlite Database (/data/logs.db)       │                │
│  └────────────────────────────────────────┘                │
│                      ↑ tRPC                                │
│  ┌────────────────────────────────────────┐                │
│  │  Coolify                               │                │
│  │  └─ Next.js (port 3000)                │                │
│  │     - Git push → 자동 배포              │                │
│  │     - SSL (Let's Encrypt)              │                │
│  └────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
         ↕ DDNS (myhome.duckdns.org) + 포트포워딩
    [외부 브라우저 접속]
```

---

## 기술 스택

### 모노레포

- pnpm
- Turborepo
- Docker + Docker Compose

### Backend (로컬 전용)

- Node.js
- Hono
- tRPC
- Zod
- PGlite
- TypeScript
- tsdown/rolldown/Vite (번들러)

### Frontend (Coolify 배포)

- Next.js
- React
- tRPC Client
- TanStack Query
- Tailwind CSS
- Recharts
- TypeScript

### Sensor (로컬 전용)

- Python
- RPi.GPIO
- requests

### 배포

- Coolify (Next.js만)
- Docker (Backend + Sensor)
- GitHub Actions (CI/CD)
- DDNS + 포트포워딩

### 개발 도구

- oxlint
- oxc_formatter

---

## 프로젝트 구조

```
smart-entrance/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── db/
│   │   │   │   └── pglite.ts
│   │   │   ├── trpc/
│   │   │   │   ├── router.ts
│   │   │   │   ├── context.ts
│   │   │   │   └── procedures/
│   │   │   │       ├── logs.ts
│   │   │   │       └── stats.ts
│   │   │   ├── routes/
│   │   │   │   └── sensor.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── frontend/
│       ├── app/
│       │   ├── page.tsx
│       │   ├── layout.tsx
│       │   └── components/
│       ├── lib/
│       │   └── trpc.ts
│       ├── package.json
│       └── next.config.js
│── sensor/
│       ├── sensor_controller.py
│       ├── requirements.txt
│       └── Dockerfile
├── data/
├── turbo.json
├── pnpm-workspace.yaml
├── docker-compose.yml
└── package.json
```

---

## 통신 흐름

### 센서 감지

```
PIR 센서
  → Python (GPIO, 릴레이 제어)
  → POST localhost:4000/sensor
  → Hono Backend
  → PGlite DB
```

### 대시보드 조회

```
브라우저 (https://myhome.duckdns.org)
  → Coolify (SSL)
  → Next.js
  → tRPC (localhost:4000)
  → Hono Backend
  → PGlite DB
```

---

## 데이터베이스

### entrance_logs 테이블

```sql
CREATE TABLE entrance_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_timestamp ON entrance_logs(timestamp);
CREATE INDEX idx_event_type ON entrance_logs(event_type);
```

---

## API

### REST (센서 → 백엔드)

```
POST /sensor
Body: { event_type: string, duration?: number }
```

### tRPC (프론트 ↔ 백엔드)

```typescript
logs.getRecent(limit: number) → EntranceLog[]
logs.getDailyStats(days: number) → DailyStat[]
logs.getLiveStats() → { todayCount, avgDuration, lastEvent }
health() → { status, timestamp }
```

---

## 배포

### docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    build: ./packages/backend
    ports:
      - "4000:4000"
    volumes:
      - ./data:/app/data
    restart: always

  sensor:
    build: ./packages/sensor
    privileged: true
    devices:
      - /dev/gpiomem:/dev/gpiomem
    network_mode: "host"
    restart: always
    depends_on:
      - backend
```

### Coolify 설정

- Repository: GitHub 레포
- Root Directory: `/packages/frontend`
- Build: `pnpm install && pnpm build`
- Start: `pnpm start`
- Port: `3000`
- Domain: `myhome.duckdns.org`

---

## 네트워크

### 내부

```
Sensor → localhost:4000 (Backend)
Next.js → localhost:4000 (Backend)
```

### 외부

```
인터넷
  → myhome.duckdns.org (DDNS)
  → 포트포워딩 (443 → 3000)
  → Coolify (SSL)
  → Next.js
```

---

## 개발

```bash
# 전체 실행
turbo dev

# Backend
cd packages/backend
pnpm dev

# Frontend
cd packages/frontend
pnpm dev

# Sensor
cd packages/sensor
python sensor_controller.py
```

---

## 배포 파이프라인

### Backend + Sensor

```
git push → GitHub Actions → Docker Hub → docker-compose pull → restart
```

### Frontend

```
git push → Coolify webhook → 자동 빌드/배포
```

---

## 보안

- Backend/DB: 로컬 전용
- Next.js: HTTPS (Coolify SSL)
- 포트포워딩: 443, 80만

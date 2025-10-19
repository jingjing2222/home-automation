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

- biome

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
  duration INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_timestamp ON entrance_logs(timestamp);
```

**컬럼 설명:**
- `id`: 고유 ID
- `timestamp`: 동작 감지 시작 시간
- `duration`: 감지 지속 시간 (초)
- `created_at`: 레코드 생성 시간

---

## API

### REST (센서 → 백엔드)

```
POST /sensor
Body: { duration: number }
Response: { success: boolean, log: EntranceLog }
```

### tRPC (프론트 ↔ 백엔드)

```typescript
logs.getRecent(limit: number) → EntranceLog[]
logs.getDailyStats(days: number) → DailyStat[]
logs.getLiveStats() → { todayCount, avgDuration, lastEvent }
health() → { status, timestamp }
```

**EntranceLog:**
```typescript
{
  id: number
  timestamp: string (ISO 8601)
  duration: number (seconds)
  created_at: string
}
```

**DailyStat:**
```typescript
{
  date: string (YYYY-MM-DD)
  count: number
  avgDuration: number | null
  lastEvent: string (ISO 8601)
}
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

---

## 센서 컨트롤러

### sensor_controller.py

센서 컨트롤러는 라즈베리파이에서 PIR 센서를 모니터링하고 백엔드에 이벤트를 전송합니다.

**주요 기능:**
- PIR 센서 모니터링 (GPIO 17)
- 릴레이 제어 (GPIO 27)
- 백엔드 통신 (POST /sensor)
- 자동 전등 타임아웃 제어
- 로그 기록 (/app/logs/sensor.log)

**환경 변수:**
```
BACKEND_URL=http://backend:4000      # 백엔드 URL
PIR_PIN=17                            # PIR 센서 GPIO 핀
RELAY_PIN=27                          # 릴레이 GPIO 핀
DEBOUNCE_TIME=0.1                     # 디바운스 시간 (초)
MIN_DETECTION_TIME=0.5                # 최소 감지 시간 (초)
LIGHT_ON_DURATION=30                  # 전등 자동 OFF 시간 (초)
POLLING_INTERVAL=0.1                  # 센서 폴링 간격 (초)
```

**동작 흐름:**
```
1. PIR 센서에서 동작 감지
2. 감지 시간 계산
3. 최소 감지 시간 초과 확인
4. 릴레이로 전등 ON
5. 백엔드에 이벤트 전송 (duration)
6. 타임아웃 후 자동으로 전등 OFF
7. 로그 기록
```

---

## 자동 배포 (watchTower)

### watchTower 설정

watchTower는 Docker 이미지의 변경을 감시하고 자동으로 컨테이너를 업데이트합니다.

**watchTower 기능:**
- Docker Hub에서 새 이미지 자동 감지
- 실행 중인 컨테이너 자동 재배포
- 이전 이미지 자동 정리
- 라벨 기반 선택적 업데이트

**활성화 방법:**

Docker Compose에서 컨테이너에 라벨 추가:
```yaml
labels:
  - "com.centurylinklabs.watchtower.enable=true"
```

**watchTower 설정 변수:**
```
WATCHTOWER_CLEANUP=true               # 이전 이미지 정리
WATCHTOWER_POLL_INTERVAL=86400        # 24시간마다 체크
WATCHTOWER_INCLUDE_STOPPED=false      # 중지된 컨테이너 무시
WATCHTOWER_INCLUDE_RESTARTING=false   # 재시작 중인 컨테이너 무시
WATCHTOWER_DEBUG=false                # 디버그 모드
```

**배포 파이프라인:**
```
1. Git push to GitHub
2. GitHub Actions 실행 → Docker Hub에 이미지 푸시
3. watchTower가 변경 감지 (24시간마다 또는 수동 트리거)
4. 새 이미지 다운로드
5. 기존 컨테이너 중지
6. 새 이미지로 컨테이너 실행
7. 이전 이미지 정리
```

### Docker Compose 실행

**전체 시스템 시작:**
```bash
docker-compose up -d
```

**상태 확인:**
```bash
docker-compose ps
docker-compose logs -f backend
docker-compose logs -f sensor
docker-compose logs -f watchtower
```

**컨테이너 확인:**
```bash
# 모든 컨테이너 목록
docker ps

# watchTower 로그 확인
docker logs -f smart-entrance-watchtower

# 센서 로그 확인
docker logs -f smart-entrance-sensor

# 백엔드 로그 확인
docker logs -f smart-entrance-backend
```

**컨테이너 중지:**
```bash
docker-compose down
```

### GitHub Actions CI/CD 설정

watchTower와 연동하려면 GitHub Actions에서 Docker 이미지를 빌드하고 Docker Hub에 푸시해야 합니다.

**.github/workflows/deploy.yml 예시:**
```yaml
name: Build and Push to Docker Hub

on:
  push:
    branches: [ main, feat/* ]

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ secrets.DOCKER_USERNAME }}/smart-entrance

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        service: [backend, sensor]

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push ${{ matrix.service }}
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./apps/${{ matrix.service }}/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}:latest
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}:buildcache,mode=max
```

**GitHub Secrets 설정:**
```
DOCKER_USERNAME    # Docker Hub 사용자명
DOCKER_PASSWORD    # Docker Hub 액세스 토큰
```

---

## Frontend 배포 (Docker Hub + watchTower)

### 배포 흐름

```
Git push
  ↓
GitHub Actions (.github/workflows/build-and-push.yml)
  ↓
Docker build (apps/frontend/Dockerfile)
  ↓
Docker Hub push → user/smart-entrance-frontend:latest
  ↓
watchTower 감시 (라즈베리파이의 docker-compose)
  ↓
자동 이미지 pull → 컨테이너 재시작
  ↓
포트 3001에서 실행
```

### docker-compose.yml에 Frontend 추가

```yaml
frontend:
  image: ${DOCKER_USERNAME}/smart-entrance-frontend:latest
  container_name: smart-entrance-frontend
  ports:
    - "3001:3000"
  environment:
    - NEXT_PUBLIC_BACKEND_URL=http://backend:8080
  restart: unless-stopped
  networks:
    - smart-entrance
  depends_on:
    - backend
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 10s
  labels:
    - "com.centurylinklabs.watchtower.enable=true"
```

**주의:**
- `${DOCKER_USERNAME}` 환경 변수 설정 필요
- 내부 포트: 3000 (Next.js)
- 외부 포트: 3001

### .env 파일 설정 (라즈베리파이)

docker-compose 실행 시 환경 변수 설정:

```bash
# .env
DOCKER_USERNAME=your-docker-username
```

또는 명령어로:
```bash
export DOCKER_USERNAME=your-docker-username
docker-compose up -d
```

### GitHub Actions 설정

**필수 Secrets 추가:**
1. `DOCKER_USERNAME` - Docker Hub 사용자명
2. `DOCKER_PASSWORD` - Docker Hub 액세스 토큰

**Workflow 파일:**
`.github/workflows/build-and-push.yml`

Backend, Sensor, Frontend 모두 빌드해서 Docker Hub에 push합니다.

```
services:
  - backend
  - sensor
  - frontend
```

각 서비스별 이미지:
- `docker.io/{username}/smart-entrance-backend:latest`
- `docker.io/{username}/smart-entrance-sensor:latest`
- `docker.io/{username}/smart-entrance-frontend:latest`

### 로컬 개발 (라즈베리파이에서)

**전체 시스템 시작:**
```bash
# 환경 변수 설정
export DOCKER_USERNAME=your-docker-username

# 시스템 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f sensor
docker-compose logs -f watchtower
```

**Frontend 접속:**
```
http://localhost:3001
```

**Backend API:**
```
http://localhost:8080
```

**watchTower 자동 업데이트:**
- 24시간마다 Docker Hub 확인
- 새 이미지 발견 시 자동 pull & 재배포
- 이전 이미지 자동 정리

### Coolify 추가 설정 (선택사항 - 외부 공개용)

현재는 docker-compose로 관리되므로, 만약 Coolify를 통해 **외부(myhome.duckdns.org)로 배포**하고 싶다면:

1. Coolify에서 "Docker Hub Image" 타입 프로젝트 생성
2. 이미지: `{username}/smart-entrance-frontend:latest`
3. Coolify가 자동으로 감시 → 배포
4. SSL/TLS (Let's Encrypt) 자동 설정

현재 로컬 docker-compose 방식이 더 간단하고 효율적입니다.

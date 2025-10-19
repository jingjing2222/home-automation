# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 매니저 설치
RUN npm install -g pnpm

# 루트 패키지 파일 복사
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./

# 백엔드 패키지 파일 복사
COPY apps/backend ./apps/backend

# 의존성 설치 및 빌드
RUN pnpm install
WORKDIR /app/apps/backend
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# 패키지 매니저 설치
RUN npm install -g pnpm

# 루트 package.json만 복사
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./

# 백엔드 package.json만 복사
COPY apps/backend/package.json ./apps/backend/

# Production 의존성만 설치
RUN pnpm install --prod

# Stage 1에서 빌드한 dist 복사
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# 로그 디렉토리 생성
RUN mkdir -p /app/logs

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# 런타임에서 dist만 실행 (dev dependencies 없음)
CMD ["node", "apps/backend/dist/index.js"]

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 매니저 설치
RUN npm install -g pnpm

# 루트 패키지 파일 복사
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./

# 백엔드 패키지 파일 복사
COPY apps/backend ./apps/backend

# 의존성 설치 및 번들링
RUN pnpm install
WORKDIR /app/apps/backend
RUN pnpm build

# Stage 2: Runtime (모든 의존성이 번들링되어 있음)
FROM node:20-alpine

WORKDIR /app

# 로그 디렉토리 생성
RUN mkdir -p /app/logs

# Stage 1에서 빌드한 번들 복사
COPY --from=builder /app/apps/backend/dist ./dist

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# 번들된 단일 파일 실행 (Node.js만 필요, npm/pnpm 불필요)
CMD ["node", "dist/index.js"]

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 매니저 설치
RUN npm install -g pnpm

# 루트 패키지 파일 복사
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./

# 프론트엔드 패키지 파일 복사
COPY apps/frontend ./apps/frontend

# 의존성 설치 및 빌드
RUN pnpm install
WORKDIR /app/apps/frontend
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# 패키지 매니저 설치
RUN npm install -g pnpm

# 루트 package.json만 복사
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./

# 프론트엔드 package.json만 복사
COPY apps/frontend/package.json ./apps/frontend/

# Production 의존성만 설치
RUN pnpm install --prod

# Stage 1에서 빌드한 .next, public 복사
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/next.config.js ./apps/frontend/

WORKDIR /app/apps/frontend

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Next.js 시작 (production mode)
EXPOSE 3000
CMD ["pnpm", "start"]

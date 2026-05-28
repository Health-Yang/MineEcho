# MineEcho：BFF + Console 一体镜像
# 多阶段构建：先构建 BFF 与 Console，再只保留运行时
# 使用国内镜像源，若仍失败可在 Docker Desktop 配置 registry-mirrors 后改回 node:22-alpine
ARG NODE_IMAGE=docker.xuanyuan.me/library/node:22-alpine
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY bff/package.json ./bff/
COPY console/package.json ./console/
RUN npm ci

COPY bff ./bff
COPY console ./console
RUN npm run build

# 运行阶段：仅 BFF 运行时 + Console 静态产物
ARG NODE_IMAGE=docker.xuanyuan.me/library/node:22-alpine
FROM ${NODE_IMAGE}

WORKDIR /app

COPY bff/package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/bff/dist ./dist
COPY --from=builder /app/console/dist ./console-dist

ENV NODE_ENV=production
ENV BFF_PORT=3085
ENV CONSOLE_DIST=/app/console-dist

EXPOSE 3085

CMD ["node", "dist/index.js"]

# 单容器：OpenClaw Gateway + MineEcho BFF+Console，BFF 连 127.0.0.1，避免跨容器 DNS
# openclaw 需 Node 22+。若默认镜像拉取失败，可建 .env 写 NODE_IMAGE=docker.1ms.run/library/node:22-alpine 或 NODE_IMAGE=node:22-alpine（需能访问 Docker Hub）
# 默认使用 DaoCloud 镜像代理（国内可用），也可通过 --build-arg 覆盖
ARG NODE_IMAGE=m.daocloud.io/docker.io/library/node:22-alpine
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY bff/package.json ./bff/
COPY console/package.json ./console/
RUN npm ci
COPY bff ./bff
COPY console ./console
RUN npm run build

FROM ${NODE_IMAGE}
# openclaw 或其依赖在 npm install 时可能调用 git，Alpine 需安装 git
# 安装 Python3 用于执行技能脚本（如 hci-solution-generator）
RUN apk add --no-cache git python3 py3-pip
# 安装 Python 技能脚本依赖
RUN pip3 install --break-system-packages python-docx openpyxl || pip3 install python-docx openpyxl
WORKDIR /app
# 本地安装 openclaw 到固定路径，避免全局安装后入口文件路径不可靠
RUN mkdir -p /app/gateway && echo '{"name":"gateway","dependencies":{"openclaw":"latest"}}' > /app/gateway/package.json && cd /app/gateway && npm install --omit=dev
COPY bff/package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/bff/dist ./dist
COPY --from=builder /app/console/dist ./console-dist
COPY docker/mineecho-with-gateway/entrypoint.sh /app/entrypoint.sh
COPY docker/mineecho-with-gateway/wait-for-port.js /app/wait-for-port.js
COPY docker/mineecho-with-gateway/inject-minimax-key.cjs /app/inject-minimax-key.cjs
RUN chmod +x /app/entrypoint.sh

# 复制内置技能到镜像（运行时通过 entrypoint.sh 复制到 volume）
COPY docker/mineecho-with-gateway/skills /app/builtin-skills/

ENV NODE_ENV=production
ENV BFF_PORT=3085
ENV CONSOLE_DIST=/app/console-dist
ENV OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
ENV OPENCLAW_HOME=/app/.openclaw
ENV OPENCLAW_GATEWAY_PORT=18789

EXPOSE 3085
ENTRYPOINT ["/app/entrypoint.sh"]

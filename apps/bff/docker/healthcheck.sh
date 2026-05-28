#!/bin/sh
# MineEcho 健康检查脚本
# 检查 Gateway 和 BFF 是否正常运行

set -e

BFF_PORT="${BFF_PORT:-3085}"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
TIMEOUT=5

# 检查 BFF HTTP 端口
if ! curl -sf "http://127.0.0.1:${BFF_PORT}/api/health" > /dev/null 2>&1; then
    echo "BFF health check failed"
    exit 1
fi

# 检查 Gateway WebSocket 端口（使用 nc 或直接检查进程）
if ! nc -z 127.0.0.1 "$GATEWAY_PORT" > /dev/null 2>&1; then
    # 如果没有 nc，检查进程
    if ! pgrep -f "openclaw.*gateway" > /dev/null 2>&1; then
        echo "Gateway process not found"
        exit 1
    fi
fi

echo "Health check passed"
exit 0

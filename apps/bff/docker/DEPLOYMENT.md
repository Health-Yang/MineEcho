# MineEcho 容器化部署指南

## 部署模式

Docker Compose 支持三种部署模式：

| 模式 | 命令 | 适用场景 |
|------|------|----------|
| **单容器（默认）** | `docker compose up -d` | 快速开始、单机部署 |
| **开发模式** | `docker compose --profile dev up -d` | 开发调试、热重载 |
| **分布式** | `docker compose --profile distributed up -d` | 生产环境、高可用 |

## 快速开始

```bash
# 1. 进入部署目录
cd apps/bff

# 2. 启动（默认模式）
docker compose -f docker-compose.v2.yml up -d

# 3. 查看日志
docker compose -f docker-compose.v2.yml logs -f

# 4. 访问
open http://localhost:3085
```

## 环境变量配置

创建 `.env` 文件：

```bash
# 基础配置
MINECHO_PORT=3085
MINECHO_WORKSPACE_ROOT=./workspace

# Gateway 配置
OPENCLAW_GATEWAY_TOKEN=your-secure-token

# 模型配置（可选，也可在 Web 界面配置）
MINIMAX_API_KEY=your-minimax-api-key

# L1/L2 连接（可选）
L1_URL=http://host.docker.internal:3081
L2_URL=http://host.docker.internal:3082

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json

# 镜像配置（国内用户）
NODE_IMAGE=m.daocloud.io/docker.io/library/node:22-alpine
```

## 部署特性

### 1. 健康检查

```bash
# 查看健康状态
docker compose -f docker-compose.v2.yml ps

# 手动健康检查
docker compose -f docker-compose.v2.yml exec mineecho /app/healthcheck.sh
```

### 2. 资源限制

默认配置：
- CPU 限制：2.0 核
- 内存限制：2GB
- 保留 CPU：0.5 核
- 保留内存：512MB

### 3. 日志轮转

自动配置：
- 单个日志文件最大 100MB
- 保留 3 个历史文件
- JSON 格式输出

```bash
# 查看日志
docker compose -f docker-compose.v2.yml logs -f --tail 100

# 清理日志
docker compose -f docker-compose.v2.yml exec mineecho sh -c "truncate -s 0 /var/log/*.log"
```

### 4. 多环境支持

```bash
# 生产环境
docker compose -f docker-compose.v2.yml --profile production up -d

# 开发环境（热重载）
docker compose -f docker-compose.v2.yml --profile dev up -d

# 分布式部署
docker compose -f docker-compose.v2.yml --profile distributed up -d
```

## 数据持久化

| 卷名 | 路径 | 说明 |
|------|------|------|
| `openclaw-config` | `/app/.openclaw` | Gateway 配置 |
| `mineecho-data` | `/app/.mineecho` | MineEcho 数据 |
| `./workspace` | `/app/workspace` | 用户工作区 |
| `./skills` | `/app/custom-skills` | 自定义技能 |

备份恢复：

```bash
# 备份
docker run --rm -v mineecho_openclaw-config:/data -v $(pwd):/backup alpine tar czf /backup/config-backup.tar.gz -C /data .

# 恢复
docker run --rm -v mineecho_openclaw-config:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/config-backup.tar.gz"
```

## 故障排查

### 查看详细日志

```bash
# Gateway 日志
docker compose -f docker-compose.v2.yml exec mineecho cat /app/.openclaw/logs/gateway.log

# BFF 日志
docker compose -f docker-compose.v2.yml logs bff
```

### 重置配置

```bash
# 停止并删除卷
docker compose -f docker-compose.v2.yml down -v

# 重新启动（全新初始化）
docker compose -f docker-compose.v2.yml up -d
```

### 检查连接

```bash
# 进入容器
docker compose -f docker-compose.v2.yml exec mineecho sh

# 检查 Gateway 状态
node /app/gateway/node_modules/openclaw/openclaw.mjs status

# 检查端口
netstat -tlnp
```

## 相比早期 Compose 配置的改进

| 特性 | 早期配置 | 当前配置 |
|------|----|----|
| 健康检查 | 无 | 内置 |
| 资源限制 | 无 | 默认配置 |
| 日志轮转 | 手动 | 自动 |
| 部署模式 | 单一 | 多 profile |
| 环境变量 | 分散 | 集中管理 |
| 配置热重载 | 不支持 | 计划支持 |

# 环境变量说明

MineEcho 默认本地优先。大多数用户只需要复制 `apps/bff/.env.example` 到 `apps/bff/.env`，Console 通常不需要额外配置。

## 核心运行时

| 变量 | 默认值 | 范围 | 用途 |
| --- | --- | --- | --- |
| `BFF_PORT` | `3085` | BFF、Electron | BFF HTTP 端口。如果修改，需要同步修改 Console Vite 代理。 |
| `MINEECHO_CONFIG_HOME` | 本地 BFF 开发时为 `apps/bff/.mineecho` | BFF | 主运行态目录，保存凭据、AI 应用、聊天历史、指标和本地状态。 |
| `MINECHO_CONFIG_HOME` | 未设置 | BFF | 历史兼容别名。`MINEECHO_CONFIG_HOME` 优先。 |
| `MINEECHO_CORS_ORIGINS` | 本地开发地址 | BFF | 逗号分隔的 CORS 白名单。 |
| `MINECHO_REQUIRE_AUTH` | `false` | BFF | 设置为 `true` 后，受保护接口需要认证。 |
| `VITE_MINEECHO_AUTH_REQUIRED` | `false` | Console | 本地开发是否强制进入登录流程。 |
| `MINEECHO_HOST` | `http://127.0.0.1:3085` | `mineecho-skill` CLI | 技能 CLI 默认服务地址。 |
| `SCLAW_HOST` | 未设置 | `mineecho-skill` CLI | 旧版兼容变量，优先级低于 `MINEECHO_HOST`。 |

## Gateway 兼容层

| 变量 | 默认值 | 范围 | 用途 |
| --- | --- | --- | --- |
| `OPENCLAW_GATEWAY_URL` | `ws://127.0.0.1:18789` | BFF | Gateway 兼容层 WebSocket 地址。 |
| `OPENCLAW_GATEWAY_HTTP_URL` | `http://127.0.0.1:18789` | BFF | Gateway HTTP 调用地址。 |
| `OPENCLAW_GATEWAY_PORT` | `18789` | BFF、Docker | 本地 Gateway 端口。 |
| `OPENCLAW_GATEWAY_TOKEN` | 未设置 | BFF、Docker | 可选 Gateway token。 |
| `OPENCLAW_HOME` | 本地 OpenClaw 兼容运行态路径 | BFF | 包含 `.openclaw/` 的父目录。 |
| `OPENCLAW_CONFIG_PATH` | 自动检测 | BFF | 必要时显式指定 `openclaw.json` 路径。 |

## AI 应用与知识库

| 变量 | 默认值 | 范围 | 用途 |
| --- | --- | --- | --- |
| `MINEECHO_AI_APP_MAX_TOKENS` | `65536` | BFF | OpenAI/FastGPT 风格 AI 应用的默认最大输出 token，限制在 `512` 到 `131072`。 |
| `MINEECHO_AI_APP_TIMEOUT_MS` | `120000` | BFF | 外部 AI 应用请求超时，限制在 `5000` 到 `600000` 毫秒。 |
| `MINECHO_KB_BASE_PATH` | 平台相关的 MineEcho 知识库路径 | BFF | 知识库根目录覆盖。当前知识库模块仍使用历史拼写。 |
| `LIGHT_RAG_WORKING_DIR` | 类 macOS 本地环境下为 `~/Library/Application Support/MineEcho/lightrag` | BFF | LightRAG 状态和工作目录。 |
| `LIGHTRAG_URL` | `http://localhost:3090` | BFF | LightRAG 服务地址。 |
| `LIGHT_RAG_API_KEY` | 未设置 | LightRAG | LightRAG 模型调用 API Key。LightRAG helper 可从本地 MineEcho env 文件中派生。 |

## 企业与集成

| 变量 | 默认值 | 范围 | 用途 |
| --- | --- | --- | --- |
| `MINECHO_ENTERPRISE_STORE_URL` | 未设置 | BFF | 企业 skill / AI 应用商店地址。 |
| `MINECHO_ENTERPRISE_ROLE` | `default` | BFF | 企业角色标签。 |
| `MINECHO_ENTERPRISE_USER_ID` | 未设置 | BFF | 企业用户 ID。 |
| `MINECHO_ENTERPRISE_USER_TOKEN` | 未设置 | BFF | 企业用户 token，请保存在本地。 |
| `FEISHU_BOT_ID` | 未设置 | BFF | 飞书机器人 mention 匹配。 |

## 观测与限制

| 变量 | 默认值 | 范围 | 用途 |
| --- | --- | --- | --- |
| `MINECHO_RATE_LIMIT_WINDOW_MS` | `60000` | BFF | API 限流窗口。 |
| `MINECHO_RATE_LIMIT_MAX` | `100` | BFF | 每个窗口允许的请求数。 |
| `MINECHO_PORT` | `3085` | Docker Compose | Docker Compose 暴露到宿主机的端口。 |
| `MINECHO_WORKSPACE_ROOT` | 根据 compose 文件为 `./workspace` 或 `./mineecho-workspaces` | Docker Compose | 挂载到容器内的宿主机工作区目录。 |
| `MINECHO_SKILLS_DIR` | `./skills` | Docker Compose | 可选的宿主机自定义技能目录，以只读方式挂载到容器。 |
| `MINECHO_RUNTIME` | 本地未设置，容器内为 `docker` | BFF、Docker | 容器化部署的运行时标识。 |
| `MINIMAX_API_KEY` | 未设置 | BFF、Docker、LightRAG helper | 可选模型 Provider Key，请保存在本地。 |
| `NODE_IMAGE` | compose/Dockerfile 中的 Node 22 Alpine 镜像源 | Docker build | 基础镜像覆盖，适合需要切换镜像源的用户。 |
| `LOG_LEVEL` | Docker Compose 中为 `info` | Docker | 容器日志级别。 |
| `LOG_FORMAT` | Docker Compose 中为 `json` | Docker | 容器日志格式。 |
| `ENABLE_CONVERSATION_STATS` | `true` | BFF | 设置为 `false` 可关闭。 |
| `STATS_QUEUE_DIR` | `/tmp/stats-queue` | BFF | 使用/统计记录队列目录。 |
| `MAX_DAILY_INTERACTIONS` | `300` | BFF | 每日交互保护上限。 |
| `MAX_MEMORY_CACHE_SIZE` | `1000` | BFF | 长期记忆缓存用户上限。 |
| `MAX_SHORTTERMMEMORYSTORE_SIZE` | `10000` | BFF | 短期记忆缓存条目上限。 |
| `BATCH_WRITE_INTERVAL_MS` | `30000` | BFF | 批量写入间隔。 |
| `ENABLE_BATCH_WRITE` | `true` | BFF | 设置为 `false` 可关闭批量写入。 |

真实 token、生产端点和企业配置只应保存在本地 `.env`。不要提交 `.mineecho/`、`.openclaw/` 或 `apps/**/workspace/` 等运行态目录。

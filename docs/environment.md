# Environment Variables

MineEcho is local-first. Most users only need `apps/bff/.env` and can leave Console defaults unchanged.

## Core Runtime

| Variable | Default | Scope | Purpose |
| --- | --- | --- | --- |
| `BFF_PORT` | `3085` | BFF, Electron | HTTP port for the BFF. If changed, update the Console Vite proxy too. |
| `MINEECHO_CONFIG_HOME` | `apps/bff/.mineecho` in local BFF dev | BFF | Main runtime directory for credentials, AI apps, chat history, metrics, and local state. |
| `MINECHO_CONFIG_HOME` | unset | BFF | Legacy alias. `MINEECHO_CONFIG_HOME` takes precedence. |
| `MINEECHO_CORS_ORIGINS` | local dev origins | BFF | Comma-separated CORS allowlist. |
| `MINECHO_REQUIRE_AUTH` | `false` | BFF | Set to `true` to require auth on protected BFF endpoints. |
| `VITE_MINEECHO_AUTH_REQUIRED` | `false` | Console | Set to `true` to force the Console login flow in local development. |
| `MINEECHO_HOST` | `http://127.0.0.1:3085` | `mineecho-skill` CLI | Default host for the skill CLI. |
| `SCLAW_HOST` | unset | `mineecho-skill` CLI | Legacy CLI host alias. `MINEECHO_HOST` takes precedence. |

## Gateway Compatibility

| Variable | Default | Scope | Purpose |
| --- | --- | --- | --- |
| `OPENCLAW_GATEWAY_URL` | `ws://127.0.0.1:18789` | BFF | WebSocket URL for the Gateway compatibility layer. |
| `OPENCLAW_GATEWAY_HTTP_URL` | `http://127.0.0.1:18789` | BFF | HTTP URL for Gateway calls. |
| `OPENCLAW_GATEWAY_PORT` | `18789` | BFF, Docker | Local Gateway port. |
| `OPENCLAW_GATEWAY_TOKEN` | unset | BFF, Docker | Optional Gateway token. |
| `OPENCLAW_HOME` | local OpenClaw-compatible runtime path | BFF | Parent directory containing `.openclaw/`. |
| `OPENCLAW_CONFIG_PATH` | auto-detected | BFF | Explicit path to `openclaw.json` when needed. |

## AI Apps and Knowledge

| Variable | Default | Scope | Purpose |
| --- | --- | --- | --- |
| `MINEECHO_AI_APP_MAX_TOKENS` | `65536` | BFF | Default max output tokens for OpenAI/FastGPT-style AI apps. Values are clamped to `512`-`131072`. |
| `MINEECHO_AI_APP_TIMEOUT_MS` | `120000` | BFF | External AI app request timeout. Values are clamped to `5000`-`600000`. |
| `MINECHO_KB_BASE_PATH` | platform-specific MineEcho knowledge path | BFF | Knowledge-base root override. Legacy spelling is currently used by the knowledge-base module. |
| `LIGHT_RAG_WORKING_DIR` | `~/Library/Application Support/MineEcho/lightrag` on macOS-like local environments | BFF | LightRAG status and working directory. |
| `LIGHTRAG_URL` | `http://localhost:3090` | BFF | LightRAG service URL. |
| `LIGHT_RAG_API_KEY` | unset | LightRAG | API key for LightRAG model calls. The LightRAG helper can derive it from local MineEcho env files when available. |

## Enterprise and Integrations

| Variable | Default | Scope | Purpose |
| --- | --- | --- | --- |
| `MINECHO_ENTERPRISE_STORE_URL` | unset | BFF | Enterprise skill/app store URL. |
| `MINECHO_ENTERPRISE_ROLE` | `default` | BFF | Enterprise role label. |
| `MINECHO_ENTERPRISE_USER_ID` | unset | BFF | Enterprise user id. |
| `MINECHO_ENTERPRISE_USER_TOKEN` | unset | BFF | Enterprise user token. Keep local. |
| `FEISHU_BOT_ID` | unset | BFF | Feishu bot mention matching. |

## Observability and Limits

| Variable | Default | Scope | Purpose |
| --- | --- | --- | --- |
| `MINECHO_RATE_LIMIT_WINDOW_MS` | `60000` | BFF | API rate-limit window. |
| `MINECHO_RATE_LIMIT_MAX` | `100` | BFF | API requests allowed per window. |
| `MINECHO_PORT` | `3085` | Docker Compose | Host port published by Docker Compose. |
| `MINECHO_WORKSPACE_ROOT` | `./workspace` or `./mineecho-workspaces`, depending on compose file | Docker Compose | Host workspace directory mounted into the container. |
| `MINECHO_SKILLS_DIR` | `./skills` | Docker Compose | Optional host directory for read-only custom skills in the container. |
| `MINECHO_RUNTIME` | unset locally, `docker` in containers | BFF, Docker | Runtime label used by containerized deployments. |
| `MINIMAX_API_KEY` | unset | BFF, Docker, LightRAG helper | Optional model provider key. Keep local. |
| `NODE_IMAGE` | compose/Dockerfile-specific Node 22 Alpine mirror | Docker build | Base image override for users who need a different registry mirror. |
| `LOG_LEVEL` | `info` in Docker Compose | Docker | Container log verbosity. |
| `LOG_FORMAT` | `json` in Docker Compose | Docker | Container log format. |
| `ENABLE_CONVERSATION_STATS` | `true` | BFF | Disable with `false`. |
| `STATS_QUEUE_DIR` | `/tmp/stats-queue` | BFF | Queue directory for usage/stat records. |
| `MAX_DAILY_INTERACTIONS` | `300` | BFF | Daily interaction guardrail. |
| `MAX_MEMORY_CACHE_SIZE` | `1000` | BFF | Long-term memory cache user cap. |
| `MAX_SHORTTERMMEMORYSTORE_SIZE` | `10000` | BFF | Short-term memory cache item cap. |
| `BATCH_WRITE_INTERVAL_MS` | `30000` | BFF | Batch write interval. |
| `ENABLE_BATCH_WRITE` | `true` | BFF | Disable batch writes with `false`. |

Keep real tokens and production endpoints in local `.env` files. Do not commit runtime directories such as `.mineecho/`, `.openclaw/`, or `apps/**/workspace/`.

# 运行态数据说明

MineEcho 是本地优先项目。运行态数据、凭据、导入的技能、AI 应用配置和用户内容都应保留在本地，不应进入源码仓库。

## 主运行态目录

BFF 默认会把本地运行态文件写到：

```sh
apps/bff/.mineecho/
```

可以通过 `MINEECHO_CONFIG_HOME` 修改运行态目录：

```sh
MINEECHO_CONFIG_HOME=/path/to/mineecho-data
```

`MINECHO_CONFIG_HOME` 作为历史兼容别名仍然可用；如果两个变量同时存在，优先使用 `MINEECHO_CONFIG_HOME`。启动时如果两个变量都存在、新目录为空且旧目录存在，MineEcho 会把旧运行态文件一次性复制到新目录。

仓库已经忽略 `.mineecho/`、`.openclaw/`、`apps/**/.mineecho/`、`apps/**/.openclaw/` 和 `apps/**/workspace/`。

## 常见文件

| 路径 | 用途 | 是否可能含敏感信息 | 是否可删除 |
| --- | --- | --- | --- |
| `.mineecho/.env` | 初始化/配置流程写入的本地环境变量 | 是 | 可删除，但本地配置会丢失 |
| `.mineecho/encrypted-keys.json` | 保存的 Provider/API 凭据 | 是 | 可删除，但需要重新配置 Provider |
| `.mineecho/enterprise.json` | 企业/账号集成配置 | 可能 | 可删除，企业模式会重置 |
| `.mineecho/ai-apps.json` | AI 应用连接元数据 | 常见情况下是，尤其配置了 API Key 时 | 可删除，已导入 AI 应用会移除 |
| `.mineecho/custom-skills.json` | JSON 导入的自定义 skill 元数据 | 通常否 | 可删除，自定义 skill 会移除 |
| `.mineecho/skills-state.json` | skill 启用/停用状态 | 否 | 可删除，skill 开关会重置 |
| `.mineecho/tokenjuice-metrics.json` | TokenJuice 压缩和成本节省指标 | 不直接含密钥 | 可删除，指标会重置 |
| `.mineecho/performance-metrics.json` | Console 上报到 BFF 的性能指标 | 可能含路径、User-Agent、IP | 可删除，指标会重置 |
| `.mineecho/chat-history/` | 本地聊天记录 | 是 | 可删除，聊天历史会移除 |
| `.mineecho/audio/` | 会议/录音数据 | 是 | 可删除，录音会移除 |
| `.mineecho/logs/` | 审计和诊断日志 | 可能 | 可删除，日志会移除 |
| `.mineecho/.usage-queue/` | 等待上报的使用记录 | 可能 | 可删除，未发送记录会移除 |
| `.mineecho/sync-tasks.json` | skill 同步任务进度 | 否 | 可删除，同步进度会重置 |

核心 BFF 运行态文件已统一走 `getMineEchoHome()` 解析，因此设置 `MINEECHO_CONFIG_HOME` 后，凭据、导入技能、指标、聊天记录、录音、设备身份和 workspace 配置会落到同一个运行态目录。

## AI 应用运行限制

对于 OpenAI/FastGPT 风格的 AI 应用，MineEcho 会在对话请求中发送 `max_tokens`。优先级为：

1. AI 应用页面中每个应用的“最大输出 Token”。
2. `MINEECHO_AI_APP_MAX_TOKENS`。
3. 默认值 `65536`。

低于 `512` 的值会被忽略，高于 `131072` 的值会被截到 `131072`。外部模型或平台仍可能执行更低的自身上限。

`MINEECHO_AI_APP_TIMEOUT_MS` 用于控制外部 AI 应用请求超时。默认 `120000` 毫秒；有效值会限制在 `5000` 到 `600000` 毫秒之间。

## PI/Gateway 兼容层数据

MineEcho 基于 OpenClaw PI 框架能力做二次开发，当前运行时仍复用 Gateway 相关包与协议能力。Gateway 兼容层运行态文件通常位于：

```sh
apps/bff/.openclaw/
```

或者位于 `OPENCLAW_HOME` 指向的目录。

其中可能包含 Gateway token、生成的 workspace 状态、导入的 Gateway skills 和本地工具输出。请将该目录视为运行态数据，不要提交。

## 知识库数据

知识库文件由 BFF knowledge-base 服务管理，可能包含：

- 导入的原始文档。
- 生成的 wiki 页面。
- 图谱、embedding、索引状态。
- `alignment-history.json`，用于记录用户确认过的记忆到知识库对齐提交。

这些文件可能包含个人或企业知识。不要随开源仓库发布。

## 发布前清理检查

在仓库根目录运行：

```sh
npm run check:release
```

干净的开源树会输出通过信息。如果只想在本地查看清单但不让命令失败，可以运行：

```sh
node scripts/check-release.mjs --warn-only
```

## 后续清理 Roadmap

- 继续审计优先级较低的学习/分析路径，让历史 trajectory 数据也遵循同一运行态目录策略。
- 将会持续增长的 JSON 运行态存储迁移到 SQLite 或 JSONL。
- 增加诊断导出/脱敏命令，方便分享问题信息而不泄露用户数据。

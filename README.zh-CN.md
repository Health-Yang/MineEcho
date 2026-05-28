# MineEcho

MineEcho 是一个源码开放、本地优先的 AI 助手框架，用于构建私有、可扩展、可长期运行的个人或团队 AI 工作流。

它的核心目标不是再做一个聊天界面，而是把技能、记忆、知识库、知识图谱和成本控制串成一个可演进的助手系统。

## 核心理念

- **技能路由：** 用户提问后，系统优先判断是否应该调用某个专业 skill，而不是把所有问题都交给一个通用提示词。
- **记忆沉淀：** 将交互历史压缩为可长期使用的工作记忆，同时保持原始记录本地可控。
- **知识库与知识图谱：** 将导入文档、知识节点、实体关系组织成可浏览、可检索、可对齐的知识层。
- **成本控制：** 通过本地默认、显式模型配置、TokenJuice 压缩和指标统计，避免长期使用时成本失控。

## 当前能力

- 本地 Console 与 BFF，支持聊天、技能中心、记忆、知识库、会议/日历辅助和配置管理。
- 技能中心支持 JSON 技能导入、ZIP/.skill 包导入、URL 安装、AI 应用注册、触发词刷新和路由预览 API。
- AI 应用适配器可以把 RAG / Workflow 应用转换成 Gateway 可调用的 skill。
- 记忆到知识库的对齐预览、提交历史和知识图谱刷新链路。
- 知识图谱邻域 API，可解释选中节点的一跳关系。
- TokenJuice 压缩指标支持本地持久化。

## 快速启动

安装 BFF 和 Console 的依赖：

```sh
npm run install:apps
cp apps/bff/.env.example apps/bff/.env
# 可选，仅在需要覆盖 Console 默认行为时使用：
# cp apps/console/.env.example apps/console/.env
```

在仓库根目录同时启动 BFF 和 Console：

```sh
npm run dev
```

开发地址：

- Console：`http://127.0.0.1:5175/`
- BFF：`http://127.0.0.1:3085/`

当前 Vite 开发配置会把 `/api` 代理到本地 BFF。

首次运行时，先打开 Console，再在设置中确认模型、Gateway 或 Provider 配置是否符合本机环境。MineEcho 不会随源码仓库提供真实模型密钥或生产端点；需要调用外部模型、嵌入服务、AI 应用或技能执行时，请只在本地 `.env` 中配置。

如果需要单独调试某一侧，也可以分别启动：

```sh
npm run dev:bff
npm run dev:console
```

构建检查：

```sh
npm run build
```

启动已构建的 BFF：

```sh
npm run start:bff
```

基础验证：

```sh
npm run verify
```

服务启动后的运行态 smoke 检查：

```sh
npm run smoke
```

发布阻塞级别的依赖安全审计：

```sh
npm run audit:apps
```

导出对外发布源码包：

```sh
npm run export:release
```

该命令会把过滤后的源码导出到 `releases/mineecho-source-<version>/`，并检查是否误带 `.mineecho/`、`.openclaw/`、`apps/**/workspace/`、本地 `.env`、数据库、密钥或运行态 JSON。公开发布时请使用导出目录或干净 clone，不要直接发布本机开发目录。

## 本地优先与隐私默认值

MineEcho 默认面向本地回环服务运行。密钥、模型 Provider API Key、生产端点、用户数据和企业知识都应保存在被忽略的本地文件中，不应进入源码仓库。

从示例环境文件开始：

```sh
cp apps/bff/.env.example apps/bff/.env
# 可选：
# cp apps/console/.env.example apps/console/.env
```

然后只在本机编辑 `.env`。不要提交真实 token 或服务凭据。

本地开发默认不会强制弹出登录页。如果需要显式测试登录流程，可以设置：

```sh
VITE_MINEECHO_AUTH_REQUIRED=true
```

BFF 默认端口是 `3085`。只有在同步修改 Console 代理目标时，才建议通过 `BFF_PORT` 覆盖。

以下运行态目录已经被 `.gitignore` 忽略：

- `.mineecho/`
- `.openclaw/`
- `apps/**/.mineecho/`
- `apps/**/.openclaw/`
- `apps/**/workspace/`

更详细的运行态文件说明见 [`docs/runtime-data.zh-CN.md`](docs/runtime-data.zh-CN.md)。

## 项目文档

- 环境变量说明：[`docs/environment.zh-CN.md`](docs/environment.zh-CN.md)
- 架构总览：[`docs/architecture.zh-CN.md`](docs/architecture.zh-CN.md)
- 运行态数据与本地密钥：[`docs/runtime-data.zh-CN.md`](docs/runtime-data.zh-CN.md)
- 已知限制与公开发布说明：[`docs/known-limitations.zh-CN.md`](docs/known-limitations.zh-CN.md)
- 商业使用说明：[`COMMERCIAL.zh-CN.md`](COMMERCIAL.zh-CN.md)
- 贡献流程：[`CONTRIBUTING.zh-CN.md`](CONTRIBUTING.zh-CN.md)
- 安全策略：[`SECURITY.zh-CN.md`](SECURITY.zh-CN.md)
- 发布前检查：[`docs/release-checklist.md`](docs/release-checklist.md)
- 变更日志：[`CHANGELOG.md`](CHANGELOG.md)

## Skill 与 AI 应用路由

MineEcho 会先将用户意图路由到合适的技能，再决定是否进入通用聊天。

- 导入的 skill 和 AI 应用都会进入技能注册表。
- ZIP/.skill 导入会经过安全扫描，并被规范化，确保 `SKILL.md` 位于 skill 根目录。
- AI 应用和自定义 skill 会从 `name + description` 自动派生兜底触发词，即使触发词索引尚未刷新，也能被路由发现。
- 用户提问时，路由器会综合 trigger、name、description、mode 等证据打分，返回最匹配的 skill 候选。

## 记忆与知识库

MineEcho 的记忆和知识库模块面向长期运行的个人或团队助手：

- 交互记忆和用户画像可以沉淀为持久记忆层。
- 导入知识可以被整理为 wiki 文件和知识图谱节点。
- 记忆到知识库的对齐支持预览、人工确认、提交和按用户隔离的历史记录。

当前实现以“先预览、再确认”为主。完全自动的后台记忆重构、知识候选生成和冲突提问仍在 Roadmap 中。

## OpenClaw Gateway 兼容层

MineEcho 当前内嵌 OpenClaw 作为本地 Gateway 兼容层，用于执行技能和复用已有 Gateway 能力。因此源码中仍可能出现 OpenClaw 协议名、包名、配置文件名或适配器注释。

推荐理解边界如下：

- **MineEcho：** 产品 UI、BFF 编排、记忆、知识库、技能注册、技能路由和本地优先运行态。
- **Gateway 兼容层：** OpenClaw 包/协议集成，用于执行 skill 和桥接既有 Gateway 行为。

不要盲目重命名 Gateway 协议路径，否则容易破坏兼容性。

## 仓库结构

- `apps/bff/`：BFF 服务、路由、记忆、知识库、技能和 Gateway 适配。
- `apps/console/`：Console 前端应用。
- `docs/`：技术文档、优化计划和运行态说明。
- `designs/`、`_designs/`：设计材料和实验稿。

## Roadmap

- 记忆后台重构任务：把旧交互总结为知识候选。
- 知识图谱实体归一、别名合并和节点级变更历史。
- Skill 健康检查：触发词预览、脚本存在性、路由测试、连通性和风险报告。
- TokenJuice 预算智能体：按任务类型选择模型、上下文深度和压缩策略。
- 运行态数据统一走 `getMineEchoHome()`，减少分散写入。
- 端到端集成测试：AI 应用导入、skill 包导入、聊天路由、知识对齐。

## 许可证

MineEcho 采用 PolyForm Noncommercial License 1.0.0 进行源码开放。非商业用途可按 [`LICENSE`](LICENSE) 使用；商业用途需要另行取得书面商业授权，详见 [`COMMERCIAL.zh-CN.md`](COMMERCIAL.zh-CN.md)。

由于该许可证限制商业使用，MineEcho 不属于 OSI 批准的严格意义上的开源许可证项目，更准确的表述是“源码开放 / source-available”。

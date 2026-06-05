# MineEcho

**一个本地优先的个人 AI 助手 Memory OS：记住你，学习知识，调用技能，并减少上下文成本。**

MineEcho 是一个源码开放、本地优先的 AI 助手框架，用于构建私有、可扩展、可长期运行的个人或团队 AI 工作流。

它的核心目标不是再做一个聊天界面，而是把技能、记忆、知识库、知识图谱和成本控制串成一个可演进的助手系统。

## 为什么是 MineEcho

很多 AI 产品只解决其中一个问题：聊天、RAG、工具调用或成本控制。MineEcho 的重点是把它们串成一个闭环：

> **记：** 记住用户说过什么、做过什么、偏好什么。  
> **学：** 把外部文档整理成 Wiki++ 知识库和知识图谱。  
> **用：** 把 skill 和 AI 应用接入同一个路由面。  
> **省：** 用 TokenLess 压缩工具输出、文档抽取和任务结果。

这让 MineEcho 更像一个“个人/团队 AI 助手操作系统”，而不是一个孤立聊天壳。

当普通聊天界面太健忘、RAG 知识库太被动、Agent 框架输出太吵时，MineEcho 的目标是把这些能力收束成一个可长期运行的个人 AI 助手底座。

| 常见产品形态 | 常见短板 | MineEcho 的差异点 |
|--------------|----------|-------------------|
| 普通 Chat UI | 不记长期上下文，工具和知识分散 | 记忆树 + 知识库 + skill 路由 + 成本层 |
| 单纯 RAG 知识库 | 文档碎片化，缺少行动能力 | raw/wiki 双层知识库 + 四通道检索 + AI 应用协同 |
| Agent 工具框架 | 工具输出噪声大，上下文成本高 | TokenLess 场景化压缩，保留错误、计数和关键行 |
| 企业 AI 应用平台 | 应用之间割裂，用户习惯难沉淀 | AI 应用转换成 skill，统一触发、路由和健康检查 |

## 和常见方案的关键区别

- **记忆优先：** MineEcho 不只是保存聊天记录，而是把交互沉淀成 L0 原始片段、L1 日摘要、L2 周摘要、L3 月归档，并在提问时给出可召回的上下文证据。
- **Wiki++ 知识系统：** 导入资料会进入 raw 原始层、wiki 智能层、chunk 索引层、graph 图谱层和 alignment 对齐层，不只是丢进向量库。
- **Skill 与 AI 应用一体化：** 外部 AI 应用会被注册成可调用 skill，参与同一套路由、触发词、健康检查和工作流。
- **TokenLess 成本层：** 命令日志、工具输出、URL 导入和文档抽取结果会按场景压缩后再进入上下文或记忆，减少长期使用时的 token 浪费。
- **本地优先发布：** 运行态数据、模型密钥、聊天历史、会议音频和指标都保存在本地 MineEcho 状态目录，并默认排除在发布包外。

## 核心理念

- **技能路由：** 用户提问后，系统优先判断是否应该调用某个专业 skill，而不是把所有问题都交给一个通用提示词。
- **记忆沉淀：** 将交互历史压缩为可长期使用的工作记忆，同时保持原始记录本地可控。
- **知识库与知识图谱：** 将导入文档、知识节点、实体关系组织成可浏览、可检索、可对齐的知识层。
- **成本控制：** 通过本地默认、显式模型配置、TokenLess 压缩和指标统计，避免长期使用时成本失控。

## 产品截图

### 聊天工作台

![MineEcho 聊天工作台](marketing/screenshots-zh/01-chat-memory.png)

### 技能中心

![MineEcho 技能中心](marketing/screenshots-zh/02-skills-center.png)

### Wiki++ 知识库

![MineEcho Wiki++ 知识库](marketing/screenshots-zh/03-knowledge-base.png)

### L0-L3 记忆系统

![MineEcho L0-L3 记忆系统](marketing/screenshots-zh/04-memory-system.png)

### 模型与运行设置

![MineEcho 模型与运行设置](marketing/screenshots-zh/05-settings-models.png)

### 会议工作流

![MineEcho 会议工作流](marketing/screenshots-zh/06-meeting-workflow.png)

## 核心亮点

### 记忆系统：运行时记忆 + L0-L3 记忆树

MineEcho 不只保存聊天记录，而是把记忆拆成两种互补视角：

- **Working / Short-term / Long-term：** 当前会话、当日交互、跨会话用户画像和长期洞察。
- **L0 / L1 / L2 / L3 Memory Tree：** 原始片段、日摘要、周摘要、月归档。

用户提问时，MineEcho 会先从近期 L0 片段中粗排，再对候选记忆使用 embedding 重排；L1/L2 摘要会通过本地语义门槛后再增强排序。这样可以在控制 token 的前提下，把“前几天问过什么”“之前执行过什么任务”“用户偏好什么”注入到当前回答中。

### Wiki++ 知识库：不是普通 RAG

MineEcho 的知识库采用 **raw 原始层 + wiki 智能层 + chunk 索引层 + graph 图谱层 + alignment 对齐层**。

查询时不是只靠向量搜索，而是使用四通道融合：

1. 向量搜索：找语义相似 chunk。
2. BM25：处理中英文关键词命中。
3. 结构化搜索：利用 title、type、tags、heading。
4. 图谱通道：通过实体节点和邻域关系找到关联知识。

这种设计更接近“先把资料压成高密度、可维护知识，再给 AI 使用”的 Karpathy 式知识库思路，同时保留原始证据和图谱关系。

### Skill 与 AI 应用协同

MineEcho 会把原生 skill、导入 skill 和外部 AI 应用放进同一个技能注册与路由体系：

- AI 应用会转换成 Gateway 可调用的 skill。
- 系统从 `name + description` 自动生成触发词。
- 用户提问后，路由器根据 trigger、name、description、mode 打分，返回候选技能和 evidence。

结果是：AI 应用不再是孤立入口，而是可以被 MineEcho 在聊天和任务上下文中主动推荐和调用。

### TokenLess：场景化 token 压缩

TokenLess 当前内置 15 类规则，覆盖 git、npm、cargo、docker、文档抽取和通用输出。它不是简单截断，而是按场景保留关键事实：

- 测试日志保留 pass/fail/skip 计数和失败上下文。
- `git diff` 保留头尾片段、增删统计，过滤重复 header。
- `docker logs` 过滤时间戳噪声，保留 error/warn 计数。
- 文档抽取去空行、去重复，并保留结构头尾。

基于当前规则结构，常见长输出可估算节省约 20%-85% token；真实节省比例取决于输出长度和重复程度，系统会本地记录 raw/reduced 字符数与 estimated tokens saved。

## 当前能力

- 本地 Console 与 BFF，支持聊天、技能中心、记忆、知识库、会议/日历辅助和配置管理。
- 技能中心支持 JSON 技能导入、ZIP/.skill 包导入、URL 安装、AI 应用注册、触发词刷新和路由预览 API。
- AI 应用适配器可以把 RAG / Workflow 应用转换成 Gateway 可调用的 skill。
- 记忆到知识库的对齐预览、提交历史和知识图谱刷新链路。
- 知识图谱邻域 API，可解释选中节点的一跳关系。
- TokenLess 压缩指标支持本地持久化。

## 快速启动

### 方式一：Windows 桌面安装包

如果只是想快速体验 MineEcho，推荐优先使用 Windows 桌面安装包。

- 百度网盘：<https://pan.baidu.com/s/1oERH-NdpTRwobfp1F8keEQ?pwd=j6kd>
- 提取码：`j6kd`

使用步骤：

1. 从上面的网盘链接下载桌面版合集，并选择 Windows 安装包。
2. 在 Windows 10 或 Windows 11 上运行 `MineEcho Setup 1.0.0.exe`。
3. 按安装向导完成安装。
4. 从桌面快捷方式或开始菜单启动 MineEcho。
5. 首次启动后完成初始化向导，并在设置页配置自己的模型 Provider API Key。

说明：

- Windows 安装包已经包含 MineEcho 桌面应用和打包版本所需的本地运行依赖。
- 安装包不会内置任何真实模型 API Key。请在首次启动后使用自己的 Key 进行本地配置。
- 聊天记录、知识库文件、本地技能、运行状态和模型配置默认保存在用户本机。

### 方式二：macOS DMG 安装包

如果是在 macOS 上快速体验 MineEcho，可以使用 macOS DMG 安装包。

- 百度网盘：<https://pan.baidu.com/s/1oERH-NdpTRwobfp1F8keEQ?pwd=j6kd>
- 提取码：`j6kd`

使用步骤：

1. 从上面的网盘链接下载桌面版合集，并选择 macOS DMG 安装包。
2. 打开 DMG，将 MineEcho 拖入“应用程序”。
3. 从“应用程序”或 Launchpad 启动 MineEcho。
4. 首次启动后完成初始化向导，并在设置页配置自己的模型 Provider API Key。

说明：

- macOS DMG 已经包含 MineEcho 桌面应用和打包版本所需的本地运行依赖。
- 当前 macOS 包为临时 ad-hoc 签名版本，尚未完成 Apple Developer ID notarization。首次打开如被系统拦截，可在“系统设置 -> 隐私与安全性”中点击“仍要打开”，或右键 MineEcho 选择“打开”。
- 安装包不会内置任何真实模型 API Key。请在首次启动后使用自己的 Key 进行本地配置。
- 聊天记录、知识库文件、本地技能、运行状态和模型配置默认保存在用户本机。

### 方式三：从源码启动

下面是面向第一次使用者的完整流程。源码方式会在当前系统上重新安装依赖，适合没有对应系统 runtime 包、或者需要开发调试的用户。

#### 1. 准备环境

需要先安装：

- Git
- Node.js 22 或更高版本
- npm，通常会随 Node.js 一起安装

检查版本：

```sh
git --version
node -v
npm -v
```

如果 `node -v` 低于 22，建议先升级 Node.js。

#### 2. 克隆项目

```sh
git clone https://github.com/Health-Yang/MineEcho.git
cd MineEcho
```

#### 3. 安装依赖

```sh
npm run install:apps
```

如果你已经按截图误输入了 `npm run install:all`，也可以继续使用；它是 `install:apps` 的兼容别名。

这个命令会安装 BFF、Console，以及仓库内置的 OpenClaw Gateway runtime 依赖。MineEcho 已经在 `vendor/openclaw-gateway/` 中包含 OpenClaw Gateway runtime 源码，用户不需要单独安装 OpenClaw。

#### 4. 创建本地环境文件

```sh
cp apps/bff/.env.example apps/bff/.env
# 可选，仅在需要覆盖 Console 默认行为时使用：
# cp apps/console/.env.example apps/console/.env
```

MineEcho 不会把真实模型密钥放进仓库。首次运行可以先不填 key，后续在 Console 的设置页中配置模型 Provider。

#### 5. 启动开发服务

```sh
npm run dev
```

开发地址：

- Console：`http://127.0.0.1:5175/`
- BFF：`http://127.0.0.1:3085/`

当前 Vite 开发配置会把 `/api` 代理到本地 BFF。

首次运行时，先打开 Console，再在设置中完成模型/API Key 配置。需要调用外部模型、嵌入服务、AI 应用或技能执行时，请只在本地 `.env` 或 Console 设置页中配置，不要提交到 Git。

#### 6. 单独调试 BFF 或 Console

如果需要单独调试某一侧，可以分别启动：

```sh
npm run dev:bff
npm run dev:console
```

#### 7. 验证和构建

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

MineEcho 的底层执行能力会复用 OpenClaw PI 框架中的 Gateway 相关包。因此 `.openclaw/` 路径和部分 OpenClaw/Gateway 命名仍会出现在运行态和兼容代码中，它们是底层实现细节，不是对外产品品牌。

仓库包含 `vendor/openclaw-gateway/`，这是基于 `openclaw@2026.5.27` 提取的 OpenClaw Gateway runtime 源码，遵循上游 MIT license。仓库不会提交 `node_modules`；运行 `npm run install:apps` 时会为该 runtime 安装第三方依赖。

## 项目文档

- 环境变量说明：[`docs/environment.zh-CN.md`](docs/environment.zh-CN.md)
- 架构总览：[`docs/architecture.zh-CN.md`](docs/architecture.zh-CN.md)
- 产品定位与核心亮点：[`docs/product-positioning.zh-CN.md`](docs/product-positioning.zh-CN.md)
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

MineEcho 是基于 OpenClaw 的 PI 框架能力做的二次开发，并在产品层增加了记忆、Wiki++ 知识库、AI 应用转 skill、TokenLess 和本地 Console 等能力。

当前 PI 框架相关能力在运行时仍会使用 Gateway 相关包来完成 skill 执行、工具调用和协议桥接。因此源码中仍可能出现 OpenClaw 协议名、Gateway 包名、配置文件名或适配器注释。

推荐理解边界如下：

- **MineEcho：** 产品 UI、BFF 编排、记忆、知识库、技能注册、技能路由和本地优先运行态。
- **PI/Gateway 兼容层：** 复用 OpenClaw PI 框架中的 Gateway 相关包与协议能力，用于执行 skill 和桥接既有工具行为。

不要盲目重命名 OpenClaw/Gateway 协议路径或配置路径，否则容易破坏底层兼容性。

## 仓库结构

- `apps/bff/`：BFF 服务、路由、记忆、知识库、技能和 Gateway 适配。
- `apps/console/`：Console 前端应用。
- `docs/`：技术文档、优化计划和运行态说明。
- `vendor/openclaw-gateway/`：随仓库发布的 OpenClaw Gateway runtime 源码和构建产物。

## Roadmap

- 记忆后台重构任务：把旧交互总结为知识候选。
- 知识图谱实体归一、别名合并和节点级变更历史。
- Skill 健康检查：触发词预览、脚本存在性、路由测试、连通性和风险报告。
- TokenLess 预算智能体：按任务类型选择模型、上下文深度和压缩策略。
- 运行态数据统一走 `getMineEchoHome()`，减少分散写入。
- 端到端集成测试：AI 应用导入、skill 包导入、聊天路由、知识对齐。

## 许可证

MineEcho 采用 PolyForm Noncommercial License 1.0.0 进行源码开放。非商业用途可按 [`LICENSE`](LICENSE) 使用；商业用途需要另行取得书面商业授权，详见 [`COMMERCIAL.zh-CN.md`](COMMERCIAL.zh-CN.md)。

由于该许可证限制商业使用，MineEcho 不属于 OSI 批准的严格意义上的开源许可证项目，更准确的表述是“源码开放 / source-available”。

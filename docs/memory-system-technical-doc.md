# MineEcho v3.5 记忆系统技术文档

> 本文档描述 MineEcho v3.5 优化后的记忆系统架构、核心机制、与业界方案的对比，以及差异化优势。
> 更新日期：2026-04-28

---

## 一、执行摘要

MineEcho v3.5 记忆系统采用**三层渐进式架构**：

| 层级 | 作用域 | 持久化 | 容量 |
|------|--------|--------|------|
| **Working Memory** | 当前会话 | 无（纯内存） | 20 条消息 |
| **Short-term Memory** | 当日 | **SQLite**（原 LRU，已迁移） | 300 条交互/天 |
| **Long-term Memory** | 跨会话永久 | 文件 JSON | 用户画像 + 技能模式 + 洞察 |

**本次优化引入的四大核心机制**：
1. **冻结快照**（Frozen Snapshot）：Session 级 System Prompt 缓存，保护 Prefix Cache
2. **重要性权重**（Importance Scoring）：交互按价值排序，突破单纯时间倒序的局限
3. **背景审查 Agent**（Background Review）：每 10 轮后台提取高价值洞察写入长期记忆
4. **SQLite 持久化**：短期记忆从纯内存迁移到 SQLite，重启不丢失

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              User Message                                │
│                    ┌──────────────────────────────┐                     │
│                    │  KB Context (query-dependent) │                     │
│                    │  + Original User Content      │                     │
│                    └──────────────────────────────┘                     │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  System Prompt (frozen per session)                              │   │
│  │  ├── Base MineEcho persona (硬编码)                                 │   │
│  │  ├── Mode-specific prompt (general/auto/coding/...)              │   │
│  │  └── Memory Snapshot (profile + top interactions + tasks)        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│                         Gateway / OpenClaw                               │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Post-Processing                                                 │   │
│  │  ├── Strip System Prompt                                         │   │
│  │  ├── Strip Memory Context                                        │   │
│  │  ├── Attach Risk Alert (if any)                                  │   │
│  │  └── Attach Workplace Intelligence Advice                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Memory Learning (fire-and-forget)                               │   │
│  │  ├── recordInteraction → Short-term Memory (SQLite)              │   │
│  │  ├── learnProfile → Long-term Memory (技术栈/领域推断)            │   │
│  │  ├── recordSkillUsage → Long-term Memory                        │   │
│  │  ├── trajectoryStore → JSONL 对话轨迹                            │   │
│  │  └── onTurnCompleted → Background Review (每10轮)                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
用户发送消息
    │
    ├──→ Trigger Processing（技能触发词匹配）
    │
    ├──→ buildSessionSystemPromptExtension()
    │      ├── 首次：buildMemoryContext() → 查询 SQLite + 文件
    │      └── 后续：命中 sessionSystemPromptCache（零 I/O）
    │
    ├──→ buildUserMessage()
    │      └── KB 检索（query-dependent，每次重新构建）
    │
    ├──→ chatSend(systemPromptExtension, userMessage)
    │      └── Gateway / OpenClaw
    │
    ├──→ 接收响应
    │
    ├──→ Post-processing（strip / attach alerts）
    │
    └──→ Memory Learning（异步，不阻塞响应）
           ├── addInteraction(userMessage, assistantContent) → SQLite
           ├── learnFromInteraction() → 技术栈/领域推断
           ├── recordSkillUsage() → 长期记忆
           └── onTurnCompleted() → 背景审查 Agent（每10轮）
```

---

## 三、各层详解

### 3.1 Working Memory（工作记忆）

**作用域**：当前会话（sessionId 维度）
**持久化**：无（纯内存 Map）
**生命周期**：30 分钟无活动自动清理

```typescript
interface WorkingMemory {
  sessionId: string;
  recentMessages: Message[];      // 最近 20 条
  currentContext: {
    taskType?: "coding" | "writing" | "analysis" | "learning";
    topic?: string;
    urgency?: "low" | "medium" | "high";
    relatedSkills?: string[];
    entities?: Entity[];          // 从消息中提取的技术实体
  };
  activeSkills: string[];
  createdAt: number;
  lastActivity: number;
}
```

**实体提取**：基于正则模式匹配（JavaScript/TypeScript/Python/React/Docker 等），置信度 0.7。

**为什么不持久化？**
Working Memory 本质是"当前上下文窗口的缓存"，随会话结束而销毁是正确语义。需要跨会话保留的信息应通过 Memory Learning 下沉到 Short-term 或 Long-term。

### 3.2 Short-term Memory（短期记忆）—— 本次优化重点

**作用域**：当日（YYYY-MM-DD 维度）
**持久化**：**SQLite**（`workspace/memory/short-term-memory.db`）
**容量**：300 条交互/天
**生命周期**：30 天后自动清理

#### 3.2.1 Schema

```sql
CREATE TABLE stm_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,           -- chat | skill_invocation | preference_indicated | task_created
  content TEXT NOT NULL,
  skill_id TEXT,
  skill_name TEXT,
  outcome TEXT,                 -- success | failure | partial
  user_feedback TEXT,           -- positive | negative | neutral
  importance REAL DEFAULT 0.5,  -- 0-1，本次优化新增
  timestamp INTEGER NOT NULL
);

CREATE TABLE stm_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  source TEXT DEFAULT 'inferred',
  context TEXT,
  timestamp INTEGER NOT NULL
);

CREATE TABLE stm_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_at INTEGER,
  completed_at INTEGER,
  related_skill_id TEXT,
  created_at INTEGER NOT NULL
);
```

#### 3.2.2 重要性评分（Importance Scoring）

**计算维度**：

| 维度 | 规则 | 加分 |
|------|------|------|
| **类型** | preference_indicated | +0.20 |
| | task_created | +0.15 |
| | skill_invocation | +0.10 |
| | outcome=failure | +0.15 |
| **上下文** | isCorrection（用户纠正 AI） | +0.25 |
| | isComplexTask（消息 >200 字） | +0.15 |
| | isFirstTimeSkill（首次使用某技能） | +0.10 |
| | hasNegativeFeedback（负面反馈） | +0.20 |
| **内容启发式** | 包含 error/bug/fix/broken/failed | +0.10 |
| | 包含 urgent/asap/critical/important | +0.10 |
| | 消息长度 >500 字 | +0.05 |
| **基线** | 默认 | 0.50 |

**混合排序公式**（Context Builder 中使用）：

```typescript
blendedScore = importance * 0.6 + recencyScore * 0.4
```

- 60% 重要性 + 40% 时效性
- 取 Top 5 后，按时间重新排序（保证自然阅读顺序）
- 重要性 >0.7 的交互在上下文字符串中标注 🔸 标记

#### 3.2.3 为什么从 LRU 改为 SQLite？

| 方面 | 优化前（LRU） | 优化后（SQLite） |
|------|-------------|----------------|
| 持久化 | 无，服务器重启丢失 | **有，磁盘持久化** |
| 容量 | 10,000 条目 LRU | 受限于磁盘 |
| 查询 | 内存遍历 O(n) | **索引查询 O(log n)** |
| 多用户 | 共用一个 LRU | **隔离存储** |
| 备份 | 不支持 | 可直接复制 db 文件 |

### 3.3 Long-term Memory（长期记忆）

**作用域**：跨会话永久
**持久化**：文件 JSON（`workspace/memory/{userId}.json`）
**批量写入**：30 秒间隔，减少磁盘 I/O
**缓存**：LRU 缓存（1000 用户）

```typescript
interface LongTermMemory {
  userId: string;
  userProfile: UserProfile;           // 工作风格、技术栈、领域专长
  skillUsagePatterns: SkillUsage;     // 技能使用统计
  knowledgeGraph: KnowledgeGraph;     // 知识图谱（当前为空壳，待激活）
  projectHistory: Project[];          // 项目历史
  insights?: Array<{                 // 本次优化新增：背景审查提取的洞察
    content: string;
    source: string;
    timestamp: number;
  }>;
  lastUpdated: number;
  burnoutHistory?: BurnoutHistory;
}
```

#### 3.3.1 自动学习

**技术栈检测**：110+ 关键词正则，覆盖 11 个类别：
- languages: JavaScript, TypeScript, Python, Go, Rust...
- frameworks: React, Vue, Angular, Express, FastAPI...
- tools: Docker, Kubernetes, Git...
- databases: PostgreSQL, MySQL, MongoDB, Redis...
- platforms: AWS, Azure, GCP...
- cloud_products, storage, networking, ai_ml, security_products, delivery_ops

**领域专长推断**：12 个领域（frontend, backend, devops, ML, data-engineering...），基于交互内容关键词匹配。

**偏好学习**：从显式声明中提取（如"请简洁回答"→ response_length: concise）。

#### 3.3.2 背景审查 Agent（Background Review）—— 本次优化新增

**触发条件**：每 10 轮对话（fire-and-forget，不阻塞用户）
**执行流程**：
1. 收集最近对话轮次（userMessage + assistantContent）
2. 构建 extraction prompt，发送到 Gateway（临时 sessionId，不污染用户历史）
3. LLM 提取值得记忆的事实（格式："User ..." 声明式句子）
4. 去重后写入 Long-term Memory 的 `insights` 数组
5. 上限 50 条，FIFO

**示例提取结果**：
- "User prefers concise technical explanations over long-form documentation"
- "User is working on a Kubernetes migration project and frequently asks about ingress controllers"
- "User gets frustrated when AI uses overly formal language"

**解决的核心问题**：此前短期记忆每日清零、每日总结生成后不被使用，长期记忆只有静态画像。背景审查让"对话洞察"自动沉淀到长期记忆。

---

## 四、核心机制详解

### 4.1 冻结快照（Frozen Snapshot）

**问题**：优化前每次 API 调用都重新构建 Memory Context，导致：
1. 每次请求同步 I/O（读文件 + 查 SQLite）
2. User Message 前缀不断变化，LLM KV Cache 无法复用

**解决方案**：

```typescript
const sessionSystemPromptCache = new Map<string, {
  mode: string;
  systemPromptExtension: string;
}>();
```

**构建时机**：Session 首次对话时
**缓存内容**：Mode Prompt + Memory Snapshot（用户画像 + Top 5 交互 + 待办任务 + 常用技能）
**注入位置**：System Prompt（与硬编码基座 prompt 拼接）
**重建条件**：用户切换 Mode 时

**效果**：
- 同 Session 后续对话：零 I/O 构建上下文
- System Prompt 前缀稳定，Prefix Cache 命中率高
- KB Context 保留在 User Message 中（query-dependent，每次重新检索）

### 4.2 Context Builder 输出示例

```
[用户画像]
工作风格: friendly风格，偏好detailed回复
技术栈: JavaScript, TypeScript, React, Node.js, Docker
专业领域: frontend, backend, devops

[待办任务]
- 完成 K8s Ingress 配置文档 (high)
- Review PR #234 (medium)

[常用技能]
- code_generator (42次)
- docker_helper (18次)
- k8s_troubleshoot (12次)

[最近交互]
🔸 [chat] 帮我排查一下 ingress-nginx 的 502 错误
- [skill_invocation] Used skill: docker_helper
- [chat] 为什么 TypeScript 的泛型推断在这里失效了
```

---

## 五、与 OpenClaw 对比

### 5.1 OpenClaw 记忆系统概述

OpenClaw 采用**多层级混合存储**架构，核心特征：

| 组件 | 技术 | 用途 |
|------|------|------|
| **MEMORY.md** | Markdown 文件 | 长期人工编辑记忆 |
| **memory/YYYY-MM-DD.md** | Markdown 文件 | 每日原始日志 |
| **LCM (Lossless Context)** | SQLite + DAG | 无损会话历史 |
| **facts.db** | SQLite | 结构化事实（770+ 条）|
| **Continuity** | Vector (Nomic 768d) | 跨会话语义检索 |
| **LightRAG/GraphRAG** | PostgreSQL + pgvector | 深度领域知识 |
| **Metacognitive Pipeline** | LLM 驱动 | 自我学习循环 |

OpenClaw 的核心哲学是**"多语言持久化"（Polyglot Persistence）**：不同检索需求使用不同存储引擎。

### 5.2 对比矩阵

| 维度 | MineEcho v3.5 | OpenClaw |
|------|-----------|----------|
| **架构层级** | 3 层（Working → Short-term → Long-term） | 5+ 层（LCM → facts → continuity → GraphRAG → daily files） |
| **持久化引擎** | SQLite（短期）+ 文件 JSON（长期） | SQLite + PostgreSQL + 向量 DB + Markdown |
| **上下文注入** | **冻结快照**（System Prompt，Session 级缓存） | 每次请求动态组装（LCM DAG 遍历） |
| **重要性排序** | ✅ 显式 importance 评分 | 依赖向量相似度 + BM25 |
| **背景审查** | ✅ 每 10 轮触发 | ✅ Metabolism 每 5 分钟 + Contemplation |
| **语义检索** | ❌ 暂无 | ✅ Continuity（向量 ~7ms） |
| **会话搜索** | ❌ 暂无 | ✅ LCM FTS5 + 统一 memory_search 接口 |
| **知识图谱** | Schema 有，数据空 | ✅ LightRAG/GraphRAG 深度集成 |
| **自学习** | 技术栈/领域/偏好推断 | ✅ Metacognitive Pipeline（Metabolism→Gaps→Crystallization） |
| **部署复杂度** | **低**（单 SQLite 文件） | **高**（多 DB + 向量服务） |
| **可观测性** | 日志 + 文件直观可读 | 依赖工具查询（lcm_grep 等） |

### 5.3 MineEcho 相对 OpenClaw 的优势

1. **部署简单**：单节点 SQLite + 文件即可运行，无需 PostgreSQL/向量服务。OpenClaw 的完整架构需要 3+ 个存储服务。
2. **工程可控**：冻结快照机制让 System Prompt 前缀稳定，Prefix Cache 命中率高。OpenClaw 的动态 DAG 组装每次请求成本不可预测。
3. **职场场景深耕**：Burnout 检测、成长报告、职场风险兜底——这些是 OpenClaw 通用架构不关注的垂直场景。
4. **重要性显式建模**：OpenClaw 依赖向量相似度的"隐式"重要性，MineEcho 通过 calculateImportance() 显式建模（纠错+0.25、失败+0.15），更可解释、可调试。
5. **启动成本低**：300 行代码即可跑通记忆系统，OpenClaw 的 LCM 模块约 2000+ 行。

### 5.4 MineEcho 相对 OpenClaw 的劣势

1. **语义检索缺失**：OpenClaw 的 Continuity 层支持"上次那个数据库问题"的模糊召回，MineEcho 目前只能按时间/重要性排序。
2. **会话历史不可搜索**：OpenClaw 的 LCM 提供全量 FTS5 搜索，MineEcho 的聊天历史存储在 JSON 文件中，无索引。
3. **知识图谱未激活**：OpenClaw 的 GraphRAG 已深度集成，MineEcho 的 knowledgeGraph 字段为空。
4. **自学习闭环不完整**：OpenClaw 的 Metacognitive Pipeline 是持续运转的学习系统，MineEcho 的背景审查 Agent 是定期触发，频率和深度有限。

---

## 六、与 Hermes Agent 对比

### 6.1 Hermes Agent 记忆系统概述

Hermes 采用**双层架构**：

| 层级 | 形式 | 容量 | 特点 |
|------|------|------|------|
| **Built-in Memory** | Markdown 文件（MEMORY.md + USER.md） | ~800 / ~500 tokens | Agent-curated，bounded，文件级 |
| **External Provider** | 插件化（8 种 provider） | 不限 | 可插拔，故障隔离 |

**核心创新**：
- **冻结快照 + Live State 双轨**：System Prompt 捕获一次后不变，Tool Call 可写入但不立即更新 System Prompt
- **MemoryManager 编排层**：统一生命周期管理（initialize / prefetch / sync / shutdown）
- **Prefetch 模式**：每轮预取外部记忆，缓存复用
- **流式上下文清理器**：防止注入内容泄漏到 UI 输出
- **安全扫描**：写入前检测 prompt injection / 数据外泄

### 6.2 对比矩阵

| 维度 | MineEcho v3.5 | Hermes Agent |
|------|-----------|--------------|
| **架构层级** | 3 层 | 2 层（内置 + 外部插件） |
| **存储介质** | SQLite + 文件 JSON | 文件 Markdown + 插件化后端 |
| **记忆注入** | **System Prompt 冻结快照** | ✅ **System Prompt 冻结快照**（双方都采用） |
| **记忆策展** | 自动提取（技术栈/偏好/洞察） | **Agent-curated**（Agent 主动决定写什么） |
| **重要性权重** | ✅ 显式 calculateImportance() | 无（依赖 bounded 容量自然淘汰） |
| **背景审查** | ✅ 每 10 轮触发 | ✅ 每 N 轮触发（设计相似） |
| **安全扫描** | ❌ 暂无 | ✅ 写入前扫描 |
| **流式清理** | 正则 stripMemoryContext() | ✅ StreamingContextScrubber 状态机 |
| **记忆管理器** | 分散的 Manager 单例 | ✅ MemoryManager 统一编排层 |
| **外部插件** | ❌ 不支持 | ✅ 8 种 provider（Mem0/Honcho/Hindsight...） |
| **职场功能** | ✅ Burnout/成长报告/风险兜底 | ❌ 无 |

### 6.3 MineEcho 相对 Hermes 的优势

1. **自动学习能力强**：Hermes 依赖 Agent 主动调用 memory tool 来记录，MineEcho 自动从交互中推断技术栈、领域、偏好。对于企业用户，"零配置开箱即用"体验更好。
2. **职场场景深度**：Burnout 检测（40+ 压力关键词）、成长报告（里程碑 + 雷达图）、职场风险兜底（24 条规则）——这些是 Hermes 没有的垂直能力。
3. **短期记忆结构化**：Hermes 的 built-in memory 是 Markdown 文本，MineEcho 的短期记忆是结构化 SQLite（交互/偏好/任务分离），便于统计分析和查询。
4. **中文优化**：技术栈检测包含大量中文技术社区关键词；FTS5 trigram 已就绪（SQLite 层），CJK 搜索无压力。

### 6.4 MineEcho 相对 Hermes 的劣势

1. **Agent-curated vs Auto-curated**：Hermes 让 Agent 决定"什么值得记住"，质量可能更高；MineEcho 的自动推断可能引入噪声。
2. **安全扫描缺失**：Hermes 有完整的 injection/exfiltration/Unicode 扫描，MineEcho 目前无此层防御。
3. **MemoryManager 抽象缺失**：MineEcho 是分散的 Manager 单例，Hermes 的 MemoryManager 让多后端切换和生命周期管理更优雅。
4. **流式清理器精度**：Hermes 的 StreamingContextScrubber 是状态机，MineEcho 的正则方案在边界情况下可能漏删或误删。
5. **外部插件生态**：Hermes 支持 Mem0、Honcho、Hindsight 等 8 种 provider，MineEcho 目前无插件化能力。

---

## 七、技术实现清单

### 7.1 文件结构

```
apps/bff/src/memory/
├── types.ts                    # 全类型定义
├── index.ts                    # 统一导出
├── working-memory.ts           # 工作记忆管理（20消息/session）
├── short-term-memory.ts        # 短期记忆管理（SQLite 持久化）
├── memory-db.ts                # SQLite 数据库层（新增）
├── long-term-memory.ts         # 长期记忆管理（文件 JSON）
├── user-profile.ts             # 自动学习（技术栈/领域/偏好）
├── context-builder.ts          # 上下文构建（混合排序）
├── background-review.ts        # 背景审查 Agent（新增）
├── memory-closure.ts           # 每日总结/早晨提醒
├── burnout-detector.ts         # Burnout 检测
├── growth-report.ts            # 成长报告
└── report-scheduler.ts         # 报告调度器

apps/bff/src/routes/
├── chat.ts                     # 聊天路由（注入 + 学习）
├── memory.ts                   # 记忆 API
├── burnout.ts                  # Burnout API
└── growth-report.ts            # 成长报告 API
```

### 7.2 核心 API

| API | 路径 | 说明 |
|-----|------|------|
| 获取短期记忆 | `GET /api/memory/short-term` | 今日交互/偏好/任务 |
| 获取记忆历史 | `GET /api/memory/short-term/history?days=7` | 多日历史 |
| 导出记忆 | `GET /api/memory/export` | 全量导出（JSON） |
| 导入记忆 | `POST /api/memory/import` | 全量导入 |
| 记录任务 | `POST /api/memory/tasks` | 创建任务 |
| 完成任务 | `POST /api/memory/tasks/:id/complete` | 标记完成 |
| 获取画像 | `GET /api/memory/profile` | 用户画像 |
| 更新画像 | `POST /api/memory/profile` | 手动更新 |
| 获取技能模式 | `GET /api/memory/skill-patterns` | 技能使用统计 |
| Burnout 评估 | `POST /api/burnout/assess` | 风险评估 |
| 成长报告 | `GET /api/growth-report` | 雷达图 + 里程碑 |

### 7.3 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MAX_DAILY_INTERACTIONS` | 300 | 每日交互上限 |
| `MAX_MEMORY_CACHE_SIZE` | 1000 | 长期记忆 LRU 缓存大小 |
| `MINECHO_MEMORY_DIR` | `workspace/memory` | 长期记忆文件路径 |
| `ENABLE_BATCH_WRITE` | `true` | 异步批量写入 |
| `BATCH_WRITE_INTERVAL_MS` | 30000 | 批量写入间隔 |
| `ENABLE_MEMORY_CLOSURE` | `true` | 每日总结/提醒调度器 |
| `ENABLE_BURNOUT_DETECTION` | `false` | Burnout 检测开关 |
| `GROWTH_REPORT_ENABLED` | `true` | 成长报告开关 |
| `GROWTH_REPORT_AUTO_GENERATE` | `false` | 自动生成长报告 |

---

## 八、路线图

### 已完成的优化（2026-04-28）

- [x] **冻结快照**：Session 级 System Prompt 缓存
- [x] **SQLite 持久化**：短期记忆从 LRU 迁移到 SQLite
- [x] **重要性权重**：calculateImportance() + 混合排序
- [x] **背景审查 Agent**：每 10 轮自动提取洞察

### 下一阶段（P2，建议优先级）

- [ ] **安全扫描**：记忆写入前检测 prompt injection / 数据外泄
- [ ] **会话 FTS5 搜索**：聊天历史从 JSON 文件迁移到 SQLite FTS5
- [ ] **知识图谱激活**：基于 LightRAG 提取实体和关系
- [ ] **渐进式摘要**：Working Memory 20 条消息压缩为摘要
- [ ] **多用户调度器修复**：每日总结遍历所有用户（当前只处理 default-user）

### 长期方向

- [ ] **MemoryManager 编排层**：当需要支持多 provider（Qdrant/Mem0）时引入
- [ ] **语义检索**：基于 embedding 的相似度搜索
- [ ] **记忆可视化**：前端知识图谱展示

---

## 九、参考

- [Hermes Agent GitHub](https://github.com/NousResearch/hermes-agent)
- [OpenClaw Memory Documentation](https://docs.openclaw.ai/concepts/memory)
- [OpenClaw Memory Architecture Blog](https://milvus.io/blog/we-extracted-openclaws-memory-system-and-opensourced-it-memsearch.md)

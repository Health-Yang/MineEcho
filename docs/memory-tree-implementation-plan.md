# MineEcho 分层记忆系统实现方案

## 概述

基于分层 Memory Tree 架构，设计一个摘要记忆系统，与 MineEcho 现有的三层记忆架构整合。

## 现有架构

```
Working Memory (内存)
    ↓
Short-term Memory (SQLite - 每天)
    ↓
Long-term Memory (JSON文件 - 用户画像、知识图谱)
```

## 新架构

```
Working Memory (内存)
    ↓
Short-term Memory (SQLite - 每天)
    ↓
┌──────────────────────────────────────────────┐
│           Memory Tree (分层记忆树)               │
│  ┌────────────────────────────────────────┐  │
│  │  L0 Buffer (新内容缓冲, ≤3k token/chunk) │  │
│  │  - 对话片段                              │  │
│  │  - 文档摘录                              │  │
│  │  - 技能调用记录                           │  │
│  └──────────────┬─────────────────────────┘  │
│                 │ Bucket-Seal (token budget)  │
│                 ▼                            │
│  ┌────────────────────────────────────────┐  │
│  │  L1 Summaries (日摘要)                  │  │
│  │  - 每日结束时自动生成                      │  │
│  │  - 7个L0 → 1个L1                       │  │
│  └──────────────┬─────────────────────────┘  │
│                 │ Weekly Seal (7 L1s)        │
│                 ▼                            │
│  ┌────────────────────────────────────────┐  │
│  │  L2 Summaries (周摘要)                  │  │
│  │  - 每周结束时自动生成                      │  │
│  │  - 7个L1 → 1个L2                       │  │
│  └──────────────┬─────────────────────────┘  │
│                 │ Monthly Seal (4 L2s)       │
│                 ▼                            │
│  ┌────────────────────────────────────────┐  │
│  │  L3 Summaries (月摘要)                  │  │
│  │  - 每月结束时自动生成                      │  │
│  │  - 4个L2 → 1个L3                       │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
    ↓
Long-term Memory (JSON文件 - 用户画像、知识图谱)
```

## 文件结构

```
apps/bff/src/memory/
├── index.ts                    # 导出
├── types.ts                    # 现有类型
├── memory-db.ts              # 现有短期记忆
├── long-term-memory.ts        # 现有长期记忆
├── working-memory.ts          # 现有工作记忆
├──
├── memory-tree/              # 新增: 分层记忆树
│   ├── index.ts             # 导出
│   ├── types.ts             # 树类型定义
│   ├── tree-db.ts          # SQLite 表和操作
│   ├── content-store.ts    # Obsidian .md 文件存储
│   ├── summarizer.ts       # LLM 摘要生成
│   ├── tree-manager.ts     # 核心管理器
│   ├── entity-extractor.ts  # 实体提取
│   ├── recall.ts           # 记忆召回
│   └── routes.ts           # API 路由
```

## 数据库 Schema

### 1. L0 Buffer 表
```sql
CREATE TABLE memory_l0_buffer (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,           -- 'conversation', 'document', 'skill'
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  embedded_at INTEGER,            -- 嵌入时间
  entity_tags TEXT,              -- JSON array of entity tags
  source_ref TEXT,               -- 引用源 ID
  importance REAL DEFAULT 0.5
);
CREATE INDEX idx_l0_user_created ON memory_l0_buffer(user_id, created_at);
```

### 2. L1 日摘要表
```sql
CREATE TABLE memory_l1_summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,            -- YYYY-MM-DD
  summary TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  child_ids TEXT NOT NULL,       -- JSON array of L0 chunk IDs
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_l1_user_date ON memory_l1_summaries(user_id, date);
```

### 3. L2 周摘要表
```sql
CREATE TABLE memory_l2_summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  week_start TEXT NOT NULL,      -- YYYY-WXX
  summary TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  child_ids TEXT NOT NULL,       -- JSON array of L1 IDs
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_l2_user_week ON memory_l2_summaries(user_id, week_start);
```

### 4. L3 月摘要表
```sql
CREATE TABLE memory_l3_summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  month TEXT NOT NULL,           -- YYYY-MM
  summary TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  child_ids TEXT NOT NULL,       -- JSON array of L2 IDs
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_l3_user_month ON memory_l3_summaries(user_id, month);
```

### 5. 实体索引表
```sql
CREATE TABLE memory_entities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,            -- 'person', 'project', 'concept', 'technology'
  mentions INTEGER DEFAULT 1,
  last_seen INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_entity_user ON memory_entities(user_id);
```

### 6. 关系索引表
```sql
CREATE TABLE memory_relations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object_id TEXT NOT NULL,
  evidence TEXT,
  strength REAL DEFAULT 0.5,
  created_at INTEGER NOT NULL
);
```

## API 路由

### 1. 存储操作
- `POST /api/memory/tree/l0` - 添加 L0 缓冲
- `GET /api/memory/tree/l0` - 获取 L0 缓冲列表
- `DELETE /api/memory/tree/l0/:id` - 删除 L0 缓冲

### 2. 摘要操作
- `POST /api/memory/tree/l1/generate` - 生成日摘要
- `GET /api/memory/tree/l1/:date` - 获取日摘要
- `POST /api/memory/tree/l2/generate` - 生成周摘要
- `GET /api/memory/tree/l2/:week` - 获取周摘要

### 3. 召回操作
- `POST /api/memory/tree/recall` - 召回相关记忆
- `GET /api/memory/tree/recap` - 获取时间范围内摘要

### 4. 实体操作
- `GET /api/memory/tree/entities` - 获取实体列表
- `GET /api/memory/tree/entities/:id` - 获取实体详情
- `GET /api/memory/tree/graph` - 获取关系图谱

## Bucket-Seal 机制

### Token 预算配置
```typescript
const CONFIG = {
  // L0 配置
  L0_CHUNK_MAX_TOKENS: 3000,      // 每个 L0 chunk 最大 token 数
  L0_SUMMARY_THRESHOLD: 21000,      // 7 chunks * 3000 tokens

  // L1 配置
  L1_SUMMARY_TOKENS: 500,          // L1 摘要目标 token 数
  L1_CHILDREN_THRESHOLD: 7,         // 7 个 L0 合并为 1 个 L1

  // L2 配置
  L2_SUMMARY_TOKENS: 800,          // L2 摘要目标 token 数
  L2_CHILDREN_THRESHOLD: 7,        // 7 个 L1 合并为 1 个 L2

  // L3 配置
  L3_SUMMARY_TOKENS: 1000,        // L3 摘要目标 token 数
  L3_CHILDREN_THRESHOLD: 4,        // 4 个 L2 合并为 1 个 L3
};
```

### Seal 触发条件
1. **L0 → L1**: 当 L0 缓冲超过 7 个 chunks 或手动触发日末摘要
2. **L1 → L2**: 当存在 7 个连续的 L1 日摘要时
3. **L2 → L3**: 当存在 4 个连续的 L2 周摘要时

## Obsidian 兼容存储

### 文件结构
```
memory/
├── content/
│   ├── conversation/
│   │   ├── {date}/
│   │   │   └── {chunk-id}.md
│   ├── document/
│   │   └── {doc-id}.md
│   └── skill/
│       └── {skill-id}.md
├── summaries/
│   ├── l1/
│   │   └── {date}.md
│   ├── l2/
│   │   └── {week}.md
│   └── l3/
│       └── {month}.md
```

### Markdown 格式
```markdown
---
id: chunk-xxx
user_id: xxx
source: conversation
date: 2024-01-15
tags: [project-alpha, meeting]
importance: 0.8
---

对话内容摘要...
```

## 摘要生成

### LLM 摘要提示词
```typescript
const L1_SUMMARY_PROMPT = `你是 MineEcho 的记忆系统。请将以下对话片段总结成一个简洁的日摘要。

要求：
1. 保留关键决策、结论、待办事项
2. 提取重要的实体和关系
3. 摘要长度约 300-500 字
4. 使用中文

对话片段：
{content}

请生成摘要:`;
```

### Inert Summarizer (降级方案)
当 LLM 不可用时，使用简单的前 N 条 + 后 N 条拼接方案。

## 与对话集成

### 记忆召回流程
```
用户提问
    ↓
解析查询意图
    ↓
┌─────────────────────────────────────┐
│  1. 检查 Working Memory (最近对话)      │
│  2. 检查 Short-term Memory (今日)     │
│  3. 查询 Memory Tree (L0/L1/L2/L3)   │
│     - 向量相似度搜索                   │
│     - 按时间范围召回                   │
│  4. 检查 Long-term Memory (用户画像)   │
└─────────────────────────────────────┘
    ↓
组装上下文 → 发送给 LLM → 生成回复
```

### 上下文组装
```typescript
async function buildMemoryContext(
  userId: string,
  query: string,
  options: { maxTokens?: number; timeRange?: TimeRange }
): Promise<MemoryContext> {
  const context: MemoryContext = {
    workingMemory: [],    // 最近对话
    shortTermMemory: [], // 今日交互
    treeMemory: {
      l0: [],            // 相关 L0 chunks
      l1: [],            // 相关日摘要
      l2: [],            // 相关周摘要
      l3: [],            // 相关月摘要
    },
    longTermMemory: {},  // 用户画像
    entities: [],        // 提取的实体
  };

  // 1. 召回 L0/L1/L2/L3
  const treeResults = await recallTreeMemory(userId, query, options);

  // 2. 按 token 预算截断
  context.treeMemory = truncateToTokenBudget(treeResults, options.maxTokens || 4000);

  // 3. 填充其他上下文...

  return context;
}
```

## 实施计划

### Phase 1: 基础架构 (1-2天)
- [ ] 创建 memory-tree/ 目录结构
- [ ] 实现 tree-db.ts (SQLite 表)
- [ ] 实现 content-store.ts (Obsidian 存储)
- [ ] 实现 types.ts (类型定义)

### Phase 2: 核心功能 (2-3天)
- [ ] 实现 summarizer.ts (LLM 摘要)
- [ ] 实现 entity-extractor.ts (实体提取)
- [ ] 实现 tree-manager.ts (Bucket-Seal)
- [ ] 实现 recall.ts (记忆召回)

### Phase 3: API 集成 (1-2天)
- [ ] 实现 routes.ts (API 路由)
- [ ] 与现有 memory 系统整合
- [ ] 与对话上下文集成

### Phase 4: 前端集成 (1-2天)
- [ ] 更新 MemoryPage 显示记忆树
- [ ] 添加记忆检索 UI
- [ ] 添加实体/关系图谱可视化

## 注意事项

1. **Token 预算管理**: 需要仔细控制上下文大小，避免超出 LLM 限制
2. **LLM 调用成本**: 摘要生成需要调用 LLM，需要考虑成本和频率
3. **向后兼容**: 保持与现有记忆系统的兼容性
4. **性能**: L0 缓冲使用内存，持久化使用 SQLite
5. **错误处理**: LLM 不可用时的降级方案

# MineEcho 知识库系统技术原理文档

> 版本: v3.5 | 日期: 2026-04-28

---

## 1. 概述

MineEcho 知识库（内部代号 Wiki++）是一套面向个人和团队的**持久化知识管理系统**。它的设计哲学区别于传统的 RAG（检索增强生成）方案——后者让 LLM 每次从零重新发现知识，而 Wiki++ 强调**知识的积累与复利**：LLM 在整理阶段投入计算，构建结构化、交叉引用的 wiki 页面；查询时直接检索这些预编译的知识，实现更高质量、更稳定的回答。

**核心设计原则：**

- **raw/ 不可变层**：原始文件只读，是信任的源头
- **wiki/ 智能层**：LLM 拥有并维护，自动结构化、标签化、建立关联
- **四层混合检索**：向量 + BM25 + 结构化 + 知识图谱，互补覆盖不同查询场景
- **零外部依赖**：SQLite 统一承载向量、图谱、状态，离线可用

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (React + Ant Design)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ 文件树        │  │ 文档预览      │  │ 知识图谱可视化    │  │
│  │ (raw/wiki)   │  │ (Markdown)   │  │ (ReactFlow)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP API
┌────────────────────▼────────────────────────────────────────┐
│                    BFF (Express Router)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ routes.ts    │  │ search.ts    │  │ service.ts       │  │
│  │ (HTTP 接口层) │  │ (四层搜索)    │  │ (业务逻辑)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ indexer.ts   │  │ chunker.ts   │  │ entity-extractor │  │
│  │ (向量索引器)  │  │ (文档分块)    │  │ (图谱实体提取)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ vector-store │  │ graph-store  │  │ extractors.ts    │  │
│  │ (sqlite-vec) │  │ (SQLite)     │  │ (格式解析)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    存储层                                     │
│  raw/          wiki/          SQLite 数据库      配置密钥     │
│  (原始文件)     (AI 生成页面)   (向量/图谱/状态)   (openclaw)  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
knowledge/                              # 默认路径: ~/Library/Application Support/MineEcho/knowledge/
├── claude.md           # Wiki 系统提示词/宣言，指导 LLM 如何维护 wiki
├── log.md              # 只追加的活动日志
├── raw/                # 原始文件（用户上传、URL 导入），只读
│   ├── 培训材料.pdf
│   ├── 技术规范.docx
│   └── ...
└── wiki/               # LLM 生成的结构化页面
    ├── index.md        # 内容目录（自动维护）
    ├── concepts/       # 概念/方法论
    ├── entities/       # 实体（产品、公司、人名）
    ├── sources/        # 文档摘要
    ├── comparisons/    # 对比分析
    └── syntheses/      # 主题综合
```

### 2.3 关键文件职责

| 文件 | 路径 | 职责 |
|------|------|------|
| `routes.ts` | `apps/bff/src/knowledge-base/` | HTTP 路由：上传、导入、整理、搜索、图谱、状态查询 |
| `service.ts` | `apps/bff/src/knowledge-base/` | 核心业务：AI 整理、KB 上下文构建、目录树生成 |
| `search.ts` | `apps/bff/src/knowledge-base/` | **四层混合搜索**：BM25、结构化、向量、图谱通道 + RRF 融合 |
| `indexer.ts` | `apps/bff/src/knowledge-base/` | 异步索引引擎：任务队列、分块→嵌入→存储 |
| `chunker.ts` | `apps/bff/src/knowledge-base/` | 文档分块：frontmatter 解析、H2 分割、自动标签推断 |
| `embedding.ts` | `apps/bff/src/knowledge-base/` | 嵌入提供器抽象：MiniMax/阿里云/智谱，自动加载 API Key |
| `vector-store.ts` | `apps/bff/src/knowledge-base/` | SQLite 向量存储：`sqlite-vec` 扩展 KNN 搜索 |
| `graph-store.ts` | `apps/bff/src/knowledge-base/` | 图数据库：节点 + 边表、BFS 邻居遍历 |
| `graph.ts` | `apps/bff/src/knowledge-base/` | 图谱构建器：解析 wiki 链接、社区检测、合并 LLM 提取实体 |
| `entity-extractor.ts` | `apps/bff/src/knowledge-base/` | LLM 驱动的实体/关系提取，后台异步执行 |
| `extractors.ts` | `apps/bff/src/knowledge-base/` | 多格式文件解析：PDF、DOCX、XLSX、PPTX、HTML |

---

## 3. 数据流

### 3.1 文件摄入流程

```
用户上传文件
    ↓
保存到 raw/ 目录
    ↓
extractors.ts 提取纯文本（支持 7 种格式）
    ↓
chunker.ts 分块（frontmatter → H2 分割 → 段落分割 → 句子分割）
    ↓
indexer.ts 异步索引任务
    ├─→ embedding.ts 获取向量嵌入
    ├─→ vector-store.ts 存入 sqlite-vec
    └─→ entity-extractor.ts 触发实体提取（后台）
            ↓
        graph-store.ts 存储实体/关系
```

### 3.2 查询流程（聊天场景）

```
用户发送消息（开启"知识库"开关）
    ↓
ChatContext.tsx / useChatStream.ts 发送 { useKb: true }
    ↓
POST /api/chat/send-stream
    ↓
routes/chat.ts → buildUserMessage()
    ↓
service.ts → buildKbContext(query)
    ├─→ search.ts → hybridSearch(query)    [四层搜索]
    │       ├─→ vectorSearch()              [sqlite-vec KNN]
    │       ├─→ bm25Search()                [中文 n-gram + 英文分词]
    │       ├─→ structuredSearch()          [type/tag/title 匹配]
    │       ├─→ graphChannelSearch()        [实体匹配 + 邻居遍历]
    │       └─→ reciprocalRankFusion()      [RRF 融合排序]
    │
    └─→ buildExpandedKbContext(results)     [Wiki 链接图遍历扩展]
            ↓
    注入到 LLM 消息:
    [知识库上下文 - 基于4层混合检索（向量+BM25+结构化+图谱）生成...]
    ...知识片段...
    [知识库上下文结束]
```

### 3.3 AI 整理流程

```
用户在 raw/ 文件上点击"AI 整理"
    ↓
service.ts → organizeFile()
    ├─→ 小文件 (<15K 字符): 单轮 LLM 直接生成 wiki 页面
    └─→ 大文件 (>15K 字符): 三阶段处理
            Phase 1: 大纲分析（确定关键章节、跳过附录）
            Phase 2: 逐块提取（concepts/entities/facts/relationships）
            Phase 3: 综合生成（去重 + 排序 + 生成最终 wiki 页面）
    ↓
写入 wiki/{concepts,entities,sources,...}/
    ↓
更新 wiki/index.md 和 log.md
    ↓
触发向量索引（异步）
    ↓
持久化整理状态到 SQLite
```

---

## 4. 四层混合搜索系统

这是知识库的核心检索引擎，位于 `apps/bff/src/knowledge-base/search.ts`。四个通道独立运行，结果通过 **Reciprocal Rank Fusion (RRF)** 融合，取 Top-5 返回。

### 4.1 第一层：向量搜索（语义相似度）

**原理**：将查询文本和文档块都转换为高维向量，通过余弦相似度找到语义最接近的片段。

**实现**：
- 嵌入模型：MiniMax `embo-01` (1536维)、阿里云 `text-embedding-v3` (1024维)、智谱 `embedding-3` (2048维)
- 向量存储：`sqlite-vec` 扩展提供原生 KNN 搜索，距离度量使用 `cosine`
- 搜索语法：`SELECT chunk_id, distance FROM vec_table WHERE embedding MATCH ? AND k = ?`
- 距离转相似度：`score = 1 - distance`

**回退机制**：如果 `sqlite-vec` 扩展不可用，自动降级为手动余弦相似度全表扫描（O(n)）。

### 4.2 第二层：BM25 关键词搜索

**原理**：经典的概率检索模型，根据词项在文档中的频率（TF）和逆文档频率（IDF）计算相关性。

**中文处理创新**：
- **中文 n-gram 分词**：将连续 CJK 字符拆分为 2-6 字长度的滑动窗口
  - 例："知识库管理" → "知识"、"识库"、"库管"、"管理"、"知识库"、"识库管"、"库管理"...
- **英文分词**：提取 3+ 字母的英文单词
- **停用词过滤**：过滤"的"、"了"、"在"等高频无意义词

**参数**：k1=1.5, b=0.75（标准 Okapi BM25）

**Frontmatter 加分项**：
- 标签匹配：+10
- 标题匹配：+5
- 文件名匹配：+5

### 4.3 第三层：结构化搜索

**原理**：利用 wiki 页面的结构化元数据（type、tags、title）进行匹配，适合"意图明确"的查询。

**类型提示映射**：
| 查询关键词 | 匹配类型 |
|-----------|---------|
| "概念" | concept |
| "实体" | entity |
| "来源" | source |

**评分规则**：
- 类型匹配：+15
- 标签匹配（每个）：+8
- 标题匹配（每个词）：+6
- 文件名匹配：+4
- 章节标题匹配：+3

### 4.4 第四层：知识图谱通道

**原理**：将查询词与图谱中的实体节点匹配，通过邻居遍历发现"相关但关键词不匹配"的文档。

**流程**：
1. 提取查询词 → 在图谱节点中查找标签匹配
2. BFS 邻居遍历（1 跳全量 + 2 跳轻量）
3. 收集相关文件集合
4. 在这些文件上执行 BM25 搜索
5. **1.5x 分数加成**（图谱发现的内容有额外权重）

**意义**：解决"同义词"和"语义关联"问题。例如查询"网关内嵌BFF"，图谱可能通过 `MineEcho` 实体节点关联到 `流式输出` 文档，因为两者在图谱中有边相连。

### 4.5 RRF 融合排序

**公式**：

```
RRF_score(d) = Σ(1 / (k + rank_i(d) + 1))
```

其中 k=60，rank_i(d) 是文档 d 在第 i 个通道中的排名。

**特点**：
- 不需要归一化不同通道的分数（因为用的是排名而非原始分数）
- 对某个通道的 Top 结果给予更高权重
- 多通道共同推荐的结果会排名更靠前

---

## 5. 文档分块系统

分块质量直接影响检索效果。系统采用**三级 fallback 策略**，优先保持语义完整性。

### 5.1 分块流程

```
原始 Markdown
    ↓
[1] 按 H2 (##) 标题分割 → 章节
    ↓
[2] 章节长度 ≤ 4000 字符？
    ├─→ 是：作为一个 chunk
    └─→ 否：按段落分割（\n\n 分隔）
            ↓
        [3] 段落长度 ≤ 4000 字符？
            ├─→ 是：作为一个 chunk
            └─→ 否：按句子分割（。！？.!?）
```

### 5.2 元数据提取

每个 chunk 携带丰富的元数据：

```typescript
interface Chunk {
  id: string;              // "{fileHash}#{index}"
  content: string;
  metadata: {
    title: string;         // frontmatter 或 H1 或文件名
    type: string;          // concept | entity | source | comparison | synthesis
    tags: string[];        // 预设关键词 + 动态提取
    heading?: string;      // 所属 H2 标题
    filePath: string;
    index: number;
  };
}
```

### 5.3 自动标签推断

chunker.ts 实现了三层标签推断：

1. **硬编码关键词映射**（20 个常用技术词）
   - `api` → "API", `数据库` → "数据库", `docker` → "Docker", `llm` → "LLM" 等

2. **英文技术术语频率提取**
   - 匹配 PascalCase / ALL_CAPS 单词
   - 出现 2+ 次的取前 3 个

3. **中文复合词频率提取**
   - 4-8 字长度的 n-gram
   - 出现 3+ 次的取前 2 个

---

## 6. 知识图谱系统

### 6.1 数据模型

```sql
-- 节点表
CREATE TABLE kb_graph_nodes (
  id TEXT PRIMARY KEY,
  label TEXT,           -- 显示名称
  type TEXT,            -- concept | entity | topic | source | document | tag
  description TEXT,
  source_file TEXT,     -- 来源文件
  importance INTEGER,   -- 重要性 10-100
  created_at INTEGER
);

-- 边表
CREATE TABLE kb_graph_edges (
  source TEXT,
  target TEXT,
  relation TEXT,        -- relates_to | contains | part_of | tag_of | mentions | ...
  strength INTEGER,     -- 强度 1-10
  created_at INTEGER,
  PRIMARY KEY (source, target, relation)
);
```

### 6.2 图谱构建

图谱数据来自两个来源的**合并**：

**来源 1：结构化图谱（从 wiki 文件解析）**
- 每个 `.md` 文件 → document 节点
- `tags: [a, b]` → tag 节点 + `tag_of` 边
- `[[PageName]]` 内部链接 → `relates_to` 边（支持 `[[alias|display]]` 语法）
- 共同标签的文档 → "related" 边（strength = 共享标签数）

**来源 2：语义图谱（LLM 提取）**
- entity-extractor.ts 后台异步分析文档内容
- LLM 提取实体（concept/entity/fact）和它们之间的关系
- 去重后写入 graph-store

### 6.3 社区检测

使用 BFS 连通分量算法检测社区：
1. 构建无向图（忽略边的方向）
2. 排除 tag 节点之间的边（防止 tag 把不同社区粘在一起）
3. 每个连通分量 = 一个社区
4. 社区标签 = 度数最高的非 tag 节点
5. 社区颜色：后端统一生成调色板，前端直接使用

### 6.4 前端可视化

`KnowledgeGraphView.tsx` 实现了自定义力导向布局：

- **斥力**：O(n²) 计算，每对节点间有排斥力
- **引力**：边连接的节点间有弹簧引力
- **社区引力**：同一社区的节点额外吸引
- **中心引力**：防止整体漂移
- **碰撞检测**：节点不重叠

**性能优化**：
- >500 节点时自动裁剪低度节点（保留 top 60%）
- 每 50 次迭代 yield 一次，避免阻塞 UI
- 节点大小：`minSize + sqrt(importance/100) * 50`（面积感知）
- 搜索高亮：非匹配节点 + 邻居保持亮度，其余变暗

---

## 7. AI 整理功能

### 7.1 设计目标

将非结构化的原始文件（PDF、网页、笔记）转换为结构化的 wiki 页面体系，实现：
- **信息结构化**：提取核心概念、实体、事实
- **交叉引用**：自动建立 `[[wiki链接]]`
- **持久化积累**：后续文件可以引用和补充已有知识

### 7.2 小文件模式（单轮生成）

适用于 <15,000 字符的文件：

1. 读取 raw 内容 + claude.md（系统提示）+ index.md（已有目录）
2. 构建整理提示词，要求 LLM 生成多个 wiki 页面
3. LLM 输出格式：
   ```
   === FILE: wiki/sources/xxx.md ===
   ---
   title: "xxx"
   type: source
   tags: [xxx]
   ---
   # xxx
   ...
   === END FILE ===
   ```
4. 解析输出，写入对应目录

### 7.3 大文件模式（三阶段处理）

适用于 >15,000 字符的文件：

**Phase 1: 大纲分析**
- LLM 分析文档结构，确定关键章节和可跳过的附录

**Phase 2: 逐块提取**
- 将文档分割为最多 20 个 chunk（每块 ≤6000 字符，不跨越标题边界）
- 每块独立调用 LLM 提取：章节摘要、概念列表、实体列表、事实列表、关系列表
- 失败自动重试一次

**Phase 3: 综合生成**
- 聚合所有提取结果，去重（保留最高重要性）
- 构建综合提示词
- LLM 生成最终的 wiki 页面体系

### 7.4 后处理

1. 删除旧的 auto-imported 来源页面（避免重复）
2. 写入新页面到 wiki/ 各子目录
3. 更新 wiki/index.md（自动插入新页面链接）
4. 追加操作记录到 log.md
5. 触发向量索引（异步）
6. 持久化整理状态到 `lightrag-index-status.db`

---

## 8. 配置与环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MINECHO_KB_BASE_PATH` | 知识库根目录覆盖 | `~/Library/Application Support/MineEcho/knowledge` |
| `MINIMAX_API_KEY` | MiniMax 嵌入 API Key | 从 `openclaw.json` 读取 |
| `DASHSCOPE_API_KEY` | 阿里云嵌入 API Key | 从 `openclaw.json` 读取 |
| `ZHIPU_API_KEY` | 智谱嵌入 API Key | 从 `openclaw.json` 读取 |
| `LIGHTRAG_URL` | LightRAG Python 服务地址 | `http://localhost:3090` |

**API Key 加载优先级**：环境变量 > `openclaw.json` 配置。BFF 启动时会自动从 `~/.openclaw/openclaw.json` 或 `~/.openclaw/.openclaw/openclaw.json` 中读取 LLM 配置并复用为嵌入密钥。

---

## 9. 关键设计决策

### 9.1 为什么选择 SQLite 而非专用向量数据库？

**决策**：使用 `node:sqlite` (Node 22+) + `sqlite-vec` 扩展替代 Pinecone/Milvus/Qdrant。

**理由**：
- 零外部服务依赖，单机离线可用
- 向量、图谱、状态三库合一，部署极简
- 181 chunks 场景下 KNN 查询 < 100ms，性能完全够用
- 数据存储在用户本地，隐私安全

### 9.2 为什么采用 raw/wiki 双层存储？

**决策**：不直接对 raw 文件做 RAG，而是让 LLM 生成 wiki 页面。

**理由**（引自 claude.md）：
> "RAG 方案的问题是 LLM 每次都要从零重新发现知识，没有知识积累。Wiki 层让 LLM 做一次性的深度整理工作，后续查询直接检索这些预编译的知识。"

- raw 层保留原始证据，确保可追溯
- wiki 层实现知识复利：新文件可以引用和扩展已有概念
- LLM 在整理阶段有充足 token 做深度分析，而非查询时的匆忙检索

### 9.3 为什么使用自定义力导向布局而非 d3-force？

**决策**：在 `KnowledgeGraphView.tsx` 中手写力导向算法，而非引入 d3-force。

**理由**：
- 完全控制性能：可以按节点数量动态调整迭代次数、跳过策略
- 社区引力、中心引力等自定义力容易实现
- 避免 d3 依赖增加 bundle 体积
- 确定性的随机种子（seed=42）避免 hydration 不匹配

---

## 10. 性能基准

基于实际 KB 数据（181 chunks，27 个 wiki 页面）的测试：

| 指标 | 数值 |
|------|------|
| 混合搜索平均耗时 | 500-800ms |
| sqlite-vec KNN 查询 | < 50ms |
| BM25 全量扫描 | < 20ms |
| 图谱通道 | < 30ms |
| 缓存加载（181 chunks）| < 100ms |
| 前端图谱渲染（54 节点）| 60fps |

---

## 11. 已知限制与未来优化

| 限制 | 说明 | 优化方向 |
|------|------|---------|
| sqlite-vec 扩展依赖 | 需要正确加载 `.dylib`/`.so` 动态库 | 已在代码中实现自动回退到手动余弦扫描 |
| 向量表历史数据迁移 | 旧版本 `isVecTableAvailable()` bug 导致 vec 表为空 | 已修复代码 + 手动迁移脚本 |
| 大图谱布局性能 | >500 节点时 O(n²) 斥力计算变重 | 已实现节点裁剪 + 迭代跳过优化 |
| Embedding 提供商限制 | 国内模型需单独申请 API Key | 支持三家提供商，自动回退 |
| 中文分词精度 | n-gram 是词袋模型，无词义理解 | 语义由向量搜索层补充 |

---

*文档结束。如有技术问题，请查阅对应源码文件或联系开发团队。*

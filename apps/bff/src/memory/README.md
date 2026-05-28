# MineEcho Memory System

AI Companion 三层记忆系统，为用户提供个性化体验。

## 架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory System                            │
├─────────────────────────────────────────────────────────────┤
│  Working Memory    │  Short-term Memory   │  Long-term Memory│
│  (工作记忆)         │  (短期记忆)           │  (长期记忆)       │
├─────────────────────────────────────────────────────────────┤
│  • 当前会话         │  • 当日交互记录       │  • 用户画像       │
│  • 最近20条消息     │  • 今日学习偏好       │  • 技能使用模式   │
│  • 活跃技能         │  • 待办任务           │  • 知识图谱       │
│  • 当前上下文       │  • 日终重置           │  • 项目历史       │
├─────────────────────────────────────────────────────────────┤
│  In-memory only    │  localStorage         │  File-based      │
│  Session lifetime  │  Daily TTL            │  Persistent      │
└─────────────────────────────────────────────────────────────┘
```

## API 端点

### 用户画像

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/profile` | 获取用户画像 |
| POST | `/api/memory/profile` | 更新用户画像 |
| PUT | `/api/memory/profile/work-style` | 更新工作风格 |
| POST | `/api/memory/profile/technical-skill` | 添加技术技能 |
| POST | `/api/memory/profile/shortcut` | 添加自定义快捷方式 |

### 短期记忆

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/short-term` | 获取今日记忆 |
| GET | `/api/memory/short-term/history` | 获取历史记忆 |
| POST | `/api/memory/short-term/interaction` | 记录交互 |
| POST | `/api/memory/short-term/task` | 添加任务 |
| PUT | `/api/memory/short-term/task/:taskId` | 更新任务 |
| POST | `/api/memory/short-term/task/:taskId/complete` | 完成任务 |
| GET | `/api/memory/short-term/tasks/pending` | 获取待办任务 |
| DELETE | `/api/memory/short-term` | 清除记忆 |

### 技能模式

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/skill-patterns` | 获取技能使用模式 |
| POST | `/api/memory/skill-usage` | 记录技能使用 |

### 知识图谱

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/knowledge-graph` | 获取知识图谱 |
| GET | `/api/memory/knowledge-graph/search` | 搜索知识节点 |

### 项目历史

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/projects` | 获取所有项目 |
| GET | `/api/memory/projects/active` | 获取活跃项目 |
| POST | `/api/memory/projects` | 添加项目 |
| PUT | `/api/memory/projects/:projectId` | 更新项目 |

### 学习

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/memory/learn` | 提交学习数据 |

### 导入/导出

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/export` | 导出所有记忆 |
| POST | `/api/memory/import` | 导入记忆 |
| DELETE | `/api/memory/all` | 删除所有记忆 |

## 使用示例

### 获取用户画像

```typescript
const response = await fetch('/api/memory/profile');
const { profile, suggestions } = await response.json();
```

### 记录技能使用

```typescript
await fetch('/api/memory/skill-usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    skillId: 'code-review',
    skillName: '代码审查',
    success: true
  })
});
```

### 提交反馈学习

```typescript
await fetch('/api/memory/learn', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      type: 'feedback',
      category: 'response_length',
      content: 'This response was too long, please be more concise',
      timestamp: Date.now()
    }
  })
});
```

### 添加任务

```typescript
await fetch('/api/memory/short-term/task', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Review PR #123',
    priority: 'high',
    dueAt: Date.now() + 24 * 60 * 60 * 1000
  })
});
```

## 自动学习

系统会自动从以下场景学习：

1. **技术栈检测** - 从对话中识别用户使用的编程语言、框架、工具
2. **领域专长** - 分析对话主题识别用户的专业领域
3. **工作风格** - 从用户反馈学习响应长度、沟通语气偏好
4. **技能模式** - 记录技能使用频率、时间分布、成功率
5. **生产力时段** - 分析活跃时间识别高效工作时段

## 数据存储

| 层级 | 存储位置 | 持久化 | 生命周期 |
|------|----------|--------|----------|
| Working Memory | 内存 | 否 | 会话期间 |
| Short-term Memory | 内存 + API | 可选 | 当日 |
| Long-term Memory | `/app/workspace/memory/{userId}.json` | 是 | 永久 |

## 配置文件

环境变量：

```bash
# 记忆存储目录
MINEECHO_MEMORY_DIR=/app/workspace/memory
```

# MineEcho 风险兜底提醒系统

## 概述

风险兜底提醒系统是 MineEcho 的智能辅助功能，基于用户的历史项目经验和知识图谱，在用户咨询技术方案时主动识别潜在风险并提醒。

## 核心特性

- **异步检测**：不阻塞现有 chat 流程
- **记忆驱动**：从用户历史项目（LongTermMemory）和日常交互（ShortTermMemory）中提取风险知识
- **自然提醒**：在 chat 回复中自然插入风险提示，不阻断对话
- **可配置**：支持开启/关闭、调整敏感度、选择风险类别

## 风险检测触发点

1. **关键词触发**：
   - 割接/上线类："割接"、"上线"、"发布"、"变更"、"窗口期"
   - 数据迁移类："数据迁移"、"数据库迁移"、"同步"、"DDL"
   - 核心变更类："核心系统"、"基础架构"、"配置中心"
   - 架构设计类："方案设计"、"架构设计"、"高可用"
   - 安全类："安全"、"漏洞"、"权限"
   - 兼容性类："兼容性"、"升级"、"接口变更"

2. **敏感操作检测**：
   - `DELETE FROM`、`DROP TABLE`、`TRUNCATE TABLE`
   - `UPDATE ... WHERE 1=1`
   - `rm -rf`
   - `GRANT ALL`、`REVOKE ALL`

3. **方案设计场景**：
   - 检测到用户正在准备方案设计
   - 涉及架构评审、技术选型讨论

## 风险知识来源

### 1. 用户历史项目（projectHistory）
- 从项目描述中提取风险关键词
- 从项目成果（keyOutcomes）中识别问题

### 2. 日常交互记录（dailyInteractions）
- 从 outcome="failure" 的交互中提取失败经验
- 识别问题报告类交互

### 3. 系统兜底知识库
当用户没有相关历史经验时，使用系统预置的常见风险知识作为兜底。

## API 接口

### 获取配置
```
GET /api/risk/config
```

### 更新配置
```
PUT /api/risk/config
{
  "enabled": true,
  "minConfidence": 0.5,
  "maxAlertsPerSession": 3,
  "categories": ["cutover", "data_migration", "core_change"]
}
```

### 获取风险知识库
```
GET /api/risk/knowledge
GET /api/risk/knowledge?category=cutover
```

### 刷新风险知识库
```
POST /api/risk/refresh
```
从用户历史项目记忆中重新提取风险知识。

### 获取统计信息
```
GET /api/risk/stats
```

### 测试风险检测
```
POST /api/risk/test
{
  "text": "我们要做数据库割接，需要迁移数据"
}
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enabled | boolean | true | 是否启用风险提醒 |
| minConfidence | number | 0.5 | 最小置信度（0-1），低于此值不提醒 |
| maxAlertsPerSession | number | 3 | 每会话最大提醒次数 |
| categories | string[] | ["cutover", "data_migration", "core_change", "security"] | 启用的风险类别 |

## 风险类别

- `cutover`: 割接上线
- `data_migration`: 数据迁移
- `core_change`: 核心变更
- `architecture`: 架构设计
- `security`: 安全
- `performance`: 性能
- `compatibility`: 兼容性

## 向后兼容策略

1. **不阻塞主流程**：风险检测使用 `setImmediate` 异步执行
2. **不修改 API 响应格式**：风险提醒以自然语言形式附加在 assistant 回复末尾
3. **可配置关闭**：用户可以通过 API 完全关闭风险提醒功能
4. **失败静默**：风险检测失败不会影响正常 chat 流程

## 提醒格式示例

```
🟠 割接上线风险提示 【基于你的历史项目】

检测到你在讨论割接上线相关话题。根据你过往的项目经验，这里有一些需要注意的风险点：

1. **割接窗口期风险**：割接操作需要在维护窗口期内完成，超时可能导致业务影响
2. **回滚方案缺失风险**：没有准备回滚方案可能导致故障恢复时间延长

建议措施：
• 精确估算操作时间
• 准备自动化脚本
• 制定详细回滚步骤

💡 此提醒基于你的历史项目经验
```

## 文件结构

```
src/risk/
├── types.ts           # 类型定义
├── detector.ts        # 风险检测引擎
├── knowledge-base.ts  # 风险知识库管理
├── alert-generator.ts # 提醒生成器
├── detection-service.ts # 异步检测服务
├── index.ts           # 模块导出
└── README.md          # 本文档
```

## 集成点

风险提醒系统已集成到以下 chat 路由：
- `POST /api/chat/send` - 普通发送
- `POST /api/chat/send-stream` - 流式发送

风险检测在收到用户消息后异步执行，在 AI 回复完成后将提醒内容附加到回复末尾。

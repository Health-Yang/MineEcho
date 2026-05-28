# MineEcho 职场关系智能系统

## 概述

职场关系智能系统用于识别用户咨询中的职场敏感场景，并给出超越技术层面的职场建议。

## 核心功能

### 1. 敏感场景识别

系统识别四类敏感场景：

#### 数据安全/合规类 (data_security)
- **customer_data_exposure**: 客户数据泄露风险
- **production_data_access**: 生产环境数据操作
- **credential_exposure**: 密钥/密码泄露
- **compliance_violation**: 合规违规
- **unauthorized_access**: 未授权访问
- **data_residency**: 数据跨境传输

#### 责任边界类 (responsibility)
- **solo_high_risk_operation**: 独自承担高风险操作
- **bypassing_process**: 绕过流程
- **verbal_agreement**: 口头承诺无留痕
- **taking_blame**: 替他人背锅
- **off_hours_operation**: 非工作时间操作
- **unclear_requirement**: 需求不明确

#### 人际关系类 (interpersonal)
- **cross_department_conflict**: 跨部门协作冲突
- **unreasonable_demand**: 不合理需求
- **credit_taking**: 功劳被抢
- **being_excluded**: 被排除在决策外
- **peer_competition**: 同事竞争
- **manager_conflict**: 与上级冲突

#### 职业发展类 (career_development)
- **job_hopping_consideration**: 跳槽考虑
- **promotion_preparation**: 晋升准备
- **skill_growth**: 技能成长困惑
- **work_life_balance**: 工作生活平衡
- **salary_negotiation**: 薪资谈判
- **performance_review**: 绩效评估争议

### 2. 建议生成

基于检测到的场景类型，系统匹配相应的建议模板：
- 温和、非评判性语气
- 明确标记为"职场建议"
- 提供可操作的步骤
- 考虑用户角色（初级/中级/高级工程师）

## 技术实现

### 文件结构

```
workplace-intelligence/
├── types.ts              # 类型定义
├── detection-rules.ts    # 检测规则库
├── advice-templates.ts   # 建议模板库
├── detector.ts           # 场景检测器
├── integration.ts        # 与 Chat 流程集成
├── index.ts              # 模块导出
└── README.md             # 本文档
```

### 检测机制

1. **关键词匹配**：基于预定义的关键词规则
2. **置信度计算**：根据匹配程度计算置信度
3. **冷却机制**：同类型场景5分钟内不重复触发
4. **本地执行**：无需调用外部 AI，性能开销极低

### 集成点

系统在 Chat 流程的两个位置集成：

1. **消息接收时**：检测敏感场景
2. **响应返回时**：将建议附加到 AI 响应

## 配置

### 环境变量

```bash
# 全局开关（默认开启）
WORKPLACE_INTELLIGENCE_ENABLED=true

# 建议插入位置：before | after | separate（默认 after）
WORKPLACE_INTELLIGENCE_POSITION=after

# 最大建议长度（默认 500）
WORKPLACE_INTELLIGENCE_MAX_LENGTH=500

# 只在流式响应中附加建议（默认 false）
WORKPLACE_INTELLIGENCE_STREAM_ONLY=false

# 最小严重级别阈值：low | medium | high | critical（默认 medium）
WORKPLACE_INTELLIGENCE_MIN_SEVERITY=medium
```

### API 接口

#### 获取系统状态
```http
GET /api/chat/workplace-intelligence/status
```

响应示例：
```json
{
  "enabled": true,
  "config": {
    "enabled": true,
    "insertPosition": "after",
    "maxAdviceLength": 500,
    "streamOnly": false,
    "minSeverityLevel": "medium"
  },
  "detectorStats": {
    "rulesCount": 24,
    "enabled": true,
    "cooldownEntries": 0
  },
  "message": "职场关系智能系统用于识别敏感场景并提供职场建议"
}
```

#### 更新配置
```http
POST /api/chat/workplace-intelligence/config
Content-Type: application/json

{
  "enabled": true,
  "insertPosition": "after",
  "maxAdviceLength": 500,
  "minSeverityLevel": "medium"
}
```

## 向后兼容策略

1. **不修改响应格式**：建议以文本形式附加到 AI 响应，不改变 API 结构
2. **可配置关闭**：通过环境变量或 API 完全禁用
3. **失败安全**：检测失败不影响主 Chat 流程
4. **性能优先**：本地检测，无外部依赖，平均处理时间 < 5ms

## 使用示例

### 示例 1：数据安全场景

用户输入：
```
我直接把客户数据库导出到本地分析了，应该没问题吧？
```

系统响应（附加职场建议）：
```
[AI 技术回答]

---

💡 **职场建议：生产数据操作规范**

直接操作生产环境数据是高风险行为。建议：
1. 确认是否有审批流程，补齐相关手续
2. 操作前在测试环境验证脚本
3. 双人复核，保留完整操作记录
4. 如有疑虑，请寻求资深同事协助

宁可慢一步，不要错一步。
```

### 示例 2：职业发展场景

用户输入：
```
最近拿到了一个 offer，薪资涨了 30%，但是担心跳槽太频繁影响简历
```

系统响应（附加职场建议）：
```
[AI 技术回答]

---

💡 **职场建议：跳槽决策框架**

考虑跳槽是职业发展的重要时刻。建议：
1. 列出留下和离开的 pros/cons
2. 评估当前公司是否还有成长空间
3. 了解市场行情，明确自己的价值
4. 如果决定离开，做好交接，保持职业声誉

跳槽是手段，不是目的。
```

## 扩展开发

### 添加新的检测规则

在 `detection-rules.ts` 中添加：

```typescript
{
  id: "ds-new-001",
  type: "data_security",
  subtype: "new_scenario",
  severity: "high",
  keywords: ["关键词1", "关键词2"],
  optionalKeywords: ["可选1", "可选2"],
  excludeKeywords: ["排除1"],
  minConfidence: 0.6,
  weight: 0.8,
}
```

### 添加新的建议模板

在 `advice-templates.ts` 中添加：

```typescript
{
  id: "ds-advice-new",
  scenarioType: "data_security",
  scenarioSubtype: "new_scenario",
  template: `💡 **职场建议：标题**

建议内容...`,
  tone: "gentle",
  priority: 80,
}
```

## 注意事项

1. **隐私保护**：检测在本地完成，不会将用户消息发送到外部服务
2. **建议非强制**：职场建议仅供参考，不替代专业 HR 或法律顾问意见
3. **持续优化**：根据用户反馈持续优化检测规则和建议模板

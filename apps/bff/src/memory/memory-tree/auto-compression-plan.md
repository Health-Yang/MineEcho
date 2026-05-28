# Memory-Tree 自动压缩机制实现计划

## 目标
实现用户无感知的自动压缩机制，确保记忆永远可用且成本可控。

## 配额设计

```
L0 工作记忆: 200,000 tokens (约100次复杂对话)
L1 日摘要:  1,000,000 tokens (约1000天 ≈ 3年)
L2 周摘要:  5,000,000 tokens (约500周 ≈ 10年)
L3 月归档:  无限制 (高压缩存档)
```

## 压缩触发阈值

| 层级 | 触发条件 | 自动行为 |
|------|----------|----------|
| L0→L1 | L0超过80% (160K) | 异步压缩今日对话为摘要 |
| L1→L2 | L1超过80% (800K) | 异步压缩本周为周摘要 |
| L2→L3 | L2超过80% (4M) | 异步压缩本月为月归档 |

## Agent Teams 分工

### Team Alpha: types.ts
- 添加 QuotaConfig 类型
- 添加 QuotaUsage 类型
- 添加压缩优先级类型
- 修改 DEFAULT_MEMORY_TREE_CONFIG

### Team Beta: tree-manager.ts
- 实现后台压缩队列 (BackgroundCompressionQueue)
- 实现优先级压缩逻辑
- 实现异步压缩方法
- 添加配额检查方法

### Team Gamma: memory-tree-api.ts
- 修改 stats API 返回配额信息
- 添加 quota 端点
- 添加压缩状态端点

## 实现步骤

1. Team Alpha: 修改 types.ts 添加配额类型
2. Team Beta: 修改 tree-manager.ts 实现后台压缩
3. Team Gamma: 修改 API 返回配额信息
4. Team Delta: 端到端测试验证
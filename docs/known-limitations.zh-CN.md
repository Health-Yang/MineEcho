# 已知限制与公开发布说明

本文用于公开发布前后的期望管理。MineEcho 当前以本地 Web Console 和 BFF 为主要使用路径，其他集成能力应按实验状态理解。

## 非 Web 渠道仍处于实验状态

当前稳定入口是浏览器 Console 与本地 BFF：

- Console：`http://127.0.0.1:5175/`
- BFF：`http://127.0.0.1:3085/`

非 Web 渠道、外部客户端、自动化集成和企业内部工作流接入仍需要按具体环境验证。文档中的 Gateway 兼容层用于技能执行和既有协议桥接，不代表所有第三方客户端都已经达到生产可用状态。

## Console bundle 大包警告

Console 构建可能出现 chunk 体积偏大的 warning。已知主要来源包括知识图谱、Markdown/Mermaid 渲染和部分页面级模块。

这些 warning 不等于构建失败，但会影响首次加载体积。发布前应运行：

```sh
npm run build
```

如果只是切公开源码包，`docs/release-checklist.md` 中已将该 warning 标记为当前可接受限制；后续优化方向是继续按页面或组件拆分重型依赖。

## 模型与 Gateway 要求

MineEcho 不随源码包提供真实模型密钥、生产端点或企业配置。需要在本机 `.env` 中配置实际 Provider、Gateway 地址和可选 token。

基础路径建议：

```sh
cp apps/bff/.env.example apps/bff/.env
# 可选：
# cp apps/console/.env.example apps/console/.env
```

如果技能执行、AI 应用、嵌入或知识库处理依赖外部模型服务，调用结果取决于本地 Gateway、Provider Key、模型可用性、网络环境和额度限制。不要把真实 token、生产地址或企业知识写入源码仓库。

## 知识图谱大规模限制

知识图谱当前更适合个人或小团队规模的浏览、邻域解释和人工确认式对齐。节点数、边数、布局复杂度和浏览器性能都会影响交互流畅度。

大规模图谱使用时建议：

- 优先查看局部邻域，而不是一次性渲染全图。
- 控制导入批次和自动生成关系的规模。
- 对重要关系走预览与人工确认流程。
- 在发布或演示前用真实数据规模做本机性能验证。

## Runtime data 不进入 release 包

公开源码包不应包含本机运行态、密钥、数据库、缓存或用户数据。`npm run export:release` 会导出过滤后的源码目录，并运行 release 检查。

会被视为发布风险或被导出脚本排除的典型路径包括：

- `.mineecho/`
- `.openclaw/`
- `apps/**/.mineecho/`
- `apps/**/.openclaw/`
- `apps/**/workspace/`
- 本地 `.env`、数据库、key、pem、log 和运行态 JSON 文件

发布前建议执行：

```sh
npm run export:release
```

导出的目录默认位于 `releases/mineecho-source-<version>/`。请从该目录或干净 clone 进行公开发布，不要直接发布带有本机运行态的开发目录。

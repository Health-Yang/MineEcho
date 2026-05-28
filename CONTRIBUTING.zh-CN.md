# 贡献指南

感谢参与 MineEcho。项目仍在快速演进，建议保持改动小、可验证，并坚持本地优先。

## 开发环境

```sh
npm run install:apps
cp apps/bff/.env.example apps/bff/.env
npm run dev
```

Console 地址是 `http://127.0.0.1:5175/`。BFF 地址是 `http://127.0.0.1:3085/`。

## 验证

提交 PR 前，请在仓库根目录运行：

```sh
npm run verify
```

PR 也会通过 GitHub Actions 自动运行 `npm run check:release` 和 `npm run verify`。
`npm run verify` 会检查根包、BFF 和 Console 的版本号是否一致。

如果只改某个局部模块，可以使用 `apps/bff/package.json` 和 `apps/console/package.json` 里的专项测试脚本。

## 本地数据与密钥

不要提交运行态数据或密钥，尤其是：

- `.env` 和 `.env.*`，已明确提交的 `.env.example` 除外。
- `.mineecho/`
- `.openclaw/`
- `apps/**/.mineecho/`
- `apps/**/.openclaw/`
- `apps/**/workspace/`
- 本地数据库、日志、录音、导入文档、AI 应用凭据和 Gateway token。

发布分支前，请运行 `docs/runtime-data.zh-CN.md` 中的清理检查命令。

```sh
npm run check:release
```

如果发现漏洞或意外密钥泄露，请遵循 [`SECURITY.zh-CN.md`](SECURITY.zh-CN.md)。不要在公开 issue 中包含利用细节、私有数据或真实凭据。

## 兼容边界

MineEcho 内嵌 OpenClaw 作为 Gateway 兼容层。不要随意重命名 OpenClaw 协议路径、配置名或包集成代码；如果确实需要修改，必须带上兼容方案和验证结果。

新增的产品展示、文档和用户可见代码应使用 MineEcho 命名。`MINECHO_CONFIG_HOME`、`MINECHO_KB_BASE_PATH`、`SCLAW_HOST` 等旧名称只应作为明确的兼容别名保留。

## PR 建议

- 说明用户可感知的行为变化。
- 列出验证命令和结果。
- 不要混入无关重构。
- 涉及路由、知识库、记忆、AI 应用或运行态行为时，补充聚焦测试。
- 命令、端口、环境变量或运行态路径变化时，同步更新 `README.md`、`README.zh-CN.md` 或 `docs/`。

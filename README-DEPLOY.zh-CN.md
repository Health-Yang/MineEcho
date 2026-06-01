# MineEcho v0.1 网盘运行包部署指南

这份文档面向一线快速部署。v0.1 运行包会包含 MineEcho、OpenClaw Gateway 兼容层源码，以及已经安装好的依赖目录，尽量减少现场联网下载依赖。

## 适用范围

- 运行包按打包机器的平台生成，`node_modules` 里可能包含平台相关原生模块，不能跨操作系统直接使用。
- `runtime-darwin-x64` / `runtime-darwin-arm64` 只适合 macOS。
- Windows 用户需要下载 `runtime-win32-x64` Windows 专用包，或使用源码包后在 Windows 上执行 `npm run install:apps` / `npm run install:all` 安装依赖。
- 跨平台分发时建议分别在 macOS、Windows、Linux 上各打一个包。

## 一、用户准备

用户只需要提前安装：

- Node.js 22.19.0 或更高版本
- npm，通常随 Node.js 一起安装

检查：

```sh
node -v
npm -v
```

如果没有安装 Node.js，请先安装 Node.js 22 LTS 或更高版本。安装完成后重新打开终端，再执行上面的检查命令。

### 国内用户快速安装 Node.js

如果只是想尽快启动 MineEcho，推荐直接安装 Node.js 官方安装包：

1. 打开 Node.js 官网下载页：`https://nodejs.org/zh-cn/download`
2. 选择 LTS 版本。
3. macOS 下载 `.pkg`，Windows 下载 `.msi`，Linux 用户可以优先使用 nvm。
4. 安装完成后重新打开终端，执行：

```sh
node -v
npm -v
```

如果官网下载较慢，可以使用国内镜像下载 Node.js 安装包：

```text
https://npmmirror.com/mirrors/node/
```

进入镜像后选择 `v22.x.x/` 目录，下载适合自己系统的安装包。MineEcho 需要 Node.js `22.19.0` 或更高版本，建议选择最新的 Node.js 22 LTS 小版本。

### macOS/Linux 使用 nvm 安装

nvm 适合需要切换多个 Node.js 版本的用户。先安装 nvm：

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

如果 GitHub 访问较慢，可以改用镜像加速地址：

```sh
curl -o- https://cdn.jsdelivr.net/gh/nvm-sh/nvm@v0.40.3/install.sh | bash
```

安装后关闭并重新打开终端，或执行：

```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

然后安装 Node.js 22：

```sh
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
nvm install 22
nvm use 22
nvm alias default 22
node -v
npm -v
```

如果 `node -v` 显示 `v22.19.0` 或更高版本，就可以继续启动 MineEcho。

### Windows 使用 nvm-windows 安装

Windows 不使用 macOS/Linux 的 nvm 脚本，建议使用 nvm-windows：

1. 打开 nvm-windows 发布页：`https://github.com/coreybutler/nvm-windows/releases`
2. 下载 `nvm-setup.exe`。
3. 安装完成后重新打开 PowerShell 或命令提示符。
4. 执行：

```bat
nvm install 22
nvm use 22
node -v
npm -v
```

如果下载 Node.js 速度慢，可以在 nvm-windows 安装目录下编辑 `settings.txt`，增加或修改：

```text
node_mirror: https://npmmirror.com/mirrors/node/
npm_mirror: https://npmmirror.com/mirrors/npm/
```

保存后重新打开终端，再执行 `nvm install 22`。

## 二、解压运行

拿到网盘里的压缩包后，先确认文件名与系统一致：

- macOS：下载 `MineEcho-v0.1.0-runtime-darwin-*.zip`
- Windows：下载 `MineEcho-v0.1.0-runtime-win32-x64.zip`

如果 Windows 用户下载到文件名包含 `darwin` 的包，请不要继续运行；这是 macOS 包。

确认平台后，按下面步骤操作。

1. 解压压缩包。
2. 打开终端，进入解压后的目录。
3. 执行启动脚本。
4. 浏览器打开 `http://127.0.0.1:5175`。

macOS/Linux：

```sh
./start-mineecho-v0.1.sh
```

如果系统提示没有执行权限：

```sh
chmod +x start-mineecho-v0.1.sh
./start-mineecho-v0.1.sh
```

Windows：

```bat
start-mineecho-v0.1.bat
```

Windows 包内只会包含 `start-mineecho-v0.1.bat`；macOS 包内只会包含 `start-mineecho-v0.1.sh`。如果你在 Windows 上看到包名包含 `darwin`，说明拿到的是 macOS 包，请不要继续运行；需要下载 Windows 专用包，或使用源码方式重新安装依赖。

启动后打开：

```text
http://127.0.0.1:5175
```

首次进入后，在设置页配置模型 Provider 和 API Key。

首次启动时，系统会把运行包内置的 MineEcho 默认技能自动安装到本地运行态技能目录。当前运行包默认包含 MineEcho 1.0 同步过来的 52 个技能，覆盖编程、排错、文档、表格、浏览器研究、知识整理、Agent Team 协作、设计、Office/PDF 等常用场景，用户不需要再单独下载技能包。

## 三、默认端口

- Console：`5175`
- BFF：`3085`
- OpenClaw Gateway：`18789`
- 运行态目录：解压目录下的 `.runtime/`

如果端口冲突，可在启动前设置环境变量：

```sh
export BFF_PORT=3095
export MINEECHO_CONSOLE_PORT=5185
export OPENCLAW_GATEWAY_PORT=18799
./start-mineecho-v0.1.sh
```

Windows 端口冲突时可使用：

```bat
set BFF_PORT=3095
set MINEECHO_CONSOLE_PORT=5185
set OPENCLAW_GATEWAY_PORT=18799
start-mineecho-v0.1.bat
```

## 四、常见问题

### 提示 Node.js 版本过低

升级到 Node.js 22.19.0 或更高版本，然后重新打开终端再启动。

### 浏览器打不开页面

先确认终端里是否显示了 Console 地址，例如：

```text
Console: http://127.0.0.1:5175
```

如果端口被占用，按“三、默认端口”里的方式换一组端口。

### 首次使用无法回答问题

进入设置页配置模型 Provider 和 API Key。配置完成后再回到聊天页测试。

### 是否需要再安装 OpenClaw 或依赖包

如果你下载的是与当前系统匹配的运行包，不需要。这个运行包已经包含 OpenClaw Gateway 兼容层和 MineEcho 运行所需的依赖目录，正常情况下解压后执行启动脚本即可。

如果启动时提示缺少 `vendor/openclaw-gateway/node_modules` 或 `vendor/openclaw-gateway/openclaw.mjs`，通常有三种原因：

1. 下载的是源码包，不是 runtime 运行包。
2. Windows 用户误用了 `runtime-darwin-*` macOS 包。
3. 解压工具没有完整解压大包。

处理方式：

- 优先下载与系统一致的 runtime 包。
- 如果只有源码包，需要联网执行：

```sh
npm run install:apps
```

也可以使用兼容别名：

```sh
npm run install:all
```

## 五、维护者如何生成网盘运行包

在维护者机器上执行：

```sh
npm run install:apps
node scripts/package-v0.1-runtime.mjs
```

默认输出目录类似：

```text
releases/MineEcho-v0.1.0-runtime-darwin-arm64/
```

把这个目录压缩后上传百度网盘即可。

也可以指定输出目录：

```sh
node scripts/package-v0.1-runtime.mjs --out releases/MineEcho-v0.1.0-runtime-darwin-x64
```

Windows 离线运行包必须在 Windows 环境生成，不能在 macOS 上直接复制 `node_modules` 伪造。推荐在 Windows 机器上执行：

```bat
npm run install:apps
node scripts/package-v0.1-runtime.mjs
```

生成目录类似：

```text
releases\MineEcho-v0.1.0-runtime-win32-x64\
```

也可以使用 GitHub Actions 的 `Runtime Packages` 工作流生成 Windows artifact，再下载后上传网盘。

## 六、运行包包含什么

- `apps/bff/`
- `apps/console/`
- `vendor/openclaw-gateway/`
- `apps/bff/starter-skills/`，内置 MineEcho 默认技能
- `apps/bff/node_modules/`
- `apps/console/node_modules/`
- `vendor/openclaw-gateway/node_modules/`
- 一键启动脚本
- 小白部署说明

## 七、不应包含什么

运行包生成脚本会过滤以下本机运行态数据：

- `.env`
- `.mineecho/`
- `.openclaw/`
- `.runtime/`
- `workspace/`
- 数据库文件、日志、密钥文件

上传网盘前仍建议检查一遍，避免把真实 API Key、聊天记录、知识库文件或企业内部数据打进去。

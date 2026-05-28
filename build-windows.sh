#!/bin/bash
# MineEcho Windows 打包脚本
# 在 macOS/Linux 上运行，使用 electron-builder 交叉编译 Windows 包

set -e

echo "========================================"
echo "  MineEcho Windows 打包脚本"
echo "========================================"
echo ""

# ── 步骤 0: 环境检查 ──
echo "[0/7] 环境检查..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js 22+"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "错误: Node.js 版本过低 (${NODE_VERSION})，需要 22+"
    exit 1
fi

echo "  ✓ Node.js $(node --version)"
echo ""

# ── 步骤 1: 安装依赖 ──
echo "[1/7] 安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "  安装根目录依赖..."
    npm install
fi

cd apps/console
if [ ! -d "node_modules/electron" ]; then
    echo "  安装 Electron..."
    npm install
fi
cd ../..

cd apps/bff
if [ ! -d "node_modules" ]; then
    echo "  安装 BFF 依赖..."
    npm install
fi
cd ../..

echo "  ✓ 依赖安装完成"
echo ""

# ── 步骤 2: 构建前端 ──
echo "[2/7] 构建前端 (Console)..."
cd apps/console
# 跳过 tsc（可能损坏），直接用 vite 构建
npx vite build
cd ../..
echo "  ✓ 前端构建完成"
echo ""

# ── 步骤 3: 构建 BFF ──
echo "[3/7] 构建 BFF..."
cd apps/bff
npm run build
cd ../..
echo "  ✓ BFF 构建完成"
echo ""

# ── 步骤 4: 编译 Electron 主进程 ──
echo "[4/7] 编译 Electron 主进程..."
cd apps/console
npx esbuild electron/main.ts --bundle --platform=node --target=node22 --format=esm --outfile=electron/main.js --external:electron
npx esbuild electron/preload.ts --bundle --platform=node --target=node22 --format=esm --outfile=electron/preload.mjs --external:electron
cd ../..
echo "  ✓ Electron 主进程编译完成"
echo ""

# ── 步骤 5: 创建扁平化 BFF 副本（解决 pnpm 符号链接问题）──
echo "[5/7] 创建扁平化 BFF 依赖副本..."
BFF_BUNDLE="apps/console/build/bff-bundle"
rm -rf "$BFF_BUNDLE"
mkdir -p "$BFF_BUNDLE"

# 复制 BFF package.json 和 dist
cp apps/bff/package.json "$BFF_BUNDLE/"
cp -r apps/bff/dist "$BFF_BUNDLE/"

# 在副本目录中使用 npm 安装传统结构的依赖（非符号链接）
cd "$BFF_BUNDLE"
echo "  正在安装 BFF 生产依赖（传统 node_modules 结构）..."
# 使用 --legacy-peer-deps 避免 peer dependency 冲突
npm install --production --legacy-peer-deps 2>&1 | tail -5
cd ../../..

# 验证关键依赖是否存在
if [ ! -d "$BFF_BUNDLE/node_modules/express" ]; then
    echo "  ⚠ 警告: express 未安装到 BFF 副本中"
fi
if [ ! -d "$BFF_BUNDLE/node_modules/openclaw" ]; then
    echo "  ⚠ 警告: openclaw 未安装到 BFF 副本中"
fi

NODE_COUNT=$(ls "$BFF_BUNDLE/node_modules/" | wc -l | tr -d ' ')
echo "  ✓ BFF 副本依赖包数量: ${NODE_COUNT}"
echo ""

# ── 步骤 6: 复制 openclaw 配置（如果存在）──
echo "[6/7] 准备 openclaw 配置..."
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"
if [ -f "$OPENCLAW_CONFIG" ]; then
    mkdir -p apps/console/build/openclaw
    cp "$OPENCLAW_CONFIG" apps/console/build/openclaw/
    echo "  ✓ 已复制 openclaw.json"
else
    echo "  ⚠ 未找到 $OPENCLAW_CONFIG，打包后需要手动配置"
fi
echo ""

# ── 步骤 7: 运行 electron-builder ──
echo "[7/7] 运行 electron-builder (Windows)..."
echo "  注意: 如果在 macOS 上构建 Windows 包，"
echo "  原生模块 (better-sqlite3, sqlite-vec) 需要 Windows 预构建二进制。"
echo "  electron-builder 会尝试自动下载。"
echo ""

cd apps/console
# 使用 --win 标志构建 Windows 包
npx electron-builder --win $*
cd ../..

echo "  ✓ Windows 包构建完成"
echo ""

# ── 输出信息 ──
echo "========================================"
echo "  打包完成!"
echo "========================================"
echo ""
echo "输出目录: apps/console/release/"
echo ""
if [ -d "apps/console/release" ]; then
    ls -lh apps/console/release/ 2>/dev/null || true
fi
echo ""
echo "安装包类型:"
echo "  - .exe (NSIS 安装程序) — 推荐，支持安装目录选择"
echo "  - .exe (Portable) — 便携版，无需安装"
echo ""
echo "⚠️  重要限制:"
echo "  1. 首次启动时会自动初始化数据目录"
echo "  2. 需要配置 openclaw.json 才能使用 Gateway 功能"
echo "  3. LightRAG Python 服务未包含，知识库将使用本地四层搜索"
echo "  4. 原生模块 (better-sqlite3) 需要 Windows 预构建二进制"
echo "     如果运行时报错，请在 Windows 机器上重新运行 npm install"
echo ""

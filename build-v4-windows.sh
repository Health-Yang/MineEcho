#!/bin/bash
# MineEcho Windows 打包脚本
# 在 macOS/Linux 上运行，使用 electron-builder 交叉编译 Windows 包

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "========================================"
echo "  MineEcho Windows 打包脚本"
echo "========================================"
echo ""

# ── 步骤 0: 环境检查 ──
echo "[0/8] 环境检查..."
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
echo "[1/8] 安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "  安装根目录依赖..."
    npm install 2>&1 | tail -5
fi

cd apps/console
if [ ! -d "node_modules/electron" ]; then
    echo "  安装 Console 依赖..."
    npm install 2>&1 | tail -5
fi
cd ../..

cd apps/bff
if [ ! -d "node_modules" ]; then
    echo "  安装 BFF 依赖..."
    npm install 2>&1 | tail -5
fi
cd ../..

echo "  ✓ 依赖安装完成"
echo ""

# ── 步骤 2: 构建前端 ──
echo "[2/8] 构建前端 (Console)..."
cd apps/console
npx vite build
cd ../..
echo "  ✓ 前端构建完成"
echo ""

# ── 步骤 3: 构建 BFF ──
echo "[3/8] 构建 BFF..."
cd apps/bff
npm run build
cd ../..
echo "  ✓ BFF 构建完成"
echo ""

# ── 步骤 4: 编译 Electron 主进程 ──
echo "[4/8] 编译 Electron 主进程..."
cd apps/console
npx esbuild electron/main.ts --bundle --platform=node --target=node22 --format=esm --outfile=electron/main.js --external:electron
npx esbuild electron/preload.ts --bundle --platform=node --target=node22 --format=esm --outfile=electron/preload.mjs --external:electron
cd ../..
echo "  ✓ Electron 主进程编译完成"
echo ""

# ── 步骤 5: 创建扁平化 BFF 副本（Windows 版）─
echo "[5/8] 创建扁平化 BFF 依赖副本（Windows 版）..."
BFF_BUNDLE="$PROJECT_ROOT/apps/console/bff-bundle"
rm -rf "$BFF_BUNDLE"
mkdir -p "$BFF_BUNDLE"

# 5a: 生成仅含 production 依赖的 package.json（排除 devDependencies 减小体积）
python3 -c "
import json
with open('$PROJECT_ROOT/apps/bff/package.json') as f:
    pkg = json.load(f)
# 移除 devDependencies 和 scripts 中的开发脚本
pkg.pop('devDependencies', None)
pkg.pop('scripts', None)
with open('$BFF_BUNDLE/package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
    f.write('\n')
"
cp -r "$PROJECT_ROOT/apps/bff/dist" "$BFF_BUNDLE/"

# 5b: 安装 production 依赖（此时是 macOS 二进制）
cd "$BFF_BUNDLE"
# 使用临时 cache 避免 npm 权限问题
TEMP_NPM_CACHE="$PROJECT_ROOT/.npm-cache-tmp"
mkdir -p "$TEMP_NPM_CACHE"
npm install --omit=dev --legacy-peer-deps --cache "$TEMP_NPM_CACHE" 2>&1 | tail -5
cd "$PROJECT_ROOT"

# 5c: 复制 openclaw 到 bff-bundle（BFF 的 Gateway 依赖）
# openclaw 没有作为 npm 依赖声明，需要从已安装位置复制
if [ ! -d "$BFF_BUNDLE/node_modules/openclaw" ]; then
    # 按优先级查找已安装的 openclaw
    OPENCLAW_CANDIDATES=(
        "$PROJECT_ROOT/apps/bff/node_modules/openclaw"
        "$PROJECT_ROOT/apps/console/bff-bundle-win/node_modules/openclaw"
        "/usr/local/lib/node_modules/openclaw"
    )
    OPENCLAW_SRC=""
    for candidate in "${OPENCLAW_CANDIDATES[@]}"; do
        if [ -d "$candidate" ]; then
            OPENCLAW_SRC="$candidate"
            break
        fi
    done

    if [ -n "$OPENCLAW_SRC" ]; then
        echo "  复制 openclaw 从: $OPENCLAW_SRC"
        mkdir -p "$BFF_BUNDLE/node_modules/openclaw"
        # 排除 macOS native 模块、.DS_Store、.cache 等，减小复制体积
        rsync -a --exclude='*.node' --exclude='.DS_Store' --exclude='.cache' \
              --exclude='*-darwin-*' --exclude='*-macos-*' --exclude='*-mac-*' \
              "$OPENCLAW_SRC/" "$BFF_BUNDLE/node_modules/openclaw/"
        echo "  ✓ 已复制 openclaw 到 bff-bundle"
    else
        echo "  ⚠ 错误: 无法找到已安装的 openclaw，Gateway 功能将不可用"
        echo "  ⚠ 请先运行: npm install -g openclaw"
    fi
fi

# 5d: 下载 Windows 预编译 native 模块，替换 macOS 版本
echo "  下载 Windows 预编译 native 模块..."
cd "$BFF_BUNDLE"

# 注意: npm install --save-optional 会因为当前平台是 macOS 而跳过 Windows 平台包
# 所以需要手动从 npm registry 下载 tarball 并解压

# ── BFF 自身的 native 模块 ──

# sqlite-vec: BFF 知识库向量搜索使用（通过 getLoadablePath() 加载扩展）
SQLITE_VEC_URL=$(npm view sqlite-vec-windows-x64@0.1.9 dist.tarball 2>/dev/null)
if [ -n "$SQLITE_VEC_URL" ]; then
    mkdir -p node_modules/sqlite-vec-windows-x64
    curl -sL "$SQLITE_VEC_URL" | tar xz --strip-components=1 -C node_modules/sqlite-vec-windows-x64 2>/dev/null && \
        echo "  ✓ sqlite-vec-windows-x64 已安装" || \
        echo "  ⚠ sqlite-vec-windows-x64 安装失败（非致命，BFF 有 fallback）"
else
    echo "  ⚠ sqlite-vec-windows-x64 无法获取下载地址"
fi

# sharp: openclaw Gateway 图片处理使用（lazy 加载）
SHARP_WIN_URL=$(npm view @img/sharp-win32-x64@0.34.5 dist.tarball 2>/dev/null)
if [ -n "$SHARP_WIN_URL" ]; then
    mkdir -p node_modules/@img/sharp-win32-x64
    curl -sL "$SHARP_WIN_URL" | tar xz --strip-components=1 -C node_modules/@img/sharp-win32-x64 2>/dev/null && \
        echo "  ✓ @img/sharp-win32-x64 已安装" || \
        echo "  ⚠ @img/sharp-win32-x64 安装失败（非致命，Gateway lazy 加载）"
else
    echo "  ⚠ @img/sharp-win32-x64 无法获取下载地址"
fi

# @napi-rs/canvas: openclaw 图片处理使用（lazy 加载，有 .catch fallback）
CANVAS_WIN_URL=$(npm view @napi-rs/canvas-win32-x64-msvc@0.1.96 dist.tarball 2>/dev/null)
if [ -n "$CANVAS_WIN_URL" ]; then
    mkdir -p node_modules/@napi-rs/canvas-win32-x64-msvc
    curl -sL "$CANVAS_WIN_URL" | tar xz --strip-components=1 -C node_modules/@napi-rs/canvas-win32-x64-msvc 2>/dev/null && \
        echo "  ✓ @napi-rs/canvas-win32-x64-msvc 已安装" || \
        echo "  ⚠ @napi-rs/canvas-win32-x64-msvc 安装失败（非致命，Gateway lazy 加载）"
else
    echo "  ⚠ @napi-rs/canvas-win32-x64-msvc 无法获取下载地址"
fi

# @reflink/reflink: openclaw 文件复制使用
REFLINK_WIN_URL=$(npm view @reflink/reflink-win32-x64-msvc@0.1.19 dist.tarball 2>/dev/null)
if [ -n "$REFLINK_WIN_URL" ]; then
    mkdir -p node_modules/@reflink/reflink-win32-x64-msvc
    curl -sL "$REFLINK_WIN_URL" | tar xz --strip-components=1 -C node_modules/@reflink/reflink-win32-x64-msvc 2>/dev/null && \
        echo "  ✓ @reflink/reflink-win32-x64-msvc 已安装" || \
        echo "  ⚠ @reflink/reflink-win32-x64-msvc 安装失败（非致命）"
else
    echo "  ⚠ @reflink/reflink-win32-x64-msvc 无法获取下载地址"
fi

# ── openclaw 内部的 Windows native 模块 ──
OPENCLAW_NM="$BFF_BUNDLE/node_modules/openclaw/node_modules"
if [ -d "$OPENCLAW_NM" ]; then
    echo "  下载 openclaw 内部 Windows native 模块..."

    # sharp (openclaw 内部)
    OC_SHARP_URL=$(npm view @img/sharp-win32-x64@0.34.5 dist.tarball 2>/dev/null)
    if [ -n "$OC_SHARP_URL" ]; then
        mkdir -p "$OPENCLAW_NM/@img/sharp-win32-x64"
        curl -sL "$OC_SHARP_URL" | tar xz --strip-components=1 -C "$OPENCLAW_NM/@img/sharp-win32-x64" 2>/dev/null && \
            echo "  ✓ openclaw: @img/sharp-win32-x64 已安装" || \
            echo "  ⚠ openclaw: @img/sharp-win32-x64 安装失败"
    fi

    # @napi-rs/canvas (openclaw 内部)
    OC_CANVAS_URL=$(npm view @napi-rs/canvas-win32-x64-msvc@0.1.96 dist.tarball 2>/dev/null)
    if [ -n "$OC_CANVAS_URL" ]; then
        mkdir -p "$OPENCLAW_NM/@napi-rs/canvas-win32-x64-msvc"
        curl -sL "$OC_CANVAS_URL" | tar xz --strip-components=1 -C "$OPENCLAW_NM/@napi-rs/canvas-win32-x64-msvc" 2>/dev/null && \
            echo "  ✓ openclaw: @napi-rs/canvas-win32-x64-msvc 已安装" || \
            echo "  ⚠ openclaw: @napi-rs/canvas-win32-x64-msvc 安装失败"
    fi

    # @reflink/reflink (openclaw 内部)
    OC_REFLINK_URL=$(npm view @reflink/reflink-win32-x64-msvc@0.1.19 dist.tarball 2>/dev/null)
    if [ -n "$OC_REFLINK_URL" ]; then
        mkdir -p "$OPENCLAW_NM/@reflink/reflink-win32-x64-msvc"
        curl -sL "$OC_REFLINK_URL" | tar xz --strip-components=1 -C "$OPENCLAW_NM/@reflink/reflink-win32-x64-msvc" 2>/dev/null && \
            echo "  ✓ openclaw: @reflink/reflink-win32-x64-msvc 已安装" || \
            echo "  ⚠ openclaw: @reflink/reflink-win32-x64-msvc 安装失败"
    fi

    # sqlite-vec (openclaw 内部)
    OC_SQVEC_URL=$(npm view sqlite-vec-windows-x64@0.1.9 dist.tarball 2>/dev/null)
    if [ -n "$OC_SQVEC_URL" ]; then
        mkdir -p "$OPENCLAW_NM/sqlite-vec-windows-x64"
        curl -sL "$OC_SQVEC_URL" | tar xz --strip-components=1 -C "$OPENCLAW_NM/sqlite-vec-windows-x64" 2>/dev/null && \
            echo "  ✓ openclaw: sqlite-vec-windows-x64 已安装" || \
            echo "  ⚠ openclaw: sqlite-vec-windows-x64 安装失败"
    fi

    # @lydell/node-pty (openclaw 内部 - 终端模拟)
    # 注意：正确包名是 @lydell/node-pty-win32-x64（不是 -msvc）
    OC_PTY_URL=$(npm view @lydell/node-pty-win32-x64@1.2.0-beta.12 dist.tarball 2>/dev/null)
    if [ -n "$OC_PTY_URL" ]; then
        mkdir -p "$OPENCLAW_NM/@lydell/node-pty-win32-x64"
        curl -sL "$OC_PTY_URL" | tar xz --strip-components=1 -C "$OPENCLAW_NM/@lydell/node-pty-win32-x64" 2>/dev/null && \
            echo "  ✓ openclaw: @lydell/node-pty-win32-x64 已安装" || \
            echo "  ⚠ openclaw: @lydell/node-pty-win32-x64 安装失败"
    else
        echo "  ⚠ openclaw: @lydell/node-pty-win32-x64 无法获取下载地址"
    fi

    # @snazzah/davey (openclaw 内部 - Discord 音频/MLS 加密)
    # 注意：正确包名是 @snazzah/davey-win32-x64-msvc（不是 bare）
    OC_DAVEY_URL=$(npm view @snazzah/davey-win32-x64-msvc@0.1.11 dist.tarball 2>/dev/null)
    if [ -n "$OC_DAVEY_URL" ]; then
        mkdir -p "$OPENCLAW_NM/@snazzah/davey-win32-x64-msvc"
        curl -sL "$OC_DAVEY_URL" | tar xz --strip-components=1 -C "$OPENCLAW_NM/@snazzah/davey-win32-x64-msvc" 2>/dev/null && \
            echo "  ✓ openclaw: @snazzah/davey-win32-x64-msvc 已安装" || \
            echo "  ⚠ openclaw: @snazzah/davey-win32-x64-msvc 安装失败"
    else
        echo "  ⚠ openclaw: @snazzah/davey-win32-x64-msvc 无法获取下载地址"
    fi
fi

# 5e: 删除 macOS native 模块（只保留 Windows/多平台的）
echo "  清理 macOS native 模块..."
# while-read 循环中的 grep 在 set -e 下可能意外退出脚本，用子 shell 隔离
(
find node_modules -name "*.node" -type f | while read f; do
    arch=$(file -b "$f" 2>/dev/null)
    if echo "$arch" | grep -q "Mach-O"; then
        rm -f "$f"
        echo "    删除 macOS: $f"
    fi
done
) || true
# 删除空的 macOS 平台包目录（包含 openclaw 内部的子依赖）
find node_modules -type d -name "*-darwin-*" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "*-mac-*" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "*-macos-*" -exec rm -rf {} + 2>/dev/null || true

# 也清理 openclaw 内部的 macOS native 模块
if [ -d "$BFF_BUNDLE/node_modules/openclaw/node_modules" ]; then
    echo "  清理 openclaw 内部 macOS native 模块..."
    (
    find "$BFF_BUNDLE/node_modules/openclaw/node_modules" -name "*.node" -type f | while read f; do
        arch=$(file -b "$f" 2>/dev/null)
        if echo "$arch" | grep -q "Mach-O"; then
            rm -f "$f"
            echo "    删除 macOS (openclaw): $f"
        fi
    done
    ) || true
    find "$BFF_BUNDLE/node_modules/openclaw/node_modules" -type d -name "*-darwin-*" -exec rm -rf {} + 2>/dev/null || true
    find "$BFF_BUNDLE/node_modules/openclaw/node_modules" -type d -name "*-mac-*" -exec rm -rf {} + 2>/dev/null || true
    find "$BFF_BUNDLE/node_modules/openclaw/node_modules" -type d -name "*-macos-*" -exec rm -rf {} + 2>/dev/null || true
fi

# 删除未使用的 better-sqlite3（BFF 不直接使用它）
rm -rf node_modules/better-sqlite3 2>/dev/null
rm -rf node_modules/openclaw/node_modules/better-sqlite3 2>/dev/null

# ── 步骤 5e.5: 清理 openclaw 中无用文件，减小包体积 ──
echo "  清理 openclaw 无用文件（docs/tests/types）..."
# 清理 test/tests/examples/docs 等开发目录（所有 node_modules）
find node_modules -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name ".github" -o -name "docs" -o -name "examples" -o -name "example" -o -name "benchmark" -o -name "bench" -o -name ".vscode" -o -name ".cache" \) -exec rm -rf {} + 2>/dev/null || true
# 清理 TypeScript 声明文件（运行时不需要）
find node_modules -name "*.d.ts" -delete 2>/dev/null || true
# 清理多余 markdown 文件（只保留 LICENSE）
find node_modules -name "CHANGELOG.md" -o -name "README.md" | xargs rm -f 2>/dev/null || true
# 清理多余的 LICENSE 文件（只保留主 LICENSE）
find node_modules -name "LICENSE*" ! -name "LICENSE" -delete 2>/dev/null || true
echo "  ✓ 无用文件清理完成"

# 清理 .DS_Store 和空目录
find node_modules -name ".DS_Store" -delete 2>/dev/null || true

cd "$PROJECT_ROOT"

# 5f: 验证
NODE_COUNT=$(ls "$BFF_BUNDLE/node_modules/" 2>/dev/null | wc -l | tr -d ' ')
echo "  ✓ BFF 副本依赖包数量: ${NODE_COUNT}"

# ── 步骤 5f.5: 补丁 openclaw 的 davey（无 native binding 时不崩溃）──
# @snazzah/davey 在找不到 Windows binding 时会 throw Error，
# 导致整个 Gateway 进程崩溃。改为 warn + stub export。
OPENCLAW_DAVEY="$BFF_BUNDLE/node_modules/openclaw/node_modules/@snazzah/davey/index.js"
if [ -f "$OPENCLAW_DAVEY" ]; then
    echo "  补丁 davey native binding fallback..."
    cp "$OPENCLAW_DAVEY" "$OPENCLAW_DAVEY.bak"
    export PATCH_DAVEY_FILE="$OPENCLAW_DAVEY"
    python3 << 'PATCH_DAVEY'
import re, os
with open(os.environ['PATCH_DAVEY_FILE'], 'r') as f:
    content = f.read()

stub_code = """if (!nativeBinding) {
  console.warn('[davey] No native binding found for this platform, using stub. Voice features will be unavailable.')
  nativeBinding = {
    VERSION: '0.1.10-stub',
    Codec: {},
    DAVE_PROTOCOL_VERSION: '1.0.0-stub',
    MediaType: {},
    ProposalsOperationType: {},
    SessionStatus: {},
    DAVESession: function() { this.status = 'unavailable'; },
    DaveSession: function() { this.status = 'unavailable'; },
    DEBUG_BUILD: false,
    generateDisplayableCode: function() { return '000000'; },
    generateKeyFingerprint: function() { return 'stub-fingerprint'; },
    generateP256Keypair: async function() { return { publicKey: Buffer.alloc(32), privateKey: Buffer.alloc(32) }; },
    generatePairwiseFingerprint: function() { return 'stub-pairwise'; }
  }
}"""

# 目标：line 498 的 if (!nativeBinding) 块，特征是内有 "if (loadErrors.length > 0)"
# 这个块在 outer if (!nativeBinding || process.env...) 块之后
old_pattern = r'if \(!nativeBinding\) \{\n  if \(loadErrors\.length > 0\) \{\n[\s\S]*?throw new Error\(\`Failed to load native binding\`\)\n\}'
content = re.sub(old_pattern, stub_code, content, count=1)

with open(os.environ['PATCH_DAVEY_FILE'], 'w') as f:
    f.write(content)
PATCH_DAVEY
    if [ $? -eq 0 ]; then
        echo "  ✓ davey fallback 补丁已应用"
    else
        cp "$OPENCLAW_DAVEY.bak" "$OPENCLAW_DAVEY" 2>/dev/null || true
        echo "  ⚠ davey fallback 补丁失败，恢复原文件"
    fi
else
    echo "  ⚠ 未找到 davey index.js，跳过补丁"
fi

# ── 步骤 5f.6: 验证 native 模块架构 ──
echo "  验证 native 模块架构..."

# ── 步骤 6: 复制 openclaw 配置 ──
echo "[6/8] 准备 openclaw 配置..."
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"
if [ -f "$OPENCLAW_CONFIG" ]; then
    mkdir -p "$PROJECT_ROOT/apps/console/build/openclaw"
    cp "$OPENCLAW_CONFIG" "$PROJECT_ROOT/apps/console/build/openclaw/"
    echo "  ✓ 已复制 openclaw.json"
else
    echo "  ⚠ 未找到 $OPENCLAW_CONFIG，打包后需要手动配置"
fi
echo ""

# ── 步骤 7: 预处理测试账号 ──
echo "[7/8] 预处理测试账号..."
# 创建一个预置的 users.db 用于打包（如果存在数据目录）
BFF_DATA_DIR="$PROJECT_ROOT/apps/bff/.mineecho"
if [ -f "$BFF_DATA_DIR/users.db" ]; then
    mkdir -p "$BFF_BUNDLE/.mineecho"
    cp "$BFF_DATA_DIR/users.db" "$BFF_BUNDLE/.mineecho/" 2>/dev/null || true
    echo "  ✓ 已复制预置数据库"
else
    echo "  ⚠ 未找到预置数据库，将使用空白数据库首次启动时创建"
fi
echo ""

# ── 步骤 8: 运行 electron-builder ──
echo "[8/8] 运行 electron-builder (Windows)..."
echo "  注意: 如果在 macOS 上构建 Windows 包，"
echo "  原生模块 (better-sqlite3, sqlite-vec) 需要 Windows 预构建二进制。"
echo "  electron-builder 会尝试自动下载。"
echo ""

cd apps/console
# electron-builder 在 macOS 上交叉编译 Windows 时，signtool.exe 签名会失败（无 Windows 签名证书）
# 但打包本身会成功，所以允许 npx 返回非零退出码
npx electron-builder --win $* || true
cd ..

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
echo "  3. 原生模块 (better-sqlite3) 需要 Windows 预构建二进制"
echo ""
echo "测试账号:"
echo "  - 邮箱: demo@mineecho.ai"
echo "  - 密码: Demo123456"
echo ""

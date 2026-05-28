#!/bin/bash
# MineEcho standalone BFF launcher.
# Starts the built BFF package. Run `npm run build` before using this script.

set -e

export MINECHO_KB_BASE_PATH="${MINECHO_KB_BASE_PATH:-${HOME}/Library/Application Support/MineEcho/knowledge}"
export LIGHT_RAG_WORKING_DIR="${LIGHT_RAG_WORKING_DIR:-${HOME}/Library/Application Support/MineEcho/lightrag}"
export BFF_PORT="${BFF_PORT:-3085}"

echo "=== MineEcho BFF ==="
echo "Knowledge base: ${MINECHO_KB_BASE_PATH}"
echo "LightRAG working dir: ${LIGHT_RAG_WORKING_DIR}"
echo "BFF port: ${BFF_PORT}"
echo ""

cd "$(dirname "$0")/apps/bff"

exec node dist/index.js

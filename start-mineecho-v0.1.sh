#!/bin/bash
# MineEcho v0.1 one-click runtime launcher for macOS/Linux.

set -e

cd "$(dirname "$0")"
node scripts/start-runtime.mjs

#!/usr/bin/env bash
# 服务器上一键：检查构建 → PM2 启动 → 自检
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .next/BUILD_ID ]]; then
  echo ">>> 未找到 .next 构建，开始 npm run build（1G 内存可能较慢）..."
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"
  npm ci
  npm run build
fi

if [[ ! -f node_modules/next/dist/bin/next ]]; then
  echo ">>> 缺少 node_modules，执行 npm ci"
  npm ci
fi

pm2 delete idea-factory 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ">>> 等待启动..."
sleep 5
pm2 list
ss -tlnp | grep 3000 || echo "警告：3000 仍未监听，请执行: pm2 logs idea-factory --lines 30 --nostream"
curl -sI -m 5 http://127.0.0.1:3000/ | head -6 || true

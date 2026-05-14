#!/usr/bin/env bash
# =============================================================================
# 阿里云轻量 / Ubuntu 24.04：一键装依赖、swap、Node 20、PM2，并构建启动想法工场
#
# 我无法替你登录阿里云；请在「远程连接」里执行本脚本。
#
# 用法（二选一）：
#   1）已 git clone 到本仓库根目录：
#        bash scripts/aliyun-bootstrap.sh
#   2）只有空机，先克隆再跑（把 URL 换成你的仓库）：
#        bash scripts/aliyun-bootstrap.sh https://github.com/你的用户/你的仓库.git
#
# 跑完后务必在：轻量控制台 → 防火墙 → 放行 TCP 3000
# 浏览器访问：http://你的公网IP:3000
# =============================================================================
set -euo pipefail

REPO_URL="${1:-}"

if [[ -n "$REPO_URL" ]]; then
  APP_DIR="${HOME}/idea-factory"
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
  cd "$APP_DIR"
fi

echo ">>> 工作目录: $APP_DIR"

sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ca-certificates

if ! swapon --show | grep -q '/swapfile'; then
  echo ">>> 创建 2G swap（1G 内存建 Next 建议开启）"
  sudo swapoff /swapfile 2>/dev/null || true
  sudo rm -f /swapfile
  sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi
free -h

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]]; then
  echo ">>> 安装 Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
node -v && npm -v

sudo npm i -g pm2

if [[ ! -f .env.production ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env.production
  else
    echo "DEEPSEEK_API_KEY=" > .env.production
  fi
  echo ""
  echo ">>> 已生成 .env.production，请编辑填入 API 密钥后保存退出："
  echo ">>>    nano .env.production"
  echo ">>> 至少填写：DEEPSEEK_API_KEY=sk-...  （或 OPENAI_API_KEY）"
  echo ""
  nano .env.production
fi

export NODE_OPTIONS="--max-old-space-size=768"
npm ci
npm run build

pm2 delete idea-factory 2>/dev/null || true
pm2 start npm --name idea-factory -- run start -- -H 0.0.0.0 -p 3000
pm2 save
echo ">>> 如需开机自启：执行 pm2 startup ，再复制终端里提示的以 sudo 开头的那一行执行一次。"

sudo ufw allow OpenSSH 2>/dev/null || true
sudo ufw allow 3000/tcp 2>/dev/null || true

echo ""
echo ">>> 若本机启用了 UFW，可执行：sudo ufw enable"
echo ">>> 阿里云轻量控制台 → 防火墙 → 添加：TCP 3000，来源 0.0.0.0/0"
echo ">>> 浏览器：http://$(curl -fsS ifconfig.me 2>/dev/null || echo '你的公网IP'):3000"
echo ">>> 完成。"

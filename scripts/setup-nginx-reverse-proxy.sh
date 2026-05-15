#!/usr/bin/env bash
# =============================================================================
# Ubuntu：用 Nginx 把 80 端口的 HTTP 请求反代到本机 Next（默认 3000）
# 解决「域名解析正常、防火墙放了 80，但 http://域名 仍打不开」——因 Next 只监听 3000。
#
# 用法（在服务器上，需 sudo）：
#   sudo bash scripts/setup-nginx-reverse-proxy.sh idea-factory.top
#   sudo bash scripts/setup-nginx-reverse-proxy.sh idea-factory.top www.idea-factory.top
#
# 前置：PM2 已启动 idea-factory 且监听 127.0.0.1:3000；轻量防火墙已放行 TCP 80。
# =============================================================================
set -euo pipefail

if [[ "${1:-}" == "" ]]; then
  echo "用法: sudo bash $0 你的域名 [可选第二个主机名，如 www.域名]"
  exit 1
fi

D1="$1"
D2="${2:-}"

if [[ "$EUID" -ne 0 ]]; then
  echo "请使用 sudo 运行"
  exit 1
fi

apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx

SERVER_NAMES="$D1"
if [[ -n "$D2" ]]; then
  SERVER_NAMES="$D1 $D2"
fi

CONF_PATH="/etc/nginx/sites-available/idea-factory.conf"
cat >"$CONF_PATH" <<EOF
server {
    listen 80;
    server_name $SERVER_NAMES;
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
EOF

ln -sf "$CONF_PATH" /etc/nginx/sites-enabled/idea-factory.conf
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t
systemctl reload nginx
systemctl enable nginx

echo ">>> Nginx 已配置：http://$D1/  ->  http://127.0.0.1:3000"
echo ">>> 请确认：1) pm2 中 idea-factory 为 online；2) 轻量防火墙已放行 TCP 80"

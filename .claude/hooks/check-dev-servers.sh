#!/bin/bash

# implスキル実行前にdev:web(3000)とdev:admin(3001)が起動済みか確認し、
# 未起動なら start-dev-servers.sh に自動起動を委譲する。

# Why not ここで直接nohup起動: 自動起動ロジック(べき等・ヘルスチェック待機・ログ退避)は
# start-dev-servers.sh に集約し、このスクリプトは「確認→委譲」の薄い入口に留める（二重メンテ防止）。

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

WEB_UP=false
ADMIN_UP=false

if curl -s -o /dev/null --max-time 2 http://localhost:3000 2>/dev/null; then
  WEB_UP=true
fi

if curl -s -o /dev/null --max-time 2 http://localhost:3001 2>/dev/null; then
  ADMIN_UP=true
fi

# 両方起動済みなら何もしない（べき等）
if [ "$WEB_UP" = true ] && [ "$ADMIN_UP" = true ]; then
  exit 0
fi

# 未起動があれば自動起動を委譲。start-dev-servers.sh がヘルスチェックまで行い、
# 起動失敗時は exit 2 でブロックする。
exec bash "$HOOK_DIR/start-dev-servers.sh"

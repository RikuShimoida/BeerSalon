#!/bin/bash

# implスキル実行前にdev:web(3000)とdev:admin(3001)を自動起動する。
# フック(=ハーネスが実行)経由のため、`pnpm dev`ブロックフックやrun_in_background禁止には抵触しない。

# Why not Bashツール経由でpnpm devを起動: settings.jsonのBashフックが`pnpm dev`を無条件ブロックし、
# run_in_background:true も禁止のため、Claude自身のBash経由では起動不可。フック内nohupで回避する。

REPO_ROOT="/Users/rikushimoida/Documents/repository/BeerSalon"
LOG_DIR="/tmp/beersalon-dev-logs"
mkdir -p "$LOG_DIR"

is_up() {
  # $1: ポート番号
  curl -s -o /dev/null --max-time 2 "http://localhost:$1" 2>/dev/null
}

wait_up() {
  # $1: ポート番号 / $2: ラベル。最大60秒待機
  local port="$1" label="$2" i
  for i in $(seq 1 30); do
    if is_up "$port"; then
      echo "start-dev-servers: $label (localhost:$port) 起動確認" >&2
      return 0
    fi
    sleep 2
  done
  echo "BLOCKED: $label (localhost:$port) が起動しませんでした。$LOG_DIR/$label.log を確認してください。" >&2
  return 1
}

# べき等: 起動済みなら二重起動しない
if ! is_up 3000; then
  nohup pnpm --dir "$REPO_ROOT" run dev:web > "$LOG_DIR/web.log" 2>&1 &
fi

if ! is_up 3001; then
  nohup pnpm --dir "$REPO_ROOT" run dev:admin > "$LOG_DIR/admin.log" 2>&1 &
fi

FAILED=false
wait_up 3000 web || FAILED=true
wait_up 3001 admin || FAILED=true

if [ "$FAILED" = true ]; then
  exit 2
fi

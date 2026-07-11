#!/bin/bash

# implスキル実行前にdev:web(3000)とdev:admin(3001)が起動済みか確認する

WEB_UP=false
ADMIN_UP=false

if curl -s -o /dev/null -w '' --max-time 2 http://localhost:3000 2>/dev/null; then
  WEB_UP=true
fi

if curl -s -o /dev/null -w '' --max-time 2 http://localhost:3001 2>/dev/null; then
  ADMIN_UP=true
fi

if [ "$WEB_UP" = false ] && [ "$ADMIN_UP" = false ]; then
  echo 'BLOCKED: dev:web(localhost:3000)とdev:admin(localhost:3001)が両方起動していません。実装タスクを開始する前に、別ターミナルで `pnpm run dev:web` と `pnpm run dev:admin` を起動してください。' >&2
  exit 2
elif [ "$WEB_UP" = false ]; then
  echo 'BLOCKED: dev:web(localhost:3000)が起動していません。実装タスクを開始する前に、別ターミナルで `pnpm run dev:web` を起動してください。' >&2
  exit 2
elif [ "$ADMIN_UP" = false ]; then
  echo 'BLOCKED: dev:admin(localhost:3001)が起動していません。実装タスクを開始する前に、別ターミナルで `pnpm run dev:admin` を起動してください。' >&2
  exit 2
fi

#!/bin/bash

# implementスキル実行前にPlaywright MCPサーバーが起動済みか確認する

if ! pgrep -f "@playwright/mcp" > /dev/null 2>&1; then
  echo 'BLOCKED: Playwright MCPサーバーが起動していません。E2Eテストに必要です。Claude Codeの設定でPlaywright MCPプラグインが有効になっていることを確認し、再起動してください。' >&2
  exit 2
fi

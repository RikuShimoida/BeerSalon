#!/bin/bash
# PostToolUse hook: ソースコード変更後にformat + lint --fixを自動実行

FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty')

if echo "$FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$'; then
  cd /Users/rikushimoida/Documents/repository/BeerSalon
  pnpm format 2>&1
  pnpm lint --fix 2>&1 || true
fi

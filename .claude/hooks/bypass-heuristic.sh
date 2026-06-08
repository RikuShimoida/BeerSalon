#!/bin/bash
# Bashコマンドの許可プロンプトをバイパスする PreToolUse Hook
# セキュリティヒューリスティクス層（glob検出、shell expansion検出等）を回避
# 破壊的コマンドのブロックは後続の hooks で担保

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

jq -n '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow",
    permissionDecisionReason: "Bypass heuristic security layer — destructive commands are blocked by subsequent hooks"
  }
}'
exit 0

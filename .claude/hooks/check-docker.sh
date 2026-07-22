#!/bin/bash

# implスキル実行前にDocker(=Supabaseローカルスタックの実体)が起動済みか確認する。
# 未起動なら実装タスクをブロックする（devサーバー自動起動の前提を保証するため）。

# Why not `open -a Docker` で自動起動: デーモン起動は数十秒かかり非決定的。
# ブロックに留め、ユーザーにDocker Desktop起動を促す方が安全。

if ! command -v docker > /dev/null 2>&1; then
  echo 'BLOCKED: docker コマンドが見つかりません。Docker Desktop をインストール・起動してから再実行してください。' >&2
  exit 2
fi

if ! docker info > /dev/null 2>&1; then
  echo 'BLOCKED: Docker デーモンが起動していません。Docker Desktop を起動してから impl を再実行してください。ローカルSupabase(54421)の起動にDockerが必要です。' >&2
  exit 2
fi

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qi supabase; then
  echo 'BLOCKED: Supabaseコンテナが起動していません。プロジェクトルートで `supabase start` を実行してから impl を再実行してください。' >&2
  exit 2
fi

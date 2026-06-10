#!/usr/bin/env bash
# Beer Salon - E2E Local Setup
#
# ローカルでスモークE2E（web 5本 / admin 2本）を緑にするためのワンコマンドセットアップ。
# 内容: Docker起動チェック → Supabase起動チェック → 環境変数自動エクスポート
#        → seed.sql / seed.e2e.sql をDocker exec経由でpsql投入 → seed-e2e.ts実行
#
# 冪等性: 既存の `ON CONFLICT DO NOTHING` / seed-e2e.ts の `if exists then skip` により担保。
#
# Why not: ローカル開発機にpsqlが必ずインストールされているとは限らないため、
#          DockerコンテナのpsqlをdockerexecAPIごしに叩くアプローチを採用。

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
	printf "\033[1;34m[e2e-setup]\033[0m %s\n" "$1"
}

warn() {
	printf "\033[1;33m[e2e-setup]\033[0m %s\n" "$1" >&2
}

err() {
	printf "\033[1;31m[e2e-setup]\033[0m %s\n" "$1" >&2
}

# 1. Docker 起動チェック
log "Docker の起動状態を確認..."
if ! docker info >/dev/null 2>&1; then
	err "Docker が起動していません。Docker Desktop を起動してから再実行してください。"
	exit 1
fi
log "Docker は起動済み"

# 2. Supabase 起動チェック
log "Supabase ローカルスタックの起動状態を確認..."
if ! supabase status >/dev/null 2>&1; then
	log "Supabase は未起動です。supabase start を実行します..."
	supabase start
else
	log "Supabase は起動済み"
fi

# 3. Supabase DB コンテナ名を動的取得
# Why not: プロジェクト名（BeerSalon）依存のコンテナ名をハードコードすると、
#          クローン先のディレクトリ名が異なる場合に動かなくなるため動的検出する。
log "Supabase DB コンテナを検出..."
SUPABASE_DB_CONTAINER="$(docker ps \
	--filter "label=com.supabase.cli.project=BeerSalon" \
	--filter "name=supabase_db" \
	--format "{{.Names}}" | head -n 1)"

if [ -z "$SUPABASE_DB_CONTAINER" ]; then
	err "Supabase DB コンテナが見つかりません。supabase start の出力を確認してください。"
	exit 1
fi
log "Supabase DB コンテナ: $SUPABASE_DB_CONTAINER"

# 4. supabase status -o env から必要キーを取得しエクスポート
log "Supabase 環境変数を取得..."
SUPABASE_ENV="$(supabase status -o env \
	--override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
	--override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY \
	--override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY \
	2>/dev/null)"

# 値はダブルクォート付きで返ってくるため eval で取り込む
eval "$SUPABASE_ENV"

export NEXT_PUBLIC_SUPABASE_URL
export NEXT_PUBLIC_SUPABASE_ANON_KEY
export SUPABASE_SERVICE_ROLE_KEY
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54422/postgres}"

# 5. .env.e2e.local の準備（apps/web, apps/admin の両方）
# Why not: 機密値（パスワード）と通常の Supabase 接続情報を混ぜると、
#          .env.local の Git 管理ポリシー変更時にE2E実行が壊れやすいため分離。
for app in web admin; do
	env_file="apps/${app}/.env.e2e.local"
	example_file="apps/${app}/.env.e2e.local.example"
	if [ ! -f "$env_file" ]; then
		if [ -f "$example_file" ]; then
			log "${env_file} が存在しないため ${example_file} からコピー..."
			cp "$example_file" "$env_file"
		else
			warn "${env_file} も ${example_file} も存在しません。スキップ。"
		fi
	fi
done

# 6. .env.e2e.local から E2E_TEST_USER_PASSWORD を読み込む（apps/web 優先）
ENV_E2E_FILE="apps/web/.env.e2e.local"
if [ -f "$ENV_E2E_FILE" ]; then
	log "${ENV_E2E_FILE} から E2E 用パスワードを読み込み..."
	# shellcheck disable=SC1090
	set -a
	. "$ENV_E2E_FILE"
	set +a
fi

if [ -z "${E2E_TEST_USER_PASSWORD:-}" ]; then
	err "E2E_TEST_USER_PASSWORD が未設定です。${ENV_E2E_FILE} を確認してください。"
	exit 1
fi

# 7. seed.sql と seed.e2e.sql を docker exec 経由で投入
log "seed.sql を投入 (docker exec)..."
docker exec -i "$SUPABASE_DB_CONTAINER" \
	psql -v ON_ERROR_STOP=1 -U postgres -d postgres < supabase/seed.sql >/dev/null

log "seed.e2e.sql を投入 (docker exec)..."
docker exec -i "$SUPABASE_DB_CONTAINER" \
	psql -v ON_ERROR_STOP=1 -U postgres -d postgres < supabase/seed.e2e.sql >/dev/null

# 8. seed-e2e.ts を実行 (Supabase Auth ユーザー作成)
log "Supabase Auth に E2E テストユーザーを作成 (seed-e2e.ts)..."
pnpm --filter @beersalon/web exec tsx ../../prisma/seed-e2e.ts

log "✅ ローカル E2E セットアップ完了"
log ""
log "次のコマンドでスモーク E2E を実行:"
log "  pnpm e2e:smoke:web"
log "  pnpm e2e:smoke:admin"

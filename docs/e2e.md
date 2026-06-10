# E2E テスト運用ガイド

Beer Salon の E2E テスト（Playwright）の実行方法と CI 連携について。

## テストの分類

| 分類 | 本数 | トリガー | 目的 |
|------|------|----------|------|
| スモーク | 7本（web 5 / admin 2） | PR (`main` / `develop` 向け) | リグレッション最小検知 |
| フル | 28本 | Step 3 で nightly に乗せる予定 | 全シナリオの動作保証 |

**スモーク7本は固定**。本数を増やす場合は ADR 経由でレビューを必須とすること。

### スモーク対象テスト

#### apps/web（5本）

| ファイル | テスト名 |
|---------|---------|
| `apps/web/e2e/auth-login.spec.ts` | ログインページにアクセスできる |
| `apps/web/e2e/auth-signup.spec.ts` | メールアドレスとパスワードの入力欄が表示される |
| `apps/web/e2e/bar-search.spec.ts` | 店舗一覧エリアが表示される |
| `apps/web/e2e/bar-detail-tabs.spec.ts` | 店舗詳細ページにアクセスすると店舗名とお気に入りボタンが表示される |
| `apps/web/e2e/post-create.spec.ts` | 投稿本文入力フォームが表示される |

#### apps/admin（2本）

| ファイル | テスト名 |
|---------|---------|
| `apps/admin/tests/auth.spec.ts` | should display login page with email and password fields |
| `apps/admin/tests/bars.spec.ts` | should display bars list for bar owner |

スモーク対象は `@smoke` タグで識別する。`pnpm e2e:smoke:web` / `pnpm e2e:smoke:admin` は `--grep @smoke` で絞り込んで実行する。

## ローカルでの実行

### ワンコマンドセットアップ（推奨）

新規 clone 直後でも以下の3コマンドでスモーク E2E（7本）が緑になる。

```bash
# 1. Supabase ローカルスタックを起動（migrations 自動適用）
supabase start

# 2. seed.sql / seed.e2e.sql 投入 + Supabase Auth テストユーザー作成
pnpm e2e:setup

# 3. スモーク E2E を実行（web 5本 + admin 2本）
pnpm e2e:smoke
```

`pnpm e2e:smoke` は `pnpm e2e:smoke:web && pnpm e2e:smoke:admin` のショートカット。
個別に実行したい場合は `pnpm e2e:smoke:web` / `pnpm e2e:smoke:admin` を使う。

#### `pnpm e2e:setup` の動作

`scripts/e2e-setup.sh` が以下を順番に実行する:

1. Docker / Supabase の起動状態チェック（未起動なら自動で `supabase start`）
2. Supabase DB コンテナ名を動的取得（`docker ps --filter label=com.supabase.cli.project=BeerSalon`）
3. `supabase status -o env` から接続情報をシェル変数に展開
4. `.env.e2e.local` が無ければ `.env.e2e.local.example` からコピー（初回セットアップ自動化）
5. `supabase/seed.sql` と `supabase/seed.e2e.sql` を **`docker exec -i` 経由で psql 投入**（ローカルに psql 不要）
6. `prisma/seed-e2e.ts` で `smoke-user@example.test` の Supabase Auth ユーザーを作成

冪等性は SQL の `ON CONFLICT DO NOTHING` と `seed-e2e.ts` の存在チェックで担保されているため、
何度実行しても安全。

### 環境変数の設定（`.env.e2e.local`）

E2E 専用のパスワードは `.env.local` と分離し、`.env.e2e.local` で管理する。

| ファイル | 用途 |
|---------|------|
| `apps/web/.env.e2e.local` | `E2E_TEST_USER_PASSWORD`（Supabase Auth スモークユーザー） |
| `apps/admin/.env.e2e.local` | `E2E_ADMIN_PASSWORD`（`seed.e2e.sql` の bcrypt ハッシュに対応する平文） |

実体ファイルは `.gitignore` 対象。サンプルは `apps/web/.env.e2e.local.example` /
`apps/admin/.env.e2e.local.example` をリポジトリに同梱しているため、
`pnpm e2e:setup` を実行すると自動的にコピー作成される。

Playwright config（`apps/web/playwright.config.ts` / `apps/admin/playwright.config.ts`）は
`.env.local` → `.env.e2e.local`（override）の順で `dotenv` で読み込むため、
コマンドラインで毎回環境変数を渡す必要はない。

### スモーク実行（個別）

```bash
# web のスモーク 5 本
pnpm e2e:smoke:web

# admin のスモーク 2 本
pnpm e2e:smoke:admin

# Playwright UI モード（対話的にテストを選択して実行）
pnpm e2e:smoke:web --ui
pnpm e2e:smoke:admin --ui
```

### フル実行

```bash
# web の全テスト
pnpm e2e:web

# admin の全テスト
pnpm e2e:admin
```

### 手動で psql 相当を叩きたい場合

`pnpm e2e:setup` を使えば不要だが、デバッグ目的で個別に SQL を実行したい場合は
Supabase の DB コンテナ経由で `psql` を叩く（ローカル `psql` のインストール不要）。

```bash
# DB コンテナ名を取得
SUPABASE_DB=$(docker ps \
  --filter "label=com.supabase.cli.project=BeerSalon" \
  --filter "name=supabase_db" \
  --format "{{.Names}}")

# seed.sql 投入
docker exec -i "$SUPABASE_DB" psql -U postgres -d postgres < supabase/seed.sql

# seed.e2e.sql 投入
docker exec -i "$SUPABASE_DB" psql -U postgres -d postgres < supabase/seed.e2e.sql

# 任意のクエリ
docker exec -i "$SUPABASE_DB" psql -U postgres -d postgres -c "SELECT count(*) FROM bars;"
```

## CI での実行

`.github/workflows/e2e.yml` で `pull_request` トリガーで自動実行される。

### 必要な GitHub Secrets

| Secret 名 | 用途 |
|----------|------|
| `E2E_SUPABASE_ANON_KEY` | Supabase ローカルの anon key |
| `E2E_SUPABASE_SERVICE_ROLE_KEY` | Supabase Auth 管理 API 用 |
| `E2E_JWT_SECRET` | admin の JWT 署名鍵 |
| `E2E_TEST_USER_PASSWORD` | `smoke-user@example.test` の平文パスワード |
| `E2E_ADMIN_PASSWORD` | `seed.e2e.sql` 内 admin_users のパスワード（参考） |

Supabase ローカルの anon key / service_role key は固定値だが、平文をリポジトリにコミットしないため Secrets で管理する。

### ワークフロー全体像

1. `pnpm install`
2. `prisma generate`
3. Next.js / Playwright のキャッシュ復元
4. composite action `.github/actions/setup-db`
   - `supabase start`（`supabase/migrations/*.sql` を自動適用）
   - `supabase/seed.e2e.sql` 投入
   - `prisma/seed-e2e.ts` で Supabase Auth ユーザー作成
5. `pnpm e2e:smoke:web` または `pnpm e2e:smoke:admin`
6. 失敗時は Playwright の HTML レポートを artifact として保存

## テスト追加・変更時の注意

- スモーク7本を超える追加は ADR を起こしてレビューを必須化すること
- 新しい E2E テストを書いたら、まず `@smoke` を付けずに作成し、フル実行に乗せること
- スモークに格上げする際は「失敗時に PR ブロッカーになる価値があるか」を考慮すること
- 投稿作成 smoke は **フォーム表示・バリデーション** までを対象とする。Supabase Storage への画像アップロード／実投稿は Step 3 でフル E2E に乗せる

## トラブルシューティング

### Supabase が起動しない

- Docker が立ち上がっているか確認
- `supabase stop` してから再度 `supabase start`

### bcrypt パスワードハッシュを再生成したい

```bash
node -e "console.log(require('./apps/admin/node_modules/bcryptjs').hashSync('<新パスワード>', 10))"
```

生成したハッシュを `supabase/seed.e2e.sql` の `password_hash` に反映する。

### Playwright のブラウザインストールでこける

```bash
pnpm --filter @beersalon/web exec playwright install --with-deps chromium
```

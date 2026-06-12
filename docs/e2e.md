# E2E テスト運用ガイド

Beer Salon の E2E テスト（Playwright）の実行方法と CI 連携について。

## 方針: テストピラミッドの 3 層構成

Beer Salon ではテストピラミッドの原則に従い、以下の 3 層でテストを構成する。
E2E は壊れやすく実行時間も長いため **スモーク観点の 7本（web 5 / admin 2）に限定** し、
それ以上の網羅は UT および Integration（実 Supabase に対する Server Action 検証）で担保する。

| レイヤ | 担保すべき範囲 | 本数の目安 |
|--------|---------------|-----------|
| UT（Vitest） | 純粋ロジック / バリデーション / コンポーネント / middleware 判定 | 30〜80本 |
| Integration（Vitest + 実 Supabase） | Server Action の DB 副作用 / Prisma クエリ / RLS / GRANT | 20〜30本（現状 8〜12 本、最終目標 20〜30 本） |
| E2E（Playwright） | 主要画面のスモーク表示 | 7本固定 |

新しい E2E テストを追加する場合は、UT および Integration で代替できないか検討した上で、
必要性をレビューで合意してから追加すること。

## E2E テスト一覧（7本）

### apps/web（5本）

| ファイル | テスト名 |
|---------|---------|
| `apps/web/e2e/auth-login.spec.ts` | ログインページにアクセスできる |
| `apps/web/e2e/auth-signup.spec.ts` | メールアドレスとパスワードの入力欄が表示される |
| `apps/web/e2e/bar-search.spec.ts` | 店舗一覧エリアが表示される |
| `apps/web/e2e/bar-detail-tabs.spec.ts` | 店舗詳細ページにアクセスすると店舗名とお気に入りボタンが表示される |
| `apps/web/e2e/post-create.spec.ts` | 投稿本文入力フォームが表示される |

### apps/admin（2本）

| ファイル | テスト名 |
|---------|---------|
| `apps/admin/tests/auth.spec.ts` | should display login page with bar manage ID and password fields |
| `apps/admin/tests/bars.spec.ts` | should display bars list for admin |

## UT / Integration でカバーする範囲

E2E から削った観点は、以下の UT および Integration テストで代替している。
Integration（`*.integration.test.ts`）は **実 Supabase ローカル**（54421）に接続して
Server Action の DB 副作用・Prisma クエリの `include` 網羅性・RLS / GRANT などを検証する。
モック前提の UT では原理的に検知できない領域を中段で押さえることが目的。

| 観点 | UT ファイル |
|------|------------|
| 未認証時の保護ルート → `/login` リダイレクト（web） | `apps/web/src/middleware.test.ts` |
| `/login`・`/signup` の認証済みリダイレクト（web） | `apps/web/src/middleware.test.ts` |
| プロフィール未作成時の `/signup/profile` リダイレクト | `apps/web/src/middleware.test.ts` |
| パスワードハッシュ生成・検証 / JWT 発行・検証 / アクセス制御（admin） | `apps/admin/src/lib/auth.test.ts` |
| ログイン API（バリデーション・認証失敗・成功時のCookie発行） | `apps/admin/src/app/api/auth/login/route.test.ts` |
| ログアウト API（Cookie削除） | `apps/admin/src/app/api/auth/logout/route.test.ts` |
| セッション取得 API（200 / 401 / 500） | `apps/admin/src/app/api/auth/session/route.test.ts` |
| admin middleware の `/login` 認証済みリダイレクト | `apps/admin/src/__tests__/middleware.test.ts` |
| Server Actions / フォームバリデーション | `apps/web/src/**/*.test.{ts,tsx}` |

## ローカルでの実行

### ワンコマンドセットアップ（推奨）

新規 clone 直後でも以下の 3 コマンドで E2E（7本）が緑になる。

```bash
# 1. Supabase ローカルスタックを起動（migrations 自動適用）
supabase start

# 2. seed.e2e.sql 投入 + Supabase Auth テストユーザー作成
pnpm e2e:setup

# 3. E2E を実行（web 5本 + admin 2本）
pnpm e2e
```

`pnpm e2e` は `pnpm e2e:web && pnpm e2e:admin` のショートカット。
個別に実行したい場合は `pnpm e2e:web` / `pnpm e2e:admin` を使う。

#### `pnpm e2e:setup` の動作

`scripts/e2e-setup.sh` が以下を順番に実行する:

1. Docker / Supabase の起動状態チェック（未起動なら自動で `supabase start`）
2. Supabase DB コンテナ名を動的取得（`docker ps --filter label=com.supabase.cli.project=BeerSalon`）
3. `supabase status -o env` から接続情報をシェル変数に展開
4. `.env.e2e.local` が無ければ `.env.e2e.local.example` からコピー（初回セットアップ自動化）
5. `supabase/seed.e2e.sql` を **`docker exec -i` 経由で psql 投入**（ローカルに psql 不要）
6. `prisma/seed-e2e.ts` で `smoke-user@example.test` の Supabase Auth ユーザーを作成

冪等性は SQL の `ON CONFLICT DO NOTHING` と `seed-e2e.ts` の存在チェックで担保されているため、
何度実行しても安全。

> **重要**: 旧版ではローカル限定で `seed.sql`（本番想定データ）も投入していたが、
> CI 側は `seed.e2e.sql` のみを投入するため、ローカルだけ別データになる不具合が頻発していた。
> 現在は CI / ローカル共に `seed.e2e.sql` のみを投入する形に統一している。
> 本番想定データを別途投入したい場合は `pnpm seed:dev`（ローカル psql 必須）を実行すること。

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

### 個別実行

```bash
# web の E2E 5 本
pnpm e2e:web

# admin の E2E 2 本
pnpm e2e:admin

# Playwright UI モード（対話的にテストを選択して実行）
pnpm e2e:web --ui
pnpm e2e:admin --ui
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
5. `pnpm e2e:web` または `pnpm e2e:admin`
6. 失敗時は Playwright の HTML レポートを artifact として保存

## テスト追加・変更時の注意

- E2E は 7本に固定。追加する場合はテストピラミッドの原則に照らして UT で代替できないか検討する
- E2E を追加する場合はレビューで合意してから本数を増やすこと
- 既存 7本に手を入れる場合も、何のスモークなのかが明確に保たれるよう注意する

### バー ID をテストで使う場合

E2E から `/bars/[barId]` にアクセスする場合は、必ず `seed.e2e.sql` で固定投入される
`id=100001`（E2Eテストバー静岡）または `id=100002`（E2Eテストバー東京）を使うこと。

`id=1` は本番想定 seed（`seed.sql`）が投入されたローカル環境では存在するが、CI 環境では
`seed.e2e.sql` のみが投入されるため存在せず、404 になってテストが失敗する。
ローカルだけ通って CI で落ちる典型パターンなので注意する。

### `loginAsSmokeUser` の URL 検証

`apps/web/e2e/helpers/auth.ts` の `loginAsSmokeUser` は、ログイン後に `/` への到達だけでなく
「`/signup/profile` にリダイレクトされていないこと」も検証する。これは middleware が
`user_profiles` を取得できなかった場合に `/signup/profile` へ飛ばすため、原因を明示的に
失敗メッセージとして出すための保護である。失敗した場合はまず `seed-e2e.ts` の結果と
`user_profiles` テーブルに smoke-user の行が存在するかを確認すること。

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

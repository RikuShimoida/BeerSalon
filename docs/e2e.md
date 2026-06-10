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

### 前提

1. Supabase をローカルで起動（`supabase/migrations/*.sql` が自動適用される）
   ```bash
   supabase start
   ```
2. 環境変数を設定（`.env.local` を `apps/web/`、`apps/admin/` の両方で用意）
3. 本番 seed と E2E seed を適用
   ```bash
   psql -h 127.0.0.1 -p 54422 -U postgres -d postgres -f supabase/seed.sql
   psql -h 127.0.0.1 -p 54422 -U postgres -d postgres -f supabase/seed.e2e.sql
   ```
4. Supabase Auth に E2E テストユーザーを作成
   ```bash
   E2E_TEST_USER_PASSWORD=<任意のパスワード> \
   pnpm --filter @beersalon/web exec tsx ../../prisma/seed-e2e.ts
   ```

### スモーク実行

```bash
# web のスモークだけ
pnpm e2e:smoke:web

# admin のスモークだけ
pnpm e2e:smoke:admin
```

### フル実行

```bash
# web の全テスト
pnpm e2e:web

# admin の全テスト
pnpm e2e:admin
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

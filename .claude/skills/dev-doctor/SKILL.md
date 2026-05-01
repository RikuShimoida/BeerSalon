---
name: dev-doctor
description: devサーバーが起動しない・localhostにアクセスできない問題を体系的に診断する。ポート競合、依存関係、環境変数、Prisma、キャッシュ、Supabaseを順にチェック。
when_to_use: 「devサーバーが動かない」「localhost見れない」「ページが表示されない」「dev-doctor」「環境が壊れた」「サービスがぶっ壊れた」などの発言時
context: fork
agent: dev-doctor
---

## Dev環境診断フロー

引数: `$ARGUMENTS`（対象アプリ。省略時は両方チェック。例: web, admin）

### Phase 1: クイックヘルスチェック

以下のコマンドを実行し、環境の基本的な健全性を確認する:

1. **ランタイム確認**: `node -v && pnpm -v`
2. **ポート確認**:
   - 対象が web または両方: `lsof -i :3000 -P -n`
   - 対象が admin または両方: `lsof -i :3001 -P -n`
3. **node_modules確認**: `ls -d apps/web/node_modules apps/admin/node_modules 2>/dev/null`
4. **環境変数確認**: `ls apps/web/.env.local apps/admin/.env.local 2>/dev/null`

問題が見つかった場合は即座にユーザーに報告し、修復提案を行う。

### Phase 2: 依存関係・ビルド整合性

1. **lockfile同期確認**: `pnpm install --frozen-lockfile --dry-run 2>&1`
2. **Prismaクライアント確認**: `ls apps/web/src/generated/prisma/index.js 2>/dev/null`
3. **TypeScript型チェック**: `pnpm --filter @beersalon/web exec tsc --noEmit 2>&1 | tail -30`
4. **.nextキャッシュ確認**: `ls apps/web/.next/BUILD_ID 2>/dev/null`

### Phase 3: インフラ確認（Supabase/DB）

1. **Docker確認**: `docker ps --format '{{.Names}}' 2>/dev/null | grep -i supabase`
2. **Supabase稼働確認**: `npx supabase status 2>&1`
3. **DB接続確認**: `curl -s http://127.0.0.1:54421/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" -o /dev/null -w '%{http_code}'`
4. **ポート整合性**: `.env.local` のSUPABASE_URLが54421を指しているか確認

### Phase 4: キャッシュ・状態確認

1. **Turboキャッシュ**: `.turbo/` ディレクトリの状態確認
2. **.nextの鮮度**: BUILD_IDの最終更新日時を確認

### 診断結果の報告

以下のフォーマットで報告する:

```
## 診断結果

### 環境サマリ
- Node.js: vX.X.X
- pnpm: vX.X.X
- Supabase: 稼働中/停止中
- ポート3000: 空き/使用中（プロセス名）
- ポート3001: 空き/使用中（プロセス名）

### 検出された問題
1. **[High/Medium/Low]** 問題の説明
   - 原因: ...
   - 修復コマンド: `...`

### 推奨アクション（優先順位順）
1. `修復コマンド` — 説明
2. ユーザーが `pnpm dev:web` / `pnpm dev:admin` を実行
```

### 修復実行のルール

- 非破壊的操作（`pnpm install`、Prisma generate、`supabase start`）は承認なしで実行可
- 破壊的操作（`rm -rf`、`kill`等）は目的・影響範囲・リスクを明示し、ユーザーの承認後に実行
- 修復後は再度ヘルスチェックを実行し、問題が解消されたことを確認する

### 禁止事項

- `pnpm dev` / `pnpm dev:web` / `pnpm dev:admin` / `npm run dev` の実行（ユーザーが起動する）
- `run_in_background: true` の使用
- ポート54321の使用（正しいポート: 54421）
- `supabase init` の実行
- ユーザー承認なしでの破壊的操作の実行
- `.env` ファイルの直接編集（ユーザーに手順を案内する）

---
name: access-problem
description: pnpm run dev実行後にページが開けない問題を診断。ポート競合、Supabase接続不良、環境変数不備、node_modules不在をチェック。
when_to_use: 「ページが開けない」「localhost見れない」「アクセスできない」「画面が表示されない」「devサーバーが動かない」「access-problem」などの発言時
context: fork
agent: dev-doctor
---

## ページアクセス不能の診断フロー

引数: `$ARGUMENTS`（対象アプリ。省略時は両方チェック。例: web, admin）

### Phase 1: ランタイム・基盤チェック

以下のコマンドを実行し、環境の基本的な健全性を確認する:

1. **ランタイム確認**: `node -v && pnpm -v`
2. **node_modules確認**: `ls -d apps/web/node_modules apps/admin/node_modules 2>/dev/null`
3. **環境変数確認**: `ls apps/web/.env.local apps/admin/.env.local 2>/dev/null`

問題が見つかった場合は即座にユーザーに報告し、修復提案を行う。

### Phase 2: ポート・プロセス確認

1. **ポート3000確認**（対象が web または両方）: `lsof -i :3000 -P -n`
2. **ポート3001確認**（対象が admin または両方）: `lsof -i :3001 -P -n`
3. **競合プロセスの特定**: ポートを占有しているプロセス名・PIDを報告

### Phase 3: インフラ確認（Supabase/DB）

1. **Docker確認**: `docker ps --format '{{.Names}}' 2>/dev/null | grep -i supabase`
2. **Supabase稼働確認**: `npx supabase status 2>&1`
3. **DB接続確認**: `curl -s http://127.0.0.1:54421/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" -o /dev/null -w '%{http_code}'`
4. **ポート整合性**: `.env.local` のSUPABASE_URLが54421を指しているか確認

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

- 非破壊的操作（`pnpm install`、`npx supabase start`）は承認なしで実行可
- 破壊的操作（`kill`、`rm -rf node_modules`等）は目的・影響範囲・リスクを明示し、ユーザーの承認後に実行
- 修復後は再度ヘルスチェックを実行し、問題が解消されたことを確認する

### 禁止事項

- `pnpm dev` / `pnpm dev:web` / `pnpm dev:admin` / `npm run dev` の実行（ユーザーが起動する）
- `run_in_background: true` の使用
- ポート54321の使用（正しいポート: 54421）
- `supabase init` の実行
- ユーザー承認なしでの破壊的操作の実行
- `.env` ファイルの直接編集（ユーザーに手順を案内する）

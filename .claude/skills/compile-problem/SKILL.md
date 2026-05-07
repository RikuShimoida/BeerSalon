---
name: compile-problem
description: ページは開けるがコンパイルが遅く画面遷移が重い問題を診断。キャッシュ、Prisma、TypeScript、依存関係をチェック。
when_to_use: 「コンパイルが遅い」「画面遷移が遅い」「ページ遷移が重い」「ビルドが遅い」「compile-problem」「コンパイルエラー」「型エラー」「Prismaエラー」などの発言時
context: fork
agent: dev-doctor
---

## コンパイル遅延の診断フロー

引数: `$ARGUMENTS`（対象アプリ。省略時は両方チェック。例: web, admin）

### Phase 1: キャッシュ状態確認

1. **.nextキャッシュの存在**: `ls -la apps/web/.next/BUILD_ID apps/admin/.next/BUILD_ID 2>/dev/null`
2. **.nextキャッシュの鮮度**: `stat -f '%Sm' apps/web/.next/BUILD_ID 2>/dev/null`
3. **.nextキャッシュサイズ**: `du -sh apps/web/.next apps/admin/.next 2>/dev/null`
4. **Turboキャッシュ状態**: `ls -la .turbo/ apps/web/.turbo/ apps/admin/.turbo/ 2>/dev/null`

キャッシュが異常に肥大化（500MB超）している場合や、古すぎる場合は問題として報告する。

### Phase 2: 依存関係・ビルド整合性

1. **lockfile同期確認**: `pnpm install --frozen-lockfile --dry-run 2>&1`
2. **Prismaクライアント確認**: `ls apps/web/src/generated/prisma/index.js 2>/dev/null`
3. **Prismaクライアントの鮮度**: `schema.prisma` の更新日時と `generated/prisma` の更新日時を比較
   - `stat -f '%Sm' prisma/schema.prisma 2>/dev/null`
   - `stat -f '%Sm' apps/web/src/generated/prisma/index.js 2>/dev/null`
4. **TypeScript型チェック**: `pnpm --filter @beersalon/web exec tsc --noEmit 2>&1 | tail -30`

### Phase 3: パフォーマンス要因の特定

1. **node_modulesサイズ確認**: `du -sh node_modules apps/web/node_modules apps/admin/node_modules 2>/dev/null`
2. **Turbo設定の確認**: `turbo.json` の cache 設定が適切か確認
3. **Next.js設定確認**: `next.config.ts` の設定（swcMinify、transpilePackages等）を確認

### 診断結果の報告

以下のフォーマットで報告する:

```
## 診断結果

### 環境サマリ
- .nextキャッシュサイズ: X MB
- .nextキャッシュ最終更新: YYYY-MM-DD HH:MM
- Turboキャッシュ: 存在/不在
- Prismaクライアント: 最新/要再生成
- TypeScript: エラーなし/エラーあり

### 検出された問題
1. **[High/Medium/Low]** 問題の説明
   - 原因: ...
   - 修復コマンド: `...`

### 推奨アクション（優先順位順）
1. `修復コマンド` — 説明
```

### 修復実行のルール

- 非破壊的操作は承認なしで実行可:
  - `pnpm install`
  - Prismaクライアント再生成: `pnpm --filter @beersalon/web exec prisma generate --schema=../../prisma/schema.prisma`
- 破壊的操作は目的・影響範囲・リスクを明示し、ユーザーの承認後に実行:
  - `.next`キャッシュ削除: `rm -rf apps/web/.next apps/admin/.next`
  - Turboキャッシュ削除: `rm -rf .turbo apps/*/.turbo`
  - node_modules再インストール: `rm -rf node_modules apps/*/node_modules && pnpm install`
- 修復後は再度チェックを実行し、問題が解消されたことを確認する

### 禁止事項

- `pnpm dev` / `pnpm dev:web` / `pnpm dev:admin` / `npm run dev` の実行（ユーザーが起動する）
- `run_in_background: true` の使用
- ポート54321の使用（正しいポート: 54421）
- `supabase init` の実行
- ユーザー承認なしでの破壊的操作の実行
- `.env` ファイルの直接編集（ユーザーに手順を案内する）

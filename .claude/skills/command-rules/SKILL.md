---
name: command-rules
description: コマンド実行の権限委譲ルール。確認不要/要確認コマンドの一覧と判断基準。
when_to_use: コマンド実行時、破壊的操作の検討時、「実行していい？」などの発言時
---

## コマンド実行に関する権限委譲ルール

### 原則

- **安全で可逆なコマンド**については、ユーザーへの確認なしで実行してよい
- **不可逆・破壊的・外部影響が大きいコマンド**のみ、事前に確認を行うこと

### 確認不要なコマンド例（即時実行してよい）

- `pnpm install` / `pnpm add` / `pnpm build` / `pnpm dev`
- `pnpm lint` / `pnpm lint:fix` / `pnpm format`
- `pnpm test` / `pnpm e2e`
- `npx prisma generate` / `npx prisma migrate dev`
- `supabase start` / `supabase stop` / `supabase status`
- `git status` / `git diff` / `git log` / `git branch`
- `git checkout -b <branch>` / `git commit` / `git push`
- `gh issue create` / `gh pr create`

### 事前確認が必要なコマンド例

- `rm -rf`
- `git reset --hard` / `git rebase` / `git push --force` / `git branch -D`
- `prisma migrate reset` / `supabase db reset`
- `.env` や設定ファイルの削除・上書き
- 外部サービスへの課金・公開設定変更を伴う操作
- 本番環境への直接デプロイ操作

### 不明な場合の判断基準

- **「ローカルで試して失敗してもやり直せるか？」**
  - YES → 確認不要
  - NO → 必ず確認

このルールに従い、不要な確認は行わず、作業を中断させないこと。

## コマンド実行に関する権限委譲ルール

### 原則

- **安全で可逆なコマンド**については、ユーザーへの確認なしで実行してよい
- **不可逆・破壊的・外部影響が大きいコマンド**のみ、事前に確認を行うこと

### 確認不要なコマンド例（即時実行してよい）

- `pnpm install` / `pnpm add` / `pnpm build`
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

## 確認時の説明義務

確認を求める際は、必ず次の内容を明示すること。

1. **実行しようとしている具体的なコマンド**（省略せず全文記載）
2. **そのコマンドで何をしようとしているのか**（影響するファイル・設定・状態）
3. **なぜそのコマンドが必要なのか**（現在の問題や目的との関係）
4. **想定されるリスクや影響範囲**（ローカルのみか、Git履歴・DB・環境設定への影響有無、復旧可能性）

### 禁止事項

- 「実行してもいいですか？」のみの質問
- 目的や影響が不明確なままの確認
- 判断材料をユーザーに丸投げする質問

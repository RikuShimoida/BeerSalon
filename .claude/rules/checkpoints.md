---
globs:
---

## Claude Code Checkpoints 運用ルール

Checkpoints（チェックポイント）は、Claude のファイル編集を自動追跡し、コミット前の脱線をセッション内で手前へ巻き戻すための安全網。`/impl`・`/parallel` でエージェントに一気に実装させる運用で、git を汚さずに戻したいときに使う。**バージョン管理の代替ではない**（恒久履歴は git を継続使用）。

### 何が追跡され、何が追跡されないか

- **追跡される**: Claude のファイル編集ツール（Edit / Write 等）による直接編集のみ。ユーザープロンプトごとに1チェックポイントを自動作成
- **追跡されない（rewind で戻せない）**:
  - **bash コマンドによる変更**: `prisma migrate` / `supabase db push` / `rm` / `mv` / `cp` / `pnpm install` 等の副作用。DB・マイグレーション・node_modules の変更は対象外
  - **サブエージェントの編集**: foreground の forked skill（`context: fork` かつ `background: false`）を除き、復元されない。background fork（既定）・通常サブエージェント・`/code-review --fix` の編集は git で戻す
  - **別セッション・外部編集**: 手動編集や並列 worktree の別セッションの編集（同一ファイルを触った場合を除く）
  - **symlink / hard-link**: 復元時にスキップされ `Restored the code, but skipped N files` 警告が出る（pnpm の hard-link が該当し得る）

### 巻き戻し手順

- `/rewind`、またはプロンプト入力が空の状態で `Esc` を2回押してメニューを開く（入力にテキストがある場合の2回 `Esc` はクリア動作になる）
- メニューで戻したい地点を選び、アクションを選択:
  - **Restore code and conversation**: コードと会話の両方を戻す
  - **Restore conversation**: 会話だけ戻す（コードは現状維持）
  - **Restore code**: コードだけ戻す（会話は現状維持）

### rewind と git の使い分け（判断基準）

- **rewind を使う**: 単一セッション内での**直接ファイル編集**の脱線を、**コミット前**に手前へ戻したいとき。「試しに書いた変更をなかったことにする」用途
- **git を使う**（rewind では戻らない）:
  - `/impl`・`/parallel` の**サブエージェント実装**（worktree で走るため rewind 対象外 → worktree 破棄 or `git restore` / `git clean -fd`）
  - **bash の副作用**（ファイル削除・移動、`pnpm install` 等）
  - **DB・マイグレーション**（`prisma migrate` / `supabase db push`。適用済みマイグレーションは巻き戻しコマンドで対処）
  - **コミット済み**の変更（`git revert` / `git reset`）

### /impl・/parallel 運用との組み合わせ

- `/impl`・`/parallel` は worktree でサブエージェントが実装するため、その編集は**司令塔セッションの rewind では戻せない**。脱線に気づいたら worktree を破棄（`ExitWorktree` / worktree 削除）するか、worktree 内で git 操作で戻す
- worktree 初期化で走る `pnpm install` / `db:generate`（bash）や、`.env.e2e.local` コピー等の副作用も rewind 対象外。やり直すときは worktree を作り直す
- 司令塔セッションで直接編集した設計ドキュメント・ルールファイルの脱線には rewind が有効

### 保持・失効

- セッション内の直近100チェックポイントのスナップショットを保持。チェックポイントは会話とともに保存され、セッション再開後も `/rewind` 可能
- セッションとともに30日で削除（`cleanupPeriodDays` で調整可）

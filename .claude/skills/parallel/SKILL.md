---
name: parallel
description: 複数Issueを一括投入し、各タスクを /implement の手順でworktree並列実装する司令塔バッチ。実装ロジック本体は /implement が持つ。
when_to_use: 文脈の異なる複数のIssueを一度にまとめて実装させたいとき、「並列で」「parallel」「まとめて実装」などの発言時。1タスクだけなら /implement を直接使う。割り込みで後から1本足すときも /implement を呼べばよい。
agent: frontend-engineer
---

## 並列開発バッチ（司令塔オーケストレーター）

引数: `$ARGUMENTS`（並列で実装したいIssue番号の列挙。例: 210 305 412）

### このスキルの位置づけ

**実装フローの本体は `/implement` が持つ**（worktree作成・前提チェック・実装・テスト・PR・後片付け）。
このスキルは「複数Issueを一度にまとめて指示したいとき」に、各Issueへ `/implement` 相当の手順を
発火し、E2Eキューを束ねるだけの薄いオーケストレーターである。

> 並列は本来「`/implement` を複数回呼んだ結果として自然に発生する」もの。
> 1タスクだけ、あるいは割り込みで後から1本足すだけなら **このスキルは不要で、`/implement` を直接呼ぶ**。
> このスキルは「最初から複数Issueをまとめて投入したい」ときの入口にすぎない。

設計の全体像・共有インフラ制約・E2Eキューの根拠は `docs/worktree-workflow.md` を参照。

### 前提条件（満たさなければ停止）

- `git branch --show-current` が `develop`（司令塔）であること。
- 司令塔の作業ツリーが clean であること。
- 並列対象の各Issueが `/plan` で承認済みであること。未承認があれば先に `/plan` を案内。

### Phase 0: 適格判定

各Issueについて、`docs/worktree-workflow.md` §2 の制約に照らして判定する。

- **DBスキーマ変更（prisma/・supabase migration・prisma generate要）を含むタスク**は
  並列禁止。最初の1つがロックを取り、他は待機（直列化）する。
- 判定に迷う場合は推測せず、「このタスクはDBスキーマを触りますか？」とユーザーに確認する。

### Phase 1: 並列実装（各Issueを /implement の手順で）

- 適格な各Issueについて、`subagent_type: "frontend-engineer"` のサブエージェントを
  **1メッセージ内でまとめて起動**し、並列に走らせる。
- 各サブエージェントには `/implement` の Phase 1 手順を実行させる:
  - develop起点で `.claude/worktrees/<branch>` を作成（`git worktree add ... origin/develop -b <branch>`）
  - 環境ファイルコピー + `pnpm install`
  - 実装 + UT（`pnpm test`。共有DBに触らないので並列OK）
  - **IT（`pnpm test:integration`）・E2E・dev起動はここでは行わない**（共有DB依存。Phase 2 で司令塔が直列消化）
- 各サブエージェントは最終報告に「変更ファイル・UT結果・IT/E2E要否・残課題」を含めて返す。

### Phase 2: IT/E2E直列キュー（司令塔が qa-engineer を1体ずつ）

- 共有DBに触るテスト（IT = `pnpm test:integration`、E2E）の実行主体は **`qa-engineer` エージェント**。
  司令塔はキューを管理するだけ。
- IT/E2E要求のあった worktree を要求順にリストアップし、上から順に:
  1. `qa-engineer` を **1体だけ起動**し、その worktree の IT/E2E・受入条件検証を実施させる。
  2. 完了したら結果を該当タスクのPRへ反映する。
  3. 次の worktree へ進み、また `qa-engineer` を1体起動する。
- **厳守**: `qa-engineer` を複数同時起動して IT/E2E を並列で回さない（共有DB＋固定ポート競合で非決定的になる）。

### Phase 3: コミット・PR・後片付け

各 worktree について、`/implement` の Phase 2 手順に準拠:

- コミット → push → `gh pr create --base develop`（PR本文に `Closes #<Issue>`）。
- PR作成後、`git worktree remove .claude/worktrees/<branch>` で撤去（未コミット変更が残る場合は報告）。

### 完了報告

- 各タスクのブランチ名・PRリンク・UT/E2E結果を一覧で報告する。
- 直列に回したタスク・スキップしたタスクがあれば理由を明記する。

### アンチパターン（`docs/worktree-workflow.md` §5 と共通）

- worktreeごとに `supabase start` / 複数worktreeで同時マイグレーション
- devポートの動的ずらし（許可リスト・SITE_URLとズレて認証が壊れる）
- 複数worktreeで同時にE2E（共有DBシード競合）

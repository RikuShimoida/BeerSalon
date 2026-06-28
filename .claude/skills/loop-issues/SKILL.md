---
name: loop-issues
description: ready ラベル付き Issue を古い順に1件ずつ直列で消化する半自動ループ。各Issueを /impl の手順で実装しPR作成で止める。マージは人が /merge で行う。実装ロジック本体は /impl が持つ。
when_to_use: ready ラベルで仕様承認済みの Issue をまとめて自動消化したいとき、「ループで消化して」「loop-issues」「溜まったIssueを片付けて」などの発言時。1件だけ・じっくり見ながら進めたいなら従来どおり /plan → /impl を直接使う。
agent: frontend-engineer
---

## 半自動 Issue 消化ループ（司令塔オーケストレーター）

引数: `$ARGUMENTS`（任意。処理する最大件数。省略時は既定 3。例: `/loop-issues 5`）

### このスキルの位置づけ

**実装フローの本体は `/impl` が持つ**（worktree作成・前提チェック・実装・テスト・PR・後片付け）。
このスキルは「`ready` ラベル付き Issue を1件ずつ拾い、`/impl` 相当の手順を直列で回し、PR作成で止める」
だけの薄いオーケストレーターである。マージは行わない（人が後で `/merge <PR番号>`）。

設計の全体像・共有インフラ制約は `docs/worktree-workflow.md` を参照。

### 2モードの分界線（厳守）

このリポジトリには2つの作業モードがあり、**`ready` ラベルが両者の分界線**である。

- **自動消化モード（このスキル）**: `ready` ラベル付き Issue だけを対象にする。
  `ready` を付けた = 「仕様が明確で実装してよいと人が判断済み」= **計画承認の代理**。
  そのため、ループ内では `/plan` の個別承認も `/impl` の3択も出さず、PR作成まで自動で進める。
- **手動モード（従来）**: `ready` を付けていない Issue。従来どおり人が `/plan` で計画を見て承認し、
  `/impl` を回し、2-2-2 の3択で判断する。**このスキルは手動モードに一切干渉しない**。

進行ラベル（`in-progress` / `needs-merge` / `blocked`）は**このループ専用**。
手動モードの Issue にこれらを付けてはならない。手動とループでラベルがちぐはぐにならないようにするための最小ルール。

### 前提条件（満たさなければ停止）

- `git branch --show-current` が `develop`（司令塔）であること。develop 以外なら
  「`git switch develop` してから再実行してください」と案内して停止。
- 司令塔の作業ツリーが clean であること（`git status --porcelain` が空）。dirty なら停止して扱いを確認。
- 司令塔のローカル `develop` を最新化する: `git pull --ff-only origin develop`
  （失敗時は勝手に rebase/merge せず報告して停止。/impl 1-0 と同じ作法）。
- 必要なラベル（`ready` / `in-progress` / `needs-merge` / `blocked`）が GitHub 上に存在すること。
  存在しなければ作成を促す（このスキルでは勝手に作らない。リモートへの変更のため）。

### Phase 0: 対象 Issue の収集

```bash
gh issue list --state open --label ready --json number,title,labels --limit 100
```

- `ready` が付き、かつ `in-progress` が付いていない open Issue を**古い順（番号昇順）**に並べる。
- 0件なら「消化対象（ready かつ未処理）の Issue はありません」と報告して終了。
- 先頭から最大 `$ARGUMENTS`（既定3）件だけを今回の処理対象とする。
  上限で打ち切った残り件数があれば、完了報告に明記する（黙って切り捨てない）。

### Phase 1: 1件ずつ直列消化（厳守: 並列禁止）

> **共有インフラ制約**: 全 worktree は単一 Supabase(54421)・単一物理DB・固定ポートを共有する。
> このループは**必ず1件ずつ直列**で処理し、同時に存在する worktree は常に1つに保つ。
> `in-progress` ラベルが「いま処理中」のロック代わりになる。**複数 Issue を並列実装してはならない。**

各対象 Issue について、以下を順に行う。**1件完了してから次の1件へ進む。**

#### 1-1. ロック（ラベル張り替え）

```bash
gh issue edit <N> --remove-label ready --add-label in-progress
```

#### 1-2. 仕様ガード（/plan 相当。承認は省略）

- `/plan` の調査手順（`gh issue view <N>` → 設計ドキュメント照合 → 関連ファイル確認 → 横展開スキャン）を
  **内部的に実行する**。ただし `ready` が承認の代理であるため、**ユーザーへの計画提示・承認待ちは行わない**。
- このガードの目的は「`ready` でも実際には仕様に穴がある Issue」を検知して**推測実装を防ぐ**こと。
  以下に該当したら実装に進まず `blocked` 化する:
  - 期待動作が一意に定まらない / 対象画面が特定できない / 設計ドキュメントと矛盾する 等
- `blocked` 化の手順（→ 1-6 の失敗処理へ）。

#### 1-3. 実装（/impl の手順を流用。ただし一部をスキップ）

- `/impl <N>` の Phase 1〜2-2-1 の手順を**自分の文脈でなぞって実行する**
  （worktree作成 → 実装 → UT → format/lint → 設計doc同期 → コミット → push → `gh pr create --base develop`（本文に `Closes #N`）→ worktree撤去）。
  - **Skill ツールで `/impl` を呼び出さない**。`context:fork` / `agent:` が無視される既知制約のため、
    impl の手順を本スキル（`agent: frontend-engineer`）の文脈で辿る。
- **ループ実行時にスキップする impl の手順（重要）**:
  - **2-2-2 の AskUserQuestion 3択を出さない**（ループは止めない。マージ判断は後で人が行う）。
  - **2-4 の `/understand` 自動発動を行わない**（ループ実行中の宿題化は無効）。
- **共有DB依存テスト（IT/E2E）の扱い**: ループ中は worktree 内で実行せず、PR作成までで止める。
  IT/E2E は Phase 2 で司令塔がまとめて直列消化する（並列実行は共有DB競合のため禁止）。
- **エージェント一貫性**: 1-3 内でサブエージェントを起動する場合も必ず `subagent_type: "frontend-engineer"` を指定する。

#### 1-4. pr-review（任意・読み取りのみ）

- PR 作成後、`pr-review` スキルの手順で PR にレビューコメントを投稿してよい（コードは読むだけ・共有DBに触らない）。
- 指摘の取り込み（`/review-fix`）は行わない。マージ前に人が判断する材料として残すだけ。

#### 1-5. 成功時のラベル更新

```bash
gh issue edit <N> --remove-label in-progress --add-label needs-merge
```

- `needs-merge` = 「PR 作成済み・CI/マージ待ち」。人が後で `/merge <PR番号>` でマージする。

#### 1-6. 失敗時の処理（スキップして次へ）

実装失敗・CI が赤・コンフリクト・仕様の穴（1-2）のいずれかに該当したら、そのIssueは**直さず**に:

```bash
gh issue edit <N> --remove-label in-progress --add-label blocked
gh issue comment <N> --body "loop-issues: <失敗理由（実装失敗/仕様の穴/CI赤/コンフリクト等）の要約>。手動対応が必要です。"
```

- 作成途中の worktree が残っていれば **必ず撤去する**（`git worktree remove ...`）。撤去できない場合は報告に明記。
- そのIssueはスキップして次の対象へ進む。

### Phase 1-S: ループ中断条件（暴走防止）

- **連続2件が失敗（`blocked` 化）したら、ループ全体を中断する**。残りの対象は処理しない。
  「連続失敗が続いたため中断しました」と報告し、原因を人が確認できるようにする。
- 上限件数（`$ARGUMENTS`、既定3）に達したら正常終了する。

### Phase 2: 司令塔フェーズ（IT/E2E の直列消化）

- 1-3 で worktree に持ち込まなかった IT / E2E を、今回 PR を作成した各Issueについて司令塔が消化する。
- `qa-engineer` を**1体ずつ直列起動**して実行する（共有DB競合のため並列禁止）。
- IT/E2E が落ちた Issue があれば、その PR は**マージ候補から外し**、対応する Issue を `needs-merge` →
  `blocked` に張り替え＋コメントする（マージ前に品質を担保するため）。

### Phase 3: 完了報告

以下を報告する:

1. 今回処理した件数 / `ready` 対象の総件数（上限で残した件数があれば明記）
2. `needs-merge` にできた Issue 一覧（Issue番号・PR番号・PR URL）
3. `blocked` にした Issue 一覧（Issue番号・理由）
4. IT/E2E 結果（Phase 2 で消化した分）
5. ループ中断が発生した場合はその理由
6. 次アクションの案内: 「マージするには各 PR を確認して `/merge <PR番号>` を実行してください」

### 禁止事項

- 複数 Issue を並列実装すること（共有DB競合。必ず1件ずつ直列）。
- `ready` ラベルが付いていない Issue（= 手動モード対象）に触れること。
- ループ内で勝手に `/merge` してマージすること（マージは人が判断する。B案の前提）。
- 仕様に穴がある Issue を推測で実装すること（`blocked` 化してスキップする）。
- Skill ツールで `/impl` / `/plan` を呼び出すこと（`context:fork`/`agent:` が無視されるため、手順を文脈で辿る）。
- 作成途中の worktree を撤去せずに次の Issue へ進むこと。

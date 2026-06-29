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
- **ループ実行時の impl 手順の扱い（重要・取り違え注意）**:
  - **2-2-2 の `pr-review`（system-architect 委譲のコードレビュー）は実行する**（→ 1-4）。
    レビューはループでも必須。ここを止めない。
  - **2-2-2 の AskUserQuestion 3択（review-fix / マージ / あとで）だけは出さない**（ループを止めないため。
    マージ判断は後で人が行う）。**「2-2-2 を丸ごとスキップ」ではない**——スキップするのは3択の問いかけのみ。
  - **2-4 の `/understand` 自動発動を行わない**（ループ実行中の宿題化は無効）。
- **共有DB依存テスト（IT/E2E）の扱い**: ループ中は worktree 内で実行せず、PR作成までで止める。
  IT/E2E は Phase 2 で司令塔がまとめて直列消化する（並列実行は共有DB競合のため禁止）。
- **エージェント一貫性**: 1-3 内でサブエージェントを起動する場合も必ず `subagent_type: "frontend-engineer"` を指定する。

#### 1-4. pr-review（必須・読み取りのみ）

- PR 作成後、**必ず** `pr-review` の手順で PR にレビューコメントを投稿する（`/impl` 2-2-2 と同じ品質ゲート。
  コードは読むだけ・共有DBに触らないため、ループでも安全に走る）。
- **実装方式（重要）**: `pr-review` を **Skill ツールで呼ばない**。Skill 経由だと `pr-review` の
  frontmatter（`agent: system-architect` / `context: fork`）が無視されるため、代わりに
  **`subagent_type: "system-architect"` のサブエージェントを直接起動**し、`pr-review` スキル本文
  （`.claude/skills/pr-review/SKILL.md`）のレビュー観点・コメントフォーマットに従ってレビューさせ、
  `gh pr comment <PR番号>` で PR にレビュー結果を投稿させる。
  - レビュー観点・フォーマットの正は `pr-review` スキルが単一の真実の源（このファイルに複製しない）。
  - 実装は frontend-engineer が担うが、レビューは独立性確保のため system-architect に委譲する
    （`/impl` 2-2-2 のエージェント例外と同じ理由）。
- レビュー結果から、**指摘事項の最大重要度**（High / Medium / Low / 指摘なし）を判定する。
  - **Medium 以上の指摘がある** → 1-4b（自動 review-fix ループ）へ。
  - **Low のみ / 指摘なし** → 1-5 へ（自動修正しない。Low は人の判断材料として残す）。
- **3択の AskUserQuestion は出さない**（ループを止めない）。

#### 1-4b. 自動 review-fix ループ（Medium 以上の指摘がある場合のみ）

レビューで **Medium 以上**の指摘が出た場合、自動で修正を取り込む。暴走防止のため**再レビューは最大1回**。

> **方針（ユーザー合意・2026-06-29）**: Medium 以上で自動 review-fix。再レビュー1回、それでも Medium 以上が
> 残れば `blocked` 化して人にエスカレーションする。マージ自体は引き続き人が握る（B案は維持）。

手順:

1. **修正の取り込み（review-fix 相当）**: `review-fix` を Skill ツールで呼ばず、
   **`subagent_type: "frontend-engineer"` のサブエージェントを直接起動**し、`review-fix` スキル本文
   （`.claude/skills/review-fix/SKILL.md`）の手順に従って **Medium 以上の指摘のみ**をコード修正させる。
   - worktree は 2-2-1 で撤去済みのため、**この修正用に同じブランチで worktree を再作成**してから行う
     （`git worktree add <パス> origin/<headRef> -b ...` ではなく、既存ブランチをチェックアウトする形。
     具体的には `git worktree add <パス> <headRefName>`）。修正後 UT / format / lint を通し、コミットして
     同じ feature ブランチへ push する。完了したら worktree を撤去する。
   - Low の指摘・設計提案（「議論の余地」系）は**取り込まない**。Medium 以上の機械的に直せる指摘に限定する。
     修正すると挙動や設計判断が変わる指摘で、frontend-engineer が「これは人の判断が要る」と判断した場合は、
     無理に直さず 3 の `blocked` 扱いとしてエスカレーションする。
2. **再レビュー（最大1回）**: 1-4 と同じ方式で system-architect を再起動し、修正後の PR を再レビューさせて
   PR にコメント投稿する。
   - 再レビューで **Medium 以上が解消** → 1-5 へ（`needs-merge`）。
   - 再レビューで **なお Medium 以上が残る** → 3 へ（`blocked` 化）。**2回目の自動 review-fix は行わない**。
3. **エスカレーション（`blocked`）**: 再レビュー後も Medium 以上が残る、または 1 で人の判断が要ると判断した場合:

   ```bash
   gh issue edit <N> --remove-label in-progress --add-label blocked
   gh issue comment <N> --body "loop-issues: 自動 review-fix 後も Medium 以上の指摘が残ったため blocked。PR #<PR番号> のレビューコメントを確認し手動対応してください。"
   ```

   - PR はマージせず残す（人が `/review-fix <PR番号>` で続きを対応できる）。
   - 修正用 worktree が残っていれば撤去する。1-6 と同じく、このIssueはスキップして次へ。
   - **この `blocked` も Phase 1-S の「連続2件失敗」カウントに含める**。

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
4. 各 PR の pr-review 結果（コメントURL・指摘件数と重要度の内訳。1-4 で投稿した分）
5. 自動 review-fix を実施した PR（1-4b。修正した指摘・再レビュー結果・解消したか否か）
6. IT/E2E 結果（Phase 2 で消化した分）
7. ループ中断が発生した場合はその理由
8. 次アクションの案内: 「マージするには各 PR を確認して `/merge <PR番号>` を実行してください。
   `blocked` の Issue は PR のレビューコメントを確認し、手動で `/review-fix <PR番号>` で続きを対応してください」

### 禁止事項

- 複数 Issue を並列実装すること（共有DB競合。必ず1件ずつ直列）。
- `ready` ラベルが付いていない Issue（= 手動モード対象）に触れること。
- ループ内で勝手に `/merge` してマージすること（マージは人が判断する。B案の前提）。
- 仕様に穴がある Issue を推測で実装すること（`blocked` 化してスキップする）。
- Skill ツールで `/impl` / `/plan` / `pr-review` / `review-fix` を呼び出すこと（`context:fork`/`agent:` が
  無視されるため、手順を文脈で辿る。pr-review/再レビューは `subagent_type: "system-architect"`、
  review-fix は `subagent_type: "frontend-engineer"` を直接起動する。1-4 / 1-4b 参照）。
- pr-review（1-4）を省略して PR を `needs-merge` にすること（レビューは必須の品質ゲート）。
- 自動 review-fix の再レビューを 2 回以上回すこと（再レビューは最大1回。残れば `blocked`。1-4b 参照）。
- Low の指摘・設計提案（議論の余地系）を自動で取り込むこと（自動修正は Medium 以上の機械的指摘に限定）。
- 作成途中の worktree を撤去せずに次の Issue へ進むこと。

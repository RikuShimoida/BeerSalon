---
name: loop-issues
description: ready ラベル付き Issue を古い順に1件ずつ直列で消化する半自動ループ。各Issueを /impl の手順で実装し、品質ゲート（pr-review が Low 以下 + E2E green + CI green）を満たせば /merge 相当で自動マージする。条件を満たさないものは needs-merge / blocked で人に戻す。実装ロジック本体は /impl が持つ。
when_to_use: ready ラベルで仕様承認済みの Issue をまとめて自動消化したいとき、「ループで消化して」「loop-issues」「溜まったIssueを片付けて」などの発言時。1件だけ・じっくり見ながら進めたいなら従来どおり /plan → /impl を直接使う。
agent: frontend-engineer
---

## 半自動 Issue 消化ループ（司令塔オーケストレーター）

引数: `$ARGUMENTS`（任意。処理する最大件数。省略時は既定 3。例: `/loop-issues 5`）

### このスキルの位置づけ

**実装フローの本体は `/impl` が持つ**（worktree作成・前提チェック・実装・テスト・PR・後片付け）。
このスキルは「`ready` ラベル付き Issue を1件ずつ拾い、`/impl` 相当の手順を直列で回し、
**品質ゲートを満たしたものだけ `/merge` 相当で自動マージする**」司令塔オーケストレーターである。

設計の全体像・共有インフラ制約は `docs/worktree-workflow.md` を参照。

### 条件付き自動マージ（このスキルの中核方針・ユーザー合意 2026-06-30）

各 Issue は「実装 → PR作成 → pr-review → E2E → CI見届け → **条件を満たせば自動マージ**」まで
**1件で完結**させる（1件マージし切ってから次の1件へ。共有DBは1つなので直列は維持される）。

**自動マージしてよい条件（すべて満たすこと。1つでも欠けたら人に戻す）**:

1. `ready` 付き（= 計画承認の代理）で、仕様ガード（1-2）を通過している（`blocked` でない）
2. **pr-review の最大重要度が Low 以下**（High/Medium が無い）。
   - **重要**: pr-review で **Medium 以上が一度でも出た Issue は、自動 review-fix で解消できても自動マージしない**。
     判断が割れた（=人の目を入れる価値がある）変更とみなし、`needs-merge` で人に戻す（1-4b 参照）。
3. **マージ前に E2E（Phase 2 相当）を実行して green**（共有DBに実接続して検証。2-E 参照）
4. **CI を `gh pr checks <PR> --watch` で見届けて全 green**（1-7 参照）

→ 1〜4 を満たす = **`/merge <PR>` 相当を loop が自動実行**（Merge commit + Issueクローズ + リモート/ローカル
ブランチ削除 + 司令塔 develop 最新化）。満たさないものは `needs-merge`（マージ可能だが人の判断が要る）または
`blocked`（失敗・要対応）で残し、人が後から `/merge` / `/review-fix` する。

> **なぜマージを全自動にしないか**: CI green は「コンフリクト無し・テスト通過」を保証するだけで、設計判断の
> 妥当性は保証しない。pr-review で Medium 以上が出た＝判断が割れた変更は、機械的に直せても develop へ
> 無人で入れず人に最終判断を残す。「機械的に安全なものだけ自動で流し、判断が割れたものは人が見る」という
> リスク比例の自動化。最終マージ権を完全には手放さない設計。

### 2モードの分界線（厳守）

このリポジトリには2つの作業モードがあり、**`ready` ラベルが両者の分界線**である。

- **自動消化モード（このスキル）**: `ready` ラベル付き Issue だけを対象にする。
  `ready` を付けた = 「仕様が明確で実装してよいと人が判断済み」= **計画承認の代理**。
  そのため、ループ内では `/plan` の個別承認も `/impl` の3択も出さず、**品質ゲートを満たせば自動マージまで**進める。
  品質ゲートを満たさないものだけ人に戻す（上記「条件付き自動マージ」参照）。
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
- **自動マージにはローカル E2E 環境（Docker + Supabase 54421）が必要**（2-E のマージ前 E2E で使う）。
  未起動なら 2-E で初回に一度だけ `supabase start` → `pnpm e2e:setup` を行う（破壊的でないが、起動した旨は報告する）。
  Docker が起動できない等で E2E 環境が用意できない場合は、自動マージ条件③を満たせないため、該当 Issue は
  `needs-merge` で人に戻る（マージはされない）。その旨を完了報告に明記する。

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
- `blocked` 化の手順（→ 1-X の失敗時共通処理へ）。

#### 1-3. 実装（/impl の手順を流用。ただし一部をスキップ）

- `/impl <N>` の Phase 1〜2-2-1 の手順を**自分の文脈でなぞって実行する**
  （worktree作成 → 実装 → UT → format/lint → 設計doc同期 → コミット → push → `gh pr create --base develop`（本文に `Closes #N`）→ worktree撤去）。
  - **Skill ツールで `/impl` を呼び出さない**。`context:fork` / `agent:` が無視される既知制約のため、
    impl の手順を本スキル（`agent: frontend-engineer`）の文脈で辿る。
- **ループ実行時の impl 手順の扱い（重要・取り違え注意）**:
  - **2-2-2 の `pr-review`（system-architect 委譲のコードレビュー）は実行する**（→ 1-4）。
    レビューはループでも必須。ここを止めない。
  - **2-2-2 の AskUserQuestion 3択（review-fix / マージ / あとで）は出さない**（ループを止めないため）。
    代わりに、loop は品質ゲート（pr-review Low 以下 + E2E green + CI green）を機械的に判定し、
    満たせば自動マージ（1-7）、満たさなければ人に戻す（1-5 / 2-E / 1-7）か `blocked`（1-X）。**「2-2-2 を丸ごとスキップ」ではない**。
  - **2-4 の `/understand` 自動発動を行わない**（ループ実行中の宿題化は無効）。
- **共有DB依存テスト（IT/E2E）の扱い**: 1-3 の段階（worktree 内）では実行しない。
  worktree 撤去後、**マージ判定の直前に司令塔が E2E を直列実行する**（2-E）。これは自動マージ条件
  「マージ前に E2E green」を満たすため、各 Issue の処理内（1件完結）で行う。並列実行は共有DB競合のため禁止。
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
- レビュー結果から、**指摘事項の最大重要度**（High / Medium / Low / 指摘なし）を判定する。判定結果を
  この Issue の状態として**必ず保持する**（自動マージ条件②の判定に使う。1-5 参照）。
  - **Medium 以上の指摘がある** → 1-4b（自動 review-fix ループ）へ。**この Issue は「Medium 以上が出た」と
    マークし、以降 review-fix で解消しても自動マージ対象から外す**（`needs-merge` 止まり。1-5 参照）。
  - **Low のみ / 指摘なし** → 2-E（マージ前 E2E）へ進む。自動修正はしない（Low は記録として残す）。
- **3択の AskUserQuestion は出さない**（ループを止めない）。

#### 1-4b. 自動 review-fix ループ（Medium 以上の指摘がある場合のみ）

レビューで **Medium 以上**の指摘が出た場合、自動で修正を取り込む。暴走防止のため**再レビューは最大1回**。

> **方針（ユーザー合意・2026-06-29 / 更新 2026-06-30）**: Medium 以上で自動 review-fix。再レビュー1回、
> それでも Medium 以上が残れば `blocked` 化して人にエスカレーションする。
> **Medium 以上が一度でも出た Issue は、再レビューで解消しても自動マージしない**（`needs-merge` で人に戻す）。
> 判断が割れた変更は、機械的に直せても develop へ無人で入れず、人に最終マージ判断を残すため
> （条件付き自動マージの方針。冒頭「条件付き自動マージ」参照）。

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
   - 再レビューで **Medium 以上が解消** → 1-5 へ。ただし**この Issue は「Medium 以上が出た」マークが付くため
     自動マージはせず `needs-merge` で人に戻す**（解消しても自動マージ対象に復帰しない）。
   - 再レビューで **なお Medium 以上が残る** → 3 へ（`blocked` 化）。**2回目の自動 review-fix は行わない**。
3. **エスカレーション（`blocked`）**: 再レビュー後も Medium 以上が残る、または 1 で人の判断が要ると判断した場合:

   ```bash
   gh issue edit <N> --remove-label in-progress --add-label blocked
   gh issue comment <N> --body "loop-issues: 自動 review-fix 後も Medium 以上の指摘が残ったため blocked。PR #<PR番号> のレビューコメントを確認し手動対応してください。"
   ```

   - PR はマージせず残す（人が `/review-fix <PR番号>` で続きを対応できる）。
   - 修正用 worktree が残っていれば撤去する。1-X と同じく、このIssueはスキップして次へ。
   - **この `blocked` も Phase 1-S の「連続2件失敗」カウントに含める**。

#### 1-5. マージ判定（自動マージ条件②の評価）

pr-review（1-4）と自動 review-fix（1-4b）が終わった時点で、**自動マージ条件②（pr-review 最大 Low 以下）**を評価する。

- **「Medium 以上が一度でも出た」マークが付いている**（1-4 / 1-4b でマーク済み）→ **自動マージ対象から外す**。
  `needs-merge` に張り替え、人に戻す:

  ```bash
  gh issue edit <N> --remove-label in-progress --add-label needs-merge
  gh issue comment <N> --body "loop-issues: pr-review で Medium 以上が出たため（自動 review-fix の有無に関わらず）自動マージは行いません。PR #<PR番号> を確認し、問題なければ /merge <PR番号> でマージしてください。"
  ```

  その後、この Issue の処理は終了（E2E / CI見届け / 自動マージはスキップ）。次の Issue へ。

- **Low 以下 / 指摘なし**（Medium 以上マーク無し）→ **2-E（マージ前 E2E）へ進む**。条件③④を続けて評価する。

#### 2-E. マージ前 E2E（自動マージ条件③。Low 以下の Issue のみ）

worktree は 1-3 で撤去済みのため、**この Issue の feature ブランチをチェックアウトした検証用 worktree を再作成**し、
共有DBに実接続して E2E を実行する。共有DB競合を避けるため**必ず1件ずつ直列**（同時に検証 worktree は1つ）。

1. **ローカル E2E 環境の準備**（未起動なら1回だけ）: `docs/e2e.md` に従い `supabase start` →
   `pnpm e2e:setup`（seed投入 + テストユーザー作成）。環境起動は破壊的でないが、未起動から立ち上げる場合は
   完了報告に明記する。
2. **検証用 worktree 作成**: `git worktree add <パス> <headRefName>`（既存 feature ブランチをチェックアウト）。
   worktree 内で `pnpm install` し、メインの `apps/*/.env.local` と `apps/*/.env.e2e.local` をコピーする
   （env はブランチに含まれないため。/impl のworktree初期化と同じ手続き）。
3. **E2E 実行**: その Issue に関係する spec を `subagent_type: "qa-engineer"` で（または司令塔が直接）実行する。
   新規追加した spec は develop に無いため、この検証 worktree 上で実行するのが正しい（spec は PR ブランチにある）。
   - **green** → 1-7（CI見届け＋自動マージ）へ進む。
   - **赤（落ちた）** → `needs-merge` に張り替えて人に戻す（マージ前に品質が担保できないため自動マージしない）:

     ```bash
     gh issue edit <N> --remove-label in-progress --add-label needs-merge
     gh issue comment <N> --body "loop-issues: マージ前 E2E が失敗したため自動マージを見送り。PR #<PR番号> の E2E を確認し手動対応してください。"
     ```

     この Issue の処理は終了（次へ）。**E2E 赤も Phase 1-S の連続失敗カウントに含める**。
4. **検証用 worktree を撤去**（`git worktree remove ...`）。撤去できない場合は報告に明記。

#### 1-7. CI 見届け＋自動マージ（自動マージ条件④。E2E green の Issue のみ）

ここに到達した Issue は、条件①（ready/仕様ガード通過）②（pr-review Low 以下）③（E2E green）を満たしている。
最後に条件④（CI 全 green）を見届け、満たせば `/merge` 相当を自動実行する。

1. **CI 完了の見届け**（`/merge` 1-1 と同じ作法）:

   ```bash
   gh pr checks <PR番号> --watch --interval 30
   ```

   - 終了コード 0（全チェック pass）→ 2 のマージへ。
   - 非0（fail / cancelled 等）→ **マージせず** `needs-merge` に張り替えて人に戻す:

     ```bash
     gh issue edit <N> --remove-label in-progress --add-label needs-merge
     gh issue comment <N> --body "loop-issues: CI が green でないため自動マージを見送り。失敗チェック: <チェック名>。PR #<PR番号> を確認してください。"
     ```

     この Issue の処理は終了（次へ）。**CI 赤も Phase 1-S の連続失敗カウントに含める**。
2. **マージ実行（`/merge` スキル相当を loop が実行）**: `/merge` スキル本文（`.claude/skills/merge/SKILL.md`）の
   手順 2〜5 を**この文脈でなぞって実行する**（Skill ツールで `/merge` を呼ばない。手順を辿る）:
   - `gh pr merge <PR番号> --merge --delete-branch`（Merge commit 方式 + リモートブランチ削除）
   - **対応 Issue のクローズ**（develop ベースのため自動クローズが効かない。`/merge` 2-1 参照）:
     PR本文の `Closes #N` / ブランチ名から Issue 番号を抽出し `gh issue close <N> --comment "PR #<PR番号> のマージに伴いクローズ"`。
     - **注意**: クローズで `in-progress` ラベルは外さなくてよい（Issue が closed になれば open 一覧に出ないため
       次ループに影響しない）。ただし整合のため、クローズ前に `gh issue edit <N> --remove-label in-progress` で
       進行ラベルを落としてからクローズすると、ラベル状態がきれいに残る（任意だが推奨）。
   - **司令塔 develop の最新化**: `git pull --ff-only origin develop`（マージコミットを取り込む。失敗時は
     勝手に rebase/merge せず報告して停止）。
   - **ローカル feature ブランチ削除**: `git branch -d <headRefName>`（存在しなければスキップ。`-D` へ勝手に
     切り替えない。`/merge` 4 と同じ）。
   - **リモート追跡参照の掃除**: `git fetch --prune origin`。
3. マージ成功を記録（完了報告の「自動マージした Issue 一覧」に PR番号・URL・マージコミットを載せる）。次の Issue へ。

#### 1-X. 失敗時の共通処理（`blocked` 化してスキップ。各ステップから参照される横道）

実装失敗・コンフリクト・仕様の穴（1-2）のいずれかに該当したら、そのIssueは**直さず**に:

```bash
gh issue edit <N> --remove-label in-progress --add-label blocked
gh issue comment <N> --body "loop-issues: <失敗理由（実装失敗/仕様の穴/コンフリクト等）の要約>。手動対応が必要です。"
```

- 作成途中・検証用の worktree が残っていれば **必ず撤去する**（`git worktree remove ...`）。撤去できない場合は報告に明記。
- そのIssueはスキップして次の対象へ進む。
- **この `blocked` も Phase 1-S の「連続2件失敗」カウントに含める**。

### Phase 1-S: ループ中断条件（暴走防止）

- **連続2件が失敗したら、ループ全体を中断する**。残りの対象は処理しない。
  「連続失敗が続いたため中断しました」と報告し、原因を人が確認できるようにする。
- **「失敗」としてカウントするもの**（実装が成立しなかった or 品質ゲートで弾かれた）:
  - `blocked` 化（実装失敗 / 仕様の穴 / コンフリクト / review-fix 後も Medium 以上残存）
  - **E2E 赤（2-E）/ CI 赤（1-7）で `needs-merge` に戻したもの**（品質が担保できずマージできなかった）
- **「失敗」としてカウントしないもの**: pr-review で Medium 以上が出て `needs-merge` に戻したもの（1-5）。
  これは実装・テストは通っており、設計判断を人に委ねただけで「失敗」ではない。連続失敗の暴走検知対象外。
  （ただし完了報告には理由付きで載せる）
- 上限件数（`$ARGUMENTS`、既定3）に達したら正常終了する。

> **旧 Phase 2（IT/E2E のまとめ消化）は廃止**。E2E は各 Issue の処理内（2-E）でマージ判定の直前に直列実行する
> 設計に変わった（自動マージ条件「マージ前に E2E green」を満たすため）。1件ずつ「実装→pr-review→E2E→CI→
> 自動マージ」を完結させるので、まとめフェーズは不要になった。共有DBは1つ・検証 worktree も常に1つで直列性は維持。

### Phase 3: 完了報告

以下を報告する:

1. 今回処理した件数 / `ready` 対象の総件数（上限で残した件数があれば明記）
2. **自動マージした Issue 一覧**（Issue番号・PR番号・PR URL・マージコミット。クローズ済みIssueも明記）
3. `needs-merge` で人に戻した Issue 一覧（Issue番号・PR番号・PR URL・**戻した理由**：
   pr-review で Medium 以上 / E2E 赤 / CI 赤 のどれか）
4. `blocked` にした Issue 一覧（Issue番号・理由）
5. 各 PR の pr-review 結果（コメントURL・指摘件数と重要度の内訳。1-4 で投稿した分）
6. 自動 review-fix を実施した PR（1-4b。修正した指摘・再レビュー結果・解消したか否か）
7. マージ前 E2E（2-E）の結果（green/赤、消化した spec）
8. CI 見届け（1-7）の結果（自動マージした分の全 green 確認）
9. ループ中断が発生した場合はその理由
10. 次アクションの案内: 「`needs-merge` の Issue は PR を確認し、問題なければ `/merge <PR番号>` でマージして
    ください。`blocked` の Issue は PR のレビューコメント / E2E 失敗を確認し、`/review-fix <PR番号>` 等で
    手動対応してください。自動マージ済みの Issue は develop に統合・クローズ済みです」

### 禁止事項

- 複数 Issue を並列実装すること（共有DB競合。必ず1件ずつ直列。検証 worktree も常に1つ）。
- `ready` ラベルが付いていない Issue（= 手動モード対象）に触れること。
- **品質ゲートを満たさないのに自動マージすること**。自動マージは「pr-review 最大 Low 以下 ＋ マージ前 E2E green
  ＋ CI 全 green」を**すべて**満たした Issue のみ（冒頭「条件付き自動マージ」参照）。1つでも欠けたら
  `needs-merge` / `blocked` で人に戻す。
- **pr-review で Medium 以上が出た Issue を自動マージすること**（自動 review-fix で解消しても `needs-merge` 止まり。
  判断が割れた変更は人に最終マージ判断を残す。1-4b / 1-5 参照）。
- **E2E / CI を見届けずに自動マージすること**（E2E は 2-E で実接続 green を確認、CI は 1-7 で `--watch` 全 green を確認）。
- 仕様に穴がある Issue を推測で実装すること（`blocked` 化してスキップする）。
- Skill ツールで `/impl` / `/plan` / `pr-review` / `review-fix` / `merge` を呼び出すこと（`context:fork`/`agent:` が
  無視されるため、手順を文脈で辿る。pr-review/再レビューは `subagent_type: "system-architect"`、
  review-fix / E2E は `subagent_type: "frontend-engineer"` / `"qa-engineer"` を直接起動する。1-4 / 1-4b / 2-E 参照）。
- pr-review（1-4）を省略してマージ判定に進むこと（レビューは必須の品質ゲート）。
- 自動 review-fix の再レビューを 2 回以上回すこと（再レビューは最大1回。残れば `blocked`。1-4b 参照）。
- Low の指摘・設計提案（議論の余地系）を自動で取り込むこと（自動修正は Medium 以上の機械的指摘に限定）。
- 作成途中・検証用の worktree を撤去せずに次の Issue へ進むこと。
- ローカル feature ブランチ削除で `-d` が失敗した際に `-D` へ勝手に切り替えること（`/merge` 4 と同じ。報告して委ねる）。

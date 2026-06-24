---
name: impl
description: Issue起点の実装フロー。ブランチ作成→実装→テスト→品質チェック→コミット→PR作成→完了報告を一貫して実行する。事前に /plan で計画承認済みであることが前提。
when_to_use: 「実装して」「このIssueやって」「implement」などの発言時、Issue番号を指定して実装を依頼された時。事前に /plan で計画がユーザーに承認されていること。
agent: frontend-engineer
---

## Issue起点の実装

引数: `$ARGUMENTS`（Issue番号。例: 123）

### 前提条件

- `/plan $ARGUMENTS` で計画を出力し、ユーザーが承認済みであること
- 計画未承認の場合は、先に `/plan $ARGUMENTS` を実行するよう案内して終了すること
- **このスキルは worktree 起点の常時運用が前提**。設計の全体像は `docs/worktree-workflow.md` を参照。
  単独実装でも割り込み実装でも、1タスク = 1 worktree で行い、developメインは司令塔として clean に保つ。

#### worktree モードと撤退路（`--no-worktree`）

- **既定は worktree モード**（1タスク = 1 worktree）。
- 引数に **`--no-worktree`** が含まれる場合は、worktree を作らず**従来の checkout 方式**で実装する
  （1-0b / 1-1b を参照）。「今回は worktree が割に合わない」と判断したタスクで、その場で切り替えられる。
  - 例: `/impl 210 --no-worktree`
- この撤退路はコードを戻す必要がない。worktree 運用が常に割に合わないと感じたら、
  運用として `--no-worktree` を既定にする（docs/worktree-workflow.md に方針を追記して判断を残す）。

### Phase 1: 実装

> 以下 1-0 / 1-1 は worktree モードの手順。`--no-worktree` 指定時は代わりに 1-0b / 1-1b を行う。

#### 1-0. 前提チェック（worktree モード。満たさなければ停止）

- `git branch --show-current` が `develop` であること。
  - developメイン会話を司令塔とし、ここから worktree を切る運用のため。
  - develop 以外なら「`git switch develop` してから再実行してください」と案内して停止。
- 司令塔（developメイン）の作業ツリーが clean であること（`git status --porcelain` が空）。
  - clean でなければ、未コミット変更の扱いをユーザーに確認してから進む。
- **司令塔のローカル `develop` を最新化する**（clean を確認した後に実行）:
  ```
  git pull --ff-only origin develop
  ```
  - **なぜ必須か**: worktree 自体は 1-1 の `git worktree add ... origin/develop` で常に最新起点になるが、
    司令塔のローカル `develop` が古いままだと、`git status` の見え方・差分の基準・PR後の後続作業がリモートと
    ズレる。司令塔は指揮所なので、常にリモート `develop` に追従させておく。
  - `--ff-only` が失敗する場合（ローカル `develop` に余分なコミットがある等）は、勝手に rebase / merge せず、
    状況をユーザーに報告して指示を仰ぐ。

#### 1-0b. 前提チェック（`--no-worktree` 時）

- 既存の checkout 方式の作法に従う。worktree は作らない。
- 並列実装はできない（メインの作業ツリーを1つ占有するため）。単独タスク向け。

#### 1-1. worktree とブランチの作成（worktree モード）

- **このタスク専用の worktree を develop 起点で作成する**（1タスク = 1 worktree）。
- ブランチ命名規則: `feature/<issue番号>-<英語スラッグ>` または `bugfix/<issue番号>-<英語スラッグ>`
  - 例: `feature/210-add-e2e-ci`, `bugfix/305-fix-login-redirect`
- 手順:
  ```
  git fetch origin develop
  git worktree add .claude/worktrees/<prefix>-$ARGUMENTS-<英語スラッグ> origin/develop -b <prefix>/$ARGUMENTS-<英語スラッグ>
  ```
  - **なぜ生の `git worktree add` か**: Claude Code の Agent `isolation: "worktree"` は既定ベースが
    `origin/HEAD`(=main) で develop 起点に固定できない。develop追従プレビュー運用と整合させるため、
    ベースを明示できる生コマンドを使う（`docs/worktree-workflow.md` §4 参照）。
- 以降の実装作業（1-2〜1-6）は、すべてこの worktree ディレクトリ内で行う。

##### worktree の初期化（スキルの手続きとして明示的に実行）

git / Claude Code のネイティブ機能では自動化されないため、worktree 作成直後に必ず行う:

1. 環境ファイルをコピー: `apps/web/.env.local` と `apps/admin/.env.local` を新 worktree へコピー。
   （`.worktreeinclude` は標準機能ではなく取り決めにすぎないため、コピーはこの手続きで行う）
2. 依存インストール: 新 worktree 内で `pnpm install`。

#### 1-1b. ブランチ作成（`--no-worktree` 時）

- worktree を作らず、メインの作業ツリー上で develop からブランチを切る:
  ```
  git switch develop
  git pull origin develop
  git switch -c <prefix>/$ARGUMENTS-<英語スラッグ>
  ```
- 環境ファイルのコピー・`pnpm install` は不要（既存の node_modules / .env.local をそのまま使う）。
  これが worktree モードに対するオーバーヘッド削減の中身。
- 以降の実装作業は通常どおりこのブランチ上で行う。

##### 英語スラッグの決め方

- Issue内容から Claude 自身が短い英語スラッグを決める
- ルール:
  - 小文字 + ハイフン区切り（ケバブケース）
  - 日本語禁止
  - 3〜5語以内
  - Issueタイトルの直訳ではなく、要点を短く表現する
    - 例: 「CI/CDにE2Eテストを段階的に組み込む」→ `add-e2e-ci`
    - 例: 「ログイン後のリダイレクトが効かないバグ修正」→ `fix-login-redirect`
- プレフィックスの選択:
  - バグ修正系Issue → `bugfix/`
  - それ以外（機能追加・改善・リファクタ等）→ `feature/`

##### Issue とブランチの紐付け

- worktree で作成したブランチを push する際、PR本文に `Closes #$ARGUMENTS` を記載することで
  Issue と紐付ける（Phase 2-2）。`gh issue develop` は worktree 運用では使わない
  （ブランチ作成は上記の `git worktree add ... -b` で行うため）。
- **注意**: 本リポジトリのPRはベースが `develop`（非デフォルトブランチ）のため、`Closes #N` を本文に書いても
  GitHub による Issue 自動クローズは**働かない**（自動クローズはデフォルトブランチ `main` 向けPRのみ）。
  `Closes #N` は紐付け表示・`/merge` がマージ後に Issue 番号を抽出する根拠として記載する。
  実際のクローズはマージ時に `/merge` スキルが `gh issue close` で行う。

#### 1-2. プロダクトコード実装

- Issue の要件に基づきコードを実装する

#### 1-3. UT実装・実行（worktree内で完結＝並列OK）

- Vitest でユニットテストを実装する（`pnpm test`。Supabase/Prismaはモックし共有DBに触らない）
- `pnpm test` で全テストがパスすることを確認する
- UT は共有DBに依存しないため、複数 worktree で同時に実行してよい。

#### 1-3-1. 共有DB依存テスト（IT・E2E）の扱い

> **共有インフラ制約（厳守）**: 全 worktree は単一 Supabase（54421）・単一物理DB・固定ポートを共有する。
> 以下は共有DBに触るため、複数 worktree で同時実行すると競合して非決定的になる:
> - **IT（`pnpm test:integration`、`*.integration.test.ts`）** — seed済み共有DBに実接続する
> - **E2E（`pnpm e2e`、Playwright）** — 共有DB＋固定ポートを使う（アプリ個別は `pnpm --filter @beersalon/web e2e` / `pnpm --filter @beersalon/admin e2e`）
>
> 並列実装中はこれらを worktree 内で実行せず、**司令塔が `qa-engineer` を1体ずつ直列起動して消化**する
> （`docs/worktree-workflow.md` §3）。
> **単独実装（worktree が1つだけ）なら競合しない**ため、このフロー内でそのまま IT/E2E を実行してよい。

#### 1-4. E2Eテスト実装・実行

- **承認レスで実行する**。E2E計画の事前提示・承認待ちは行わない
  （何を検証するかは `/plan` 承認時点で受入条件として確定済みのため。許可プロンプト排除方針に整合）。
- Playwright MCP の操作、および E2E 実行に必要なコマンド（`pnpm e2e` 等）は、確認を求めずそのまま実行してよい。
- 起動済みの localhost に対して E2E 確認を実施する。
- ポートが不明な場合のみユーザーに確認する。
- 不具合を発見した場合は修正せず、再現手順・期待結果・実際の結果を報告する
- Playwright MCPでの動作確認後、テストピラミッドの原則に基づき、E2Eテストコードとして残すかどうかを判断する
  - UTで十分カバーできるロジック検証 → E2Eコード不要
  - ブラウザ固有の挙動・複数画面にまたがるフロー・UTでは検証困難な統合動作 → E2Eコードとして残す

#### 1-4-1. 画面レイアウト系タスクの場合: レイアウトレビュー

Issueが画面レイアウト系タスク（UI実装、ページ作成、レイアウト変更、スタイリング等）の場合、Phase 2のPR作成後に `/layout-review` スキルの手順を実行すること。

- E2Eテスト時にスクリーンショットを取得する
- スクリーンショットをPRコメントとして貼り付ける
- wireframe.md と照合し、なぜこのレイアウトが要件を満たしているかの判断根拠を言語化する

##### スクリーンショットの取り扱いルール（厳守）

- **リポジトリには絶対にコミットしない**（`docs/screenshots/` 等の配下に画像を置かない）
  - 理由: リポジトリサイズが膨らみ、clone / fetch / CI のコストが増大するため
  - `.gitignore` に `docs/screenshots/` を登録済み
- スクリーンショットは **GitHub の PR コメントへの uploaded image 形式** で添付する
  - 画像は一時退避先（例: `/tmp/pr-<番号>-screenshots/`）に保存
  - 退避先のパスを完了報告に明記し、ユーザーが PR コメントにドラッグ&ドロップで貼り付ける運用とする
  - `gh` CLI からは画像アップロード API が提供されていないため、自動投稿は行わない
- 既存リポジトリに過去のスクリーンショットが残っている場合は、見つけ次第 `git rm` で削除する

#### 1-5. 品質チェック（順序厳守）

1. `pnpm format`
2. `pnpm lint`（エラーがあれば修正し、再度formatを実行）

#### 1-6. 設計ドキュメント同期

- 実装内容に応じて routing.md / wireframe.md / database.md / README.md を更新する
- コードと設計ドキュメントの内容が一致していることを確認する

### Phase 2: 完了

#### 2-1. コミット・プッシュ

- すべての変更（コード・テスト・ドキュメント）をコミットする
- コミットメッセージにIssue番号を含める
- プッシュする

#### 2-2. PR作成

- `gh pr create --base develop` でPRを作成する
- PR本文に `Closes #Issue番号` を記載する（Issue との紐付け用。develop ベースのため自動クローズは働かず、
  実際のクローズはマージ時に `/merge` スキルが行う。1-1 の「Issue とブランチの紐付け」参照）

#### 2-2-1. worktree の後片付け

- **worktree モードの場合のみ実施**（`--no-worktree` 時はスキップ）。
- PR作成が完了したら、このタスクの worktree を撤去する:
  ```
  git worktree remove .claude/worktrees/<このタスクのworktree>
  ```
- 未コミット変更が残っている場合は撤去せず、その旨を完了報告に明記する。

#### 2-2-2. 司令塔フェーズ（コードレビュー + 共有DB依存テスト）

PR作成後、共有インフラ（単一 Supabase / 単一物理DB / 固定ポート）に触る作業は、worktree 内ではなく**司令塔（developメイン）が集約して実施する**。
worktree は既に 2-2-1 で撤去済みのため、以降はすべて developメインの作業ツリーから行う。

順序:

1. **コードレビュー（`pr-review` スキルへの委譲）**
   - 司令塔が **`pr-review` スキルを 2-2 で作成した PR番号付きで起動する**（`/pr-review <PR番号>` 相当）。
     - `pr-review` は `agent: system-architect`・`context: fork` で動く。
       エージェント一貫性ルールの例外として、レビューに限り system-architect への委譲を認める（後述）。
   - **レビュー観点・コメントフォーマットの正は `pr-review` スキル（`.claude/skills/pr-review/SKILL.md`）が単一の真実の源**。
     impl 側に観点やフォーマットを複製しない（二重メンテ防止）。pr-review が `gh pr diff <PR番号>` で差分を取得する作りのため、PR作成後に司令塔から呼ぶのが構造的に自然。
   - **結果は PR コメントとして投稿するのみ**。指摘の取り込み可否はユーザーが判断する
     （このフロー内でコード修正は行わない。修正する場合の `/review-fix` 起動もユーザーの判断に委ねる）。
   - レビューはコードの読み取りのみで共有DBに触らないため、並列実装中でも安全に実行できる。

   - **pr-review 完了後の分岐（必須）**: pr-review が PR にレビューコメントを投稿し終えたら、
     司令塔に戻った時点で「GitHub にレビュー指摘の内容をコメントしました」と報告し、
     **AskUserQuestion で次の3択をユーザーに必ず確認する**:
     1. **このまま `/review-fix <PR番号>` を実行する** — 指摘をコード修正で取り込む
     2. **このままマージする** — `/merge <PR番号>` スキルの手順を実行（Merge commit + リモート/ローカルのブランチ削除 + 司令塔develop最新化）
     3. **あとで決める** — 何もせず元の会話に戻る。マージしたくなったら後から `/merge <PR番号>` を叩けばよい
     - **3択を出さずに勝手にマージ・review-fix してはならない**。マージのタイミングはユーザーが決める。
     - 「あとで決める」を選んだ場合、PR番号を完了報告（2-3）に明記し、`/merge <PR番号>` で後追いできる旨を添える。

2. **共有DB依存テスト（IT・E2E）**
   - 1-3-1 で worktree 内に持ち込まなかった IT / E2E を、ここで司令塔が消化する。
   - 司令塔が `qa-engineer` を**1体ずつ直列起動**して実行する（`docs/worktree-workflow.md` §3）。
     並列実行は共有DB競合により非決定的になるため禁止。
   - **単独実装（worktree が1つだけ）で 1-3-1 内に IT/E2E を既に実行済みの場合は、ここでの再実行は不要**。

- レビュー結果（PRコメントURL・指摘の概要）と IT/E2E 結果は、2-3 の完了報告に含める。

#### 2-3. 完了報告

以下を報告する:

1. 修正内容（何を変更したか）
2. 修正理由（なぜその変更が必要だったか）
3. 変更ファイル一覧
4. UT結果
5. IT / E2E結果（司令塔フェーズで消化した分。未実施なら理由を明記）
6. コードレビュー結果（PRコメントURL・指摘件数と重要度の内訳）。指摘への対応（`/review-fix` 実行など）はユーザー判断に委ねる旨も添える。
   2-2-2 の3択で「あとで決める」を選んだ場合は、後から `/merge <PR番号>` でマージできる旨と対象PR番号を明記する
7. 設計ドキュメント更新の有無と内容
8. 破壊的変更の有無と内容（該当する場合のみ）
9. PR URL

**破壊的変更の報告義務**: 実装中に以下のような破壊的変更を行った場合は、完了報告の項目8で必ず明示すること。

- DBスキーマの変更（テーブル追加・カラム変更・マイグレーション等）
- Prismaクライアントの再生成（`prisma generate`）
- 既存APIの引数・戻り値の型変更
- 既存コンポーネントのProps変更（型の追加・削除・変更）
- パッケージの追加・削除・バージョン変更
- 環境変数の追加・変更
- devサーバーの再起動が必要になる変更

報告時は「何を変更したか」「なぜ必要だったか」「ユーザー側で必要な対応（devサーバー再起動等）」の3点を含めること。

#### 2-4. 実装理解チェック

完了報告の直後に `/understand` スキルの手順を実行する。

**この自動発動では、モード選択（「いま解く」/「宿題にする」）は聞かれず、常に宿題化される**。
実装に充てたい時間を理解チェックの対話に取られないようにするため、`/understand` の自動発動（impl 経由）は
Phase M（モード選択）を経由せず、直接 Phase H（宿題化）へ直行する設計になっている（`.claude/skills/understand/SKILL.md` の起動分岐を参照）。

- `/understand` は今回の問いを**宿題用 Issue として起票する**（ローカルファイルは作らない。宿題は Issue を唯一の正とする）。
- 起票が完了した時点でこのスキルは終了する（解き終えるまでブロックしない）。
  Issue 起票に失敗した場合も、その旨を報告して完了とみなして終了してよい（impl を止めない）。
- 理解チェック本体は、外出先で宿題 Issue のコメントに `@claude` 付きで回答するか（Phase G）、
  机に戻って手動 `/understand`（Phase R）で取り組む。机で今すぐ解きたい場合も、手動 `/understand` を別途起動すれば
  Phase M でモード選択（「いま解く」）を選べる。

### エージェント一貫性の強制ルール

このスキルは `agent: frontend-engineer` で実行される。以下を厳守すること。

- **frontend-engineer が Phase 1（実装）から Phase 2（完了）まで一貫して全フェーズを担当すること**
- Phase 間でエージェントを切り替えたり、汎用エージェントに委譲してはならない
- サブエージェントを起動する場合も、必ず `subagent_type: "frontend-engineer"` を指定すること
- `subagent_type` 未指定（汎用 Agent）でのサブエージェント起動は禁止
- **例外（2-2-2 司令塔フェーズのみ）**: 実装者と異なる視点を確保するため、
  コードレビューは `system-architect`、共有DB依存テスト（IT/E2E）は `qa-engineer` への委譲を認める。
  これらは実装そのものではなく品質ゲートであり、frontend-engineer の自己レビュー/自己テストでは
  独立性が担保できないため、別エージェントに分担させる。実装作業（Phase 1）への委譲例外ではない。

### 禁止事項

- Playwright確認完了前にコミット・プッシュ・PR作成すること
- 品質チェック（format/lint）の修正差分をコミットに含めず放置すること

---
name: merge
description: PRをMerge commit方式でマージし、リモート・ローカル両方のfeatureブランチを削除して司令塔developを最新化する。マージのタイミングはユーザーが決める。
when_to_use: PRをマージしたい時、「マージして」「merge」「このPRマージ」などの発言時、PR番号を指定してマージを依頼された時。/implement の pr-review 完了後に「このままマージする」を選んだ時もこれを実行する。
---

## PRマージ

引数: `$ARGUMENTS`（PR番号。例: 123）

### 前提条件

- このスキルは**司令塔（developメイン会話）から実行する**前提。
  - `git branch --show-current` が `develop` であること。develop 以外なら「`git switch develop` してから再実行してください」と案内して停止。
- マージのタイミングはユーザーが決める。`/implement` のフロー内では自動実行せず、ユーザーが明示的に選んだ時のみ起動する。

### 手順

#### 1. マージ前チェック

```bash
gh pr view $ARGUMENTS --json number,title,headRefName,baseRefName,state,mergeable,mergeStateStatus
```

- `state` が `OPEN` であること。`MERGED` / `CLOSED` なら、その旨を報告して停止（既にマージ済みなら 4 のローカル後片付けだけ実施するか確認する）。
- `baseRefName` が `develop` であること。想定外のベース（例: `main`）なら、勝手にマージせずユーザーに確認する。
- `mergeable` が `MERGEABLE` であること。`CONFLICTING` ならコンフリクト解消が必要な旨を報告して停止（このスキルではコンフリクトを解消しない）。
- `headRefName`（= マージ対象の feature/bugfix ブランチ名）を控えておく。4 のローカル削除で使う。

#### 2. マージ実行（Merge commit 方式 + リモートブランチ削除）

```bash
gh pr merge $ARGUMENTS --merge --delete-branch
```

- **なぜ `--merge`（Merge commit）か**: feature の個々のコミットを develop の履歴の鎖に残し、
  `git checkout <コミットID>` での断面復元や `git bisect` を可能にするため。Squash は中間コミットへの
  到達性を構造的に捨てるため採用しない（2026-06-21 にユーザーと合意）。
- `--delete-branch` でリモートの feature ブランチを削除する。
- gh のバージョンによっては `--delete-branch` がローカルブランチも削除しようとするが、
  司令塔は別ブランチ（develop）にいるため、ローカル feature ブランチが残ることがある。
  そのため 4 で明示的にローカル削除を行う（gh 任せにしない）。

#### 3. 司令塔 develop を最新化

```bash
git pull --ff-only origin develop
```

- マージ結果（マージコミット）を司令塔のローカル develop に取り込み、リモートと一致させる。
- `--ff-only` が失敗する場合は、勝手に rebase / merge せず状況をユーザーに報告して指示を仰ぐ。

#### 4. ローカル feature ブランチの削除

1 で控えた `headRefName`（マージ対象ブランチ名）をローカルから削除する。

```bash
git branch -d <headRefName>
```

- **`-d`（小文字）を使う**: マージ済みでないと削除を拒否する安全側の動作。3 で develop を最新化済みなので、
  正常にマージされていれば `-d` で削除できる。
- `-d` が「not fully merged」で失敗した場合は、`-D`（強制削除）に**勝手に切り替えない**。
  未マージのコミットが残っている可能性があるため、状況をユーザーに報告して判断を仰ぐ。
- 対象ブランチのローカル worktree が残っている場合（通常は /implement の 2-2-1 で撤去済み）は、
  先に `git worktree remove` してからブランチ削除する。

#### 5. リモート追跡参照の掃除（任意）

```bash
git fetch --prune origin
```

- 削除済みリモートブランチへの追跡参照（`origin/feature/...`）をローカルから掃除する。

#### 6. 完了報告

以下を報告する:

1. マージしたPR番号・タイトル・URL
2. マージ方式（Merge commit）
3. 削除したブランチ（リモート / ローカルの両方）
4. 司令塔 develop の最新化結果（最新コミットハッシュ）
5. 異常があった場合はその内容と、ユーザーに委ねた判断

### 禁止事項

- `state` が OPEN でない、または `mergeable` が MERGEABLE でないPRを勝手にマージすること
- ベースブランチが `develop` 以外のPRをユーザー確認なしにマージすること
- ローカルブランチ削除で `-d` が失敗した際に `-D` へ勝手に切り替えること
- コンフリクトをこのスキル内で勝手に解消すること

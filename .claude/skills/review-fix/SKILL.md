---
name: review-fix
description: PRのレビュー指摘に対してコード修正を行い、対応内容を返信コメントで報告する。frontend-engineerエージェントによる自動修正。
when_to_use: レビュー指摘対応時、「レビュー修正して」「指摘対応して」「review-fix」などの発言時
context: fork
agent: frontend-engineer
---

## PRレビュー指摘対応

引数: `$ARGUMENTS`（PR番号。例: 123）

### Phase 1: PR情報とレビューコメントの取得

#### 1-1. PR概要・差分の取得

```bash
# PR概要の取得
gh pr view $ARGUMENTS

# PR差分の取得
gh pr diff $ARGUMENTS
```

#### 1-2. レビューコメントの取得

リポジトリ情報を取得し、2種類のコメントを収集する:

```bash
# リポジトリのowner/nameを取得
gh repo view --json owner,name -q '.owner.login + "/" + .name'

# レビューコメント（コード行に紐づくインラインコメント）
gh api repos/{owner}/{repo}/pulls/$ARGUMENTS/comments

# PR全体コメント（一般的な議論コメント）
gh api repos/{owner}/{repo}/issues/$ARGUMENTS/comments
```

#### 1-3. PRブランチへのチェックアウト

```bash
gh pr checkout $ARGUMENTS
```

### Phase 2: 未対応コメントの判定（ユーザー承認必須）

取得したコメントから未対応の指摘を判定する。

#### 判定ロジック

**レビューコメント（インライン）:**
1. `in_reply_to_id` がないコメント = 元コメント（指摘の起点）
2. `in_reply_to_id` があるコメント = 返信
3. 元コメントのうち、そのコメントIDに対する返信が **1件も存在しない** もの = 未対応

**PR全体コメント:**
- PRオーナー以外のコメントで、自分の返信が付いていないもの = 未対応

**除外対象:**
- `user.type` が `Bot` のコメント

#### ユーザーへの提示

未対応の指摘一覧を以下の形式で提示する:

- コメントID
- 指摘者
- 対象ファイル・行番号（レビューコメントの場合）
- 指摘内容の要約
- 自動修正が困難と判断した場合はその旨も記載

**ユーザーが「OK」と回答するまで Phase 3 に進んではならない。**

### Phase 3: コード修正

#### 3-1. 指摘内容の分析

各コメントについて:
- 指摘の種類を判別（バグ修正 / リファクタリング / スタイル修正 / ロジック変更 等）
- 対象ファイルと該当箇所を特定
- 設計ドキュメント（routing.md, wireframe.md, database.md）との整合を確認
- 修正方針を決定

#### 3-2. コード修正の実行

- 指摘ごとに修正を適用する
- 指摘の意図が不明な場合は推測せずユーザーに確認する

#### 3-3. 品質チェック（順序厳守）

1. `pnpm format`
2. `pnpm lint`（エラーがあれば修正し、再度 format を実行）

#### 3-4. 設計ドキュメント同期

修正内容がルーティング変更やDB変更を含む場合は、routing.md / wireframe.md / database.md を更新する。

### Phase 4: コミット・プッシュ

```bash
# 修正したファイルをステージング
git add <修正したファイル>

# コミット（PR番号と修正内容の要約を含める）
git commit -m "fix: address review comments on PR #$ARGUMENTS

- <修正内容の要約1>
- <修正内容の要約2>"

# プッシュ
git push
```

### Phase 5: 対応コメントへの返信

各未対応コメントに対して、対話形式で返信コメントを投稿する。

#### レビューコメント（インライン）への返信

```bash
gh api repos/{owner}/{repo}/pulls/$ARGUMENTS/comments \
  -X POST \
  -f body="対応しました。

## 修正内容
- <具体的な修正内容>

## 修正箇所
- \`<ファイルパス>\`: <何を変更したか>

---
🤖 This fix was applied by Claude Code (frontend-engineer agent)" \
  -F in_reply_to_id=<元コメントのID>
```

#### PR全体コメントへの返信

```bash
gh pr comment $ARGUMENTS --body "$(cat <<'EOF'
> <元のコメント内容を引用>

対応しました。

## 修正内容
- <具体的な修正内容>

---
🤖 This fix was applied by Claude Code (frontend-engineer agent)
EOF
)"
```

### Phase 6: 完了報告

以下をユーザーに報告する:

1. 対応した指摘の件数
2. 各指摘に対する修正内容の要約
3. 変更ファイル一覧
4. 品質チェック結果（format / lint 通過の確認）
5. 未対応のまま残した指摘があればその理由

### 禁止事項

- ユーザー承認なしでコード修正を開始すること
- 指摘の意図を確認せず推測で修正すること（不明な場合はユーザーに確認する）
- 品質チェック（format / lint）を省略してコミットすること
- 元のレビューコメントの意図と異なる修正を行うこと
- `pnpm dev` / `npm run dev` の実行（ユーザーが起動済みの開発サーバーを利用する）

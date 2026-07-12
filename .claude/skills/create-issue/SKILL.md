---
name: create-issue
description: @issue_note.txt の課題No、または Evernote 共有リンク（ノート下書き）をもとに、GitHub Issueを作成する。対応種別に応じてfeature/bugfixテンプレートを使い分ける。
when_to_use: 「Issue作成」「create-issue」などの発言時、課題No または Evernote 共有リンクを指定して Issue 作成を依頼された時
---

## GitHub Issue 作成フロー

**このスキルの目的は GitHub Issue を新規作成すること。** 設計ドキュメントの更新・同期は一切行わない（それは sync-docs スキルの役割）。本スキルで設計ドキュメントに触れるのは、Issue 本文の項目を埋めるための「読み取り専用の参照」に限る。

引数: `$ARGUMENTS`（次の2形態のいずれか）

- **課題No**（例: `ISSUE-001`）: `issue_note.txt` の該当セクションを入力ソースにする（従来どおり）
- **Evernote 共有リンク**（例: `https://share.evernote.com/note/<GUID>`）または **ノート GUID**: そのノート本文を入力ソースにする

### Phase 1: 入力ソースの判別と取得

引数の形式を先に判別し、入力ソースを決める。

- 引数が `ISSUE-` で始まる → **課題No経路（Phase 1-A）**
- 引数が `share.evernote.com/note/...` を含む共有 URL、または GUID 形式（`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`）→ **Evernote 経路（Phase 1-B）**

#### Phase 1-A: 課題No経路（`issue_note.txt`）

1. `@issue_note.txt` を読み込む
2. 引数で受け取った課題No（`$ARGUMENTS`）に一致するセクションを探す
3. 該当する課題が見つからない場合はエラーメッセージを表示して終了する

#### Phase 1-B: Evernote 経路（共有リンク / GUID）

1. 引数からノート GUID を取り出す
   - 共有 URL（`https://share.evernote.com/note/<GUID>`）の場合は末尾の `<GUID>` 部分を抽出する
   - GUID が直接渡された場合はそのまま使う
2. Evernote MCP の `get_note`（引数 `noteId=<GUID>`）でノートのタイトル・本文（ENML）を取得する
3. 取得に失敗した場合（GUID 不正・アクセス不可など）はエラーメッセージを表示して終了する
4. この経路では `issue_note.txt` は参照しない（入力ソースはノート本文）
5. ここで取り出したノート GUID は、Issue 作成後のタグ付け替え（Phase 4-1）の対象として保持しておく

> **`WebFetch` は使わない**: Evernote 共有リンクは `accounts.evernote.com` の認証リダイレクトに飛ぶため、`WebFetch` では本文を取得できない。ノート本文の取得は必ず Evernote MCP の `get_note` を使う。

### Phase 2: テンプレートの選定（経路共通）

Phase 1 でどちらの経路（課題No / Evernote）を通ったかに関わらず、以降の Phase 2〜4 は共通の手順で進める。

課題の「対応種別」に応じて使用するテンプレートを決定する。

| 対応種別 | テンプレート |
|---|---|
| 機能追加 | `.github/ISSUE_TEMPLATE/feature.md` |
| レイアウト変更 | `.github/ISSUE_TEMPLATE/feature.md` |
| アーキテクチャ変更 | `.github/ISSUE_TEMPLATE/feature.md` |
| バグ修正 | `.github/ISSUE_TEMPLATE/bugfix.md` |

- 課題No経路では、`issue_note.txt` のセクションに記載された「対応種別」を使う。
- Evernote 経路では、ノート本文から対応種別を読み取る。**本文から対応種別が判別できない場合は推測で決めず、ユーザーに確認する**（推測補完は禁止。禁止事項を参照）。

### Phase 3: Issue本文の作成

入力ソースが「課題No のセクション」か「Evernote ノート本文」かに関わらず、下記の各テンプレート項目マッピングは共通で使う（「課題の〜」と書かれた箇所は、Evernote 経路ではノート本文の該当内容と読み替える）。

#### feature テンプレートの場合

Issue 本文の各項目を埋めるための材料として、設計ドキュメント（routing.md, wireframe.md, database.md, README.md）を読み取り専用で参照する（ドキュメント側は変更しない）。課題情報をテンプレートの各セクションに転記する。

- **概要**: 課題の「課題」「なぜそれをやるのか？」を要約
- **対象画面 / ルーティング**: 課題の「対象システム」「対象ページ」から特定し、routing.md と照合
- **仕様（ユーザー視点）**: 課題の「期待する状態」をもとに記載
- **データ要件**: 課題の「前提条件」や database.md から関連テーブルを特定
- **UI 要件**: wireframe.md から対象ページのUI仕様を参照して記載
- **振る舞い・ロジック**: 課題内容から想定される動作を記載
- **受入条件**: 課題の「受入条件」をPlaywrightで検証可能な形に変換
- **未確定事項 / 確認事項**: 課題の「やらないこと」や不明点を記載
- **補足**: その他の制約・注意点を記載

#### bugfix テンプレートの場合

- **バグ概要**: 課題の「課題」を記載
- **発生箇所**: 課題の「対象ページ」「対象機能」から特定
- **再現手順**: 課題内容から再現手順を推定して記載
- **期待した結果**: 課題の「期待する状態」を記載
- **実際の結果**: 課題の「課題」から現状を記載
- **受入条件**: 課題の「受入条件」をPlaywrightで検証可能な形に変換

### Phase 4: Issue作成（ユーザー承認必須）

#### Phase 4-0: Issue の作成

1. 作成するIssue本文をユーザーに提示する
2. **ユーザーが「OK」と回答するまで Issue を作成してはならない**
3. OK後、`gh issue create` コマンドでIssueを作成する

```bash
gh issue create --title "Issue タイトル" --body "$(cat <<'EOF'
Issue 本文
EOF
)"
```

4. 作成されたIssue URLを報告する

#### Phase 4-1: 元ノートのタグ付け替え（Evernote 経路のみ・自動実行）

**このステップは Evernote 経路（Phase 1-B を通った場合）のみ実行する。課題No経路（Phase 1-A）では実行しない。**

`gh issue create` が成功したら（Issue URL が返ってきたら）、ユーザー確認なしで、Phase 1-B で保持したノート GUID の元ノートに対してタグを付け替える。

1. `search_tags` で `未解決` と `解決済み` のタグ GUID を解決する
   - `update_note_tags` はタグ名ではなく **タグ GUID** で `tagIdsToAdd` / `tagIdsToRemove` を受け取るため、名前→GUID の解決が必要。
   - `解決済み` タグは既存のものを使う（新規作成はしない）。
2. `update_note_tags` を実行する
   - `noteIds`: 元ノート GUID（Phase 1-B で保持したもの）
   - `tagIdsToAdd`: `解決済み` の GUID
   - `tagIdsToRemove`: `未解決` の GUID
   - `update_note_tags` は冪等（付与済み・未付与のタグは silently skip される）ため、元ノートに `未解決` が付いていない場合は除去は何も起きず、`解決済み` の付与のみが行われる。

**実行順序と失敗時の振る舞い（厳守）**:

- タグ付け替えは **Issue 作成成功後にのみ** 行う。`gh issue create` が失敗した場合はタグを一切触らない（Issue 化されていない下書きが「解決済み」になる事故を防ぐ）。
- タグ付け替え自体が失敗した場合は、**Issue 作成の成功は打ち消さず**、「Issue は作成済み・タグ付け替えに失敗」と明示して報告する。
- 完了報告に「元ノートのタグを『未解決』→『解決済み』に更新しました」の旨を1行含める（Evernote 経路時のみ）。

### Phase 5: セッション名の提示（Issue作成成功後）

Issue作成に成功したら、報告の最後に **`/rename` コマンドを単独の1行で**提示する。
ユーザーはこの1行をそのままコピペして実行することで、`claude --resume` のピッカーで「どのIssueの作業をしていたセッションか」を一目で判別できる。

- 形式: `/rename #<Issue番号> <Issueタイトル>`
  - 例: `/rename #261 店舗検索のビールカテゴリ複数選択対応`
- タイトルが長い場合は要点を30字程度に短縮してよい（元のIssueタイトルそのままでも可）
- コードブロックで囲まず、コピペしやすいよう独立した1行のプレーンテキストで提示する
- このコマンドはユーザーが対話セッションで実行するものであり、本スキル（サブエージェント）側では実行しない／実行できない

### 禁止事項

- ユーザー承認なしでIssueを作成すること
- @issue_note.txt に存在しない課題Noで作成を試みること
- テンプレートの構造を無視してIssue本文を作成すること
- 課題情報を推測で補完すること（不明点は「未確定事項」に記載する）。Evernote 経路で本文から「対応種別」が判別できない場合も推測で決めず、ユーザーに確認すること
- Evernote 共有リンクの本文取得を `WebFetch` で試みること（認証リダイレクトで取得できない。必ず Evernote MCP の `get_note` を使う）
- 設計ドキュメント（routing.md / wireframe.md / database.md / README.md）を更新・同期すること（本スキルは参照のみ。同期は sync-docs の役割）
- 課題No経路（Phase 1-A）で元ノートのタグを付け替えること（タグ付け替えは Evernote 経路の Phase 4-1 のみ）
- Issue 作成が失敗しているのに元ノートのタグを付け替えること（タグ付け替えは `gh issue create` 成功後のみ）
- `解決済み` タグを新規作成すること（既存タグを使う。存在しなければ付け替えをスキップして報告する）

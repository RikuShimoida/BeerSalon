---
name: create-issue
description: @issue_note.txt の課題Noをもとに、GitHub Issueを作成する。対応種別に応じてfeature/bugfixテンプレートを使い分ける。
when_to_use: 「Issue作成」「create-issue」などの発言時、課題Noを指定してIssue作成を依頼された時
context: fork
agent: beersalon-domain-expert
---

## GitHub Issue 作成フロー

**このスキルの目的は GitHub Issue を新規作成すること。** 設計ドキュメントの更新・同期は一切行わない（それは sync-docs スキルの役割）。本スキルで設計ドキュメントに触れるのは、Issue 本文の項目を埋めるための「読み取り専用の参照」に限る。

引数: `$ARGUMENTS`（課題No。例: ISSUE-001）

### Phase 1: 課題情報の取得

1. `@issue_note.txt` を読み込む
2. 引数で受け取った課題No（`$ARGUMENTS`）に一致するセクションを探す
3. 該当する課題が見つからない場合はエラーメッセージを表示して終了する

### Phase 2: テンプレートの選定

課題の「対応種別」に応じて使用するテンプレートを決定する。

| 対応種別 | テンプレート |
|---|---|
| 機能追加 | `.github/ISSUE_TEMPLATE/feature.md` |
| レイアウト変更 | `.github/ISSUE_TEMPLATE/feature.md` |
| アーキテクチャ変更 | `.github/ISSUE_TEMPLATE/feature.md` |
| バグ修正 | `.github/ISSUE_TEMPLATE/bugfix.md` |

### Phase 3: Issue本文の作成

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

### 禁止事項

- ユーザー承認なしでIssueを作成すること
- @issue_note.txt に存在しない課題Noで作成を試みること
- テンプレートの構造を無視してIssue本文を作成すること
- 課題情報を推測で補完すること（不明点は「未確定事項」に記載する）
- 設計ドキュメント（routing.md / wireframe.md / database.md / README.md）を更新・同期すること（本スキルは参照のみ。同期は sync-docs の役割）

---
name: implement
description: Issue起点のフルフロー実装。計画→実装→テスト→品質チェック→コミット→PR作成→完了報告を一貫して実行する。
when_to_use: 「実装して」「このIssueやって」「implement」などの発言時、Issue番号を指定して実装を依頼された時
context: fork
agent: frontend-engineer
---

## Issue起点フルフロー実装

引数: `$ARGUMENTS`（Issue番号。例: 123）

### Phase 1: 計画（ユーザー承認必須）

1. `gh issue view $ARGUMENTS` でIssue内容を取得する
2. 設計ドキュメント（routing.md, wireframe.md, database.md, README.md）と照合し、影響範囲を特定する
3. 以下を含む実行計画をユーザーに提示する
   - 影響範囲（変更対象のファイル・コンポーネント・テーブル）
   - 実装方針（どのように実装するか）
   - テスト方針（UT・E2Eで何を検証するか）

**ユーザーが「OK」と回答するまで Phase 2 に進んではならない。**

### Phase 2: 実装

#### 2-1. ブランチ作成

- developベースで feature ブランチを作成する
- `gh issue develop $ARGUMENTS --checkout` を使用する

#### 2-2. プロダクトコード実装

- Issue の要件に基づきコードを実装する

#### 2-3. UT実装・実行

- Vitest でユニットテストを実装する
- `pnpm test` で全テストがパスすることを確認する

#### 2-4. E2Eテスト実装・実行

- E2Eテスト計画をユーザーに提示し、**OKが出るまでPlaywright MCPを操作しない**
- OK後、Playwright MCPで起動済みのlocalhostに対してE2E確認を実施する
- ポートが不明な場合はユーザーに確認する
- 不具合を発見した場合は修正せず、再現手順・期待結果・実際の結果を報告する

#### 2-5. 品質チェック（順序厳守）

1. `pnpm format`
2. `pnpm lint`（エラーがあれば修正し、再度formatを実行）

#### 2-6. 設計ドキュメント同期

- 実装内容に応じて routing.md / wireframe.md / database.md / README.md を更新する
- コードと設計ドキュメントの内容が一致していることを確認する

### Phase 3: 完了

#### 3-1. コミット・プッシュ

- すべての変更（コード・テスト・ドキュメント）をコミットする
- コミットメッセージにIssue番号を含める
- プッシュする

#### 3-2. PR作成

- `gh pr create --base develop` でPRを作成する
- PR本文に `Closes #Issue番号` を記載する

#### 3-3. 完了報告

以下を報告する:

1. 修正内容（何を変更したか）
2. 修正理由（なぜその変更が必要だったか）
3. 変更ファイル一覧
4. UT結果
5. E2E結果
6. 設計ドキュメント更新の有無と内容
7. PR URL

### エージェント一貫性の強制ルール

このスキルは `agent: frontend-engineer` で実行される。以下を厳守すること。

- **frontend-engineer が Phase 1（計画）から Phase 3（完了）まで一貫して全フェーズを担当すること**
- Phase 間でエージェントを切り替えたり、汎用エージェントに委譲してはならない
- サブエージェントを起動する場合も、必ず `subagent_type: "frontend-engineer"` を指定すること
- `subagent_type` 未指定（汎用 Agent）でのサブエージェント起動は禁止

### 禁止事項

- Playwright確認完了前にコミット・プッシュ・PR作成すること
- 品質チェック（format/lint）の修正差分をコミットに含めず放置すること

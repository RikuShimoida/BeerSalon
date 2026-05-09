---
name: plan
description: Issue起点の実装計画を作成する。Issueの内容と設計ドキュメントを照合し、影響範囲・実装方針・テスト方針を含む計画を出力する。
when_to_use: 「計画して」「plan」「プラン」などの発言時、Issue番号を指定して実装計画を依頼された時
context: fork
agent: frontend-engineer
---

## Issue起点の実装計画

引数: `$ARGUMENTS`（Issue番号。例: 123）

### 手順

1. `gh issue view $ARGUMENTS` でIssue内容を取得する
2. 設計ドキュメント（routing.md, wireframe.md, database.md, README.md）と照合し、影響範囲を特定する
3. 以下を含む実行計画をユーザーに提示する
   - 影響範囲（変更対象のファイル・コンポーネント・テーブル）
   - 実装方針（どのように実装するか）
   - テスト方針（UT・E2Eで何を検証するか）

### 計画出力後の案内

計画を出力したら、以下のメッセージをユーザーに提示して終了する:

```
計画内容を確認し、問題なければ `/implement $ARGUMENTS` で実装を開始してください。
修正が必要な場合はフィードバックをお願いします。再度 `/plan $ARGUMENTS` で計画を修正します。
```

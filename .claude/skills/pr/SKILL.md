---
name: pr
description: ブランチ・Git運用ルール。feature ブランチ作成、コミット、プッシュ、PR作成の手順。品質チェック後のGit操作フロー。
when_to_use: PR作成時、ブランチ作成時、「PR作って」「プルリク」「pushして」「PRお願い」などの発言時
---

## ブランチ・Git 運用ルール

### ブランチ作成

- gh コマンドを使用すること
- 修正前に必ず develop ブランチから feature ブランチを作成する
  - 例: feature/profile-input

### コミット〜PR作成（順序厳守）

品質チェック（format / lint / Playwright 検証）が完了していることを前提に、以下を実行する。

1. **`git status` を確認し、差分が存在することを確認する**
2. **すべての差分を含めてコミットする**
   - フォーマット・lint 修正による差分を含めること
   - git の命名規則に従う
3. **プッシュする**
4. **PR を作成する（into は develop）**

### 完了条件

- 作業完了時点で `git status` が clean であること
- コミット後に新たな差分を発生させ、そのまま放置しないこと

### PR と Issue のクローズルール

- **PR をクローズ（マージまたは Close）した場合、関連付けられている Issue も必ずクローズすること**
- PR と Issue の紐付けは、PR 作成時に本文に `Closes #issue番号` を記載することで自動化される
- 手動で PR を Close した場合は、必ず関連 Issue も手動で Close すること
- Issue 番号の確認方法:
  - PR 作成時に紐付けた Issue 番号を確認
  - `gh pr view <PR番号>` で関連 Issue を確認

### 実行コマンド例

```bash
# PR をマージ後、関連 Issue を自動クローズ（"Closes #123" が本文にある場合）
gh pr merge <PR番号> --merge

# 手動で PR をクローズした場合は、Issue も手動でクローズ
gh pr close <PR番号>
gh issue close <Issue番号>
```

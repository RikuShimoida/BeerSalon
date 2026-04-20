---
name: pr
description: ブランチ・Git運用ルール。feature ブランチ作成、コミット、プッシュ、PR作成の手順。
when_to_use: PR作成時、ブランチ作成時、「PR作って」「プルリク」などの発言時
---

## ブランチ・Git 運用ルール

### 作業手順

- gh コマンドを使用すること
- 修正前に必ず develop ブランチから feature ブランチを作成する
  - 例: feature/profile-input
- 作業完了後は以下を必ず行うこと
  - コミット（git の命名規則に従う）
  - プッシュ
  - PR 作成（into は develop とすること）

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

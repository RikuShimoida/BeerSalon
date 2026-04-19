---
name: create-test-user
description: テストユーザーの作成・管理ルール。email-pass.txtへの記録とGit管理除外。
user_invocable: true
auto_trigger:
  - テストユーザー作成時
  - 「テストユーザー」「テスト用アカウント」などの発言時
---

## テストユーザー管理ルール

### テストユーザー作成時のルール

- テスト用ユーザーを作成する場合は、以下の情報を必ず `email-pass.txt` に記載すること
  - ニックネーム
  - メールアドレス
  - パスワード
- フォーマットは人間が見て分かる形で簡潔に記載すること
  - 例：
    ```
    nickname: test-user-01
    email: test01@example.com
    password: TestPass123!
    ```

### Git 管理に関するルール

- `email-pass.txt` は **機密情報を含むため、Git 管理に含めてはならない**
- `.gitignore` に必ず `email-pass.txt` を追加すること
- 既に Git 管理下に存在する場合は、速やかに管理対象から除外すること

### 禁止事項

- テストユーザーの認証情報をコード内にハードコードすること
- Issue、PR、コメント、ドキュメント内にパスワードを直接記載すること
- `email-pass.txt` の内容をそのまま出力・共有すること

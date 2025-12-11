# 新規登録機能の検証手順

## 事前準備

### 1. Supabaseの再起動（既に完了）
```bash
supabase stop
supabase start
```

### 2. 既存ユーザーデータのクリア
Supabase Studioにアクセス: http://127.0.0.1:54323

1. 左メニューから「Authentication」→「Users」を選択
2. 既存のユーザーがいれば全て削除
3. ブラウザのCookieもクリア（シークレットモードを推奨）

## 検証手順

### 1. 開発サーバーの起動
```bash
npm run dev
```

### 2. 新規登録のテスト

1. ブラウザで http://localhost:3000/signup にアクセス
2. 新しいメールアドレスとパスワードを入力
3. 「登録」ボタンをクリック
4. **ターミナルのログを確認**

#### 期待されるログ出力（正常な場合）
```
=== signUp() Debug Info ===
Session: NULL (正常)
User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
User Email: test@example.com
Email Confirmed: null
User Role: authenticated
=========================
```

#### 問題がある場合のログ
```
=== signUp() Debug Info ===
Session: EXISTS (問題あり)
...
警告: セッションが発行されています。config.toml の enable_confirmations が false の可能性があります。
```

### 3. 画面の確認

#### 正常な場合
- `/signup?success=true` にリダイレクトされる
- 「確認メールを送信しました」というメッセージが表示される
- ログイン状態にはなっていない

#### 問題がある場合
- リダイレクト後もログイン状態になっている
- `/` や他のページにアクセスできる

### 4. メールの確認

1. Mailpit（旧Inbucket）にアクセス: http://127.0.0.1:54324
2. 確認メールが届いているか確認
3. メール内のリンクをクリック
4. `/signup/profile` にリダイレクトされる

## トラブルシューティング

### 問題1: Session が NULL にならない

**原因**: `enable_confirmations` の設定が反映されていない

**解決策**:
```bash
# config.tomlを確認
grep "enable_confirmations" supabase/config.toml

# 出力が以下であることを確認
# enable_confirmations = true

# 再起動
supabase stop && supabase start
```

### 問題2: リダイレクトされない

**原因**: `redirect()` の位置が間違っている、またはエラーが発生している

**解決策**: ターミナルのエラーログを確認

### 問題3: メールが届かない

**原因**: ローカル開発環境ではMailpitに送信される

**解決策**: http://127.0.0.1:54324 を確認

## 現在のログを確認する

このファイルを読んだ後、以下を実行してください:

1. ブラウザのシークレットモードで http://localhost:3000/signup にアクセス
2. 新しいメールアドレス（例: test123@example.com）で登録
3. ターミナルに表示される「=== signUp() Debug Info ===」のログをコピー
4. そのログを私に共有してください

これにより、何が起きているのか正確に把握できます。

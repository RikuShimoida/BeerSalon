---
name: supabase-setup
description: BeerSalonとBeerSalonAdminの共有DB構成、ローカルSupabase設定、ポート番号、開発フロー。
when_to_use: Supabase関連の作業時、DB接続設定時、「supabase」「データベース」「.env」などの発言時
---

## データベース構成

### BeerSalonとBeerSalonAdminの関係

**重要**: BeerSalonとBeerSalonAdminは**同じデータベースを共有**する。

- **BeerSalon**: フロントエンドアプリ（ユーザー向け）
- **BeerSalonAdmin**: 管理画面アプリ（バーオーナー・管理者向け）

両アプリケーションは同じSupabaseインスタンスに接続し、同じ`bars`テーブルやその他のマスターデータを共有する。

### ローカル開発環境でのSupabase設定

```bash
# .env.local（両アプリ共通）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

**ポート番号**:
- BeerSalon Supabaseインスタンス: `54421` (Kong), `54422` (PostgreSQL)
- このポート番号をBeerSalonAdminでも共有する

### 注意事項

- BeerSalonプロジェクトでSupabaseを起動したら（`supabase start`）、そのポート番号を確認すること
- BeerSalonAdminの`.env.local`でも同じポート（54421）を指定すること
- 両アプリが異なるデータベースを参照すると、データが同期されない
- マイグレーションはBeerSalonプロジェクトで実行する

### 開発フロー

1. BeerSalonプロジェクトでSupabaseを起動（`supabase start`）
2. BeerSalonAdminの`.env.local`でポート54421を指定
3. 両アプリが同じデータベースに接続されていることを確認
4. BeerSalonAdminでバーを追加
5. BeerSalonアプリでそのバーが表示されることを確認

---
globs: prisma/**, supabase/**, **/.env*, **/route.ts, **/route.tsx
---

## データベース構成

### apps/web と apps/admin のデータベース共有

**重要**: `apps/web`（ユーザー画面）と `apps/admin`（管理画面）は**同じデータベースを共有**する。

両アプリは同じSupabaseインスタンスに接続し、同じ`bars`テーブルやその他のマスターデータを共有する。

### ローカル開発環境でのSupabase設定

```bash
# apps/web/.env.local, apps/admin/.env.local（両アプリ共通）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

**ポート番号**:
- Supabaseインスタンス: `54421` (Kong), `54422` (PostgreSQL)
- `apps/web` と `apps/admin` の両方でこのポート番号を使用する

### 注意事項

- プロジェクトルートでSupabaseを起動したら（`supabase start`）、そのポート番号を確認すること
- `apps/web/.env.local` と `apps/admin/.env.local` の両方で同じポート（54421）を指定すること
- 両アプリが異なるデータベースを参照すると、データが同期されない
- マイグレーションはプロジェクトルートで実行する

### 開発フロー

1. プロジェクトルートでSupabaseを起動（`supabase start`）
2. `apps/web/.env.local` と `apps/admin/.env.local` でポート54421を指定
3. 両アプリが同じデータベースに接続されていることを確認
4. `apps/admin`（管理画面）でバーを追加
5. `apps/web`（ユーザー画面）でそのバーが表示されることを確認

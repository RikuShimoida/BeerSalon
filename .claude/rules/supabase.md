---
globs: prisma/**, supabase/**, **/.env*, **/route.ts, **/route.tsx
---

## データベース構成

### apps/web と apps/admin のDB共有

**重要**: `apps/web`（ユーザー画面）と `apps/admin`（管理画面）は**同じSupabaseインスタンス・同じDB**を共有する（`bars` 等のマスターデータも共有）。異なるDBを参照するとデータが同期されない。

### ローカル開発環境の設定（両アプリ共通の .env.local）

```bash
# apps/web/.env.local, apps/admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

- ポート: `54421` (Kong) / `54422` (PostgreSQL)。両アプリで同じポート（54421）を指定する
- マイグレーションはプロジェクトルートで実行する
- 動作確認: admin でバーを追加 → web に表示されれば同一DB共有が成立している

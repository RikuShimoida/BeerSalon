---
globs: apps/admin/**
---

## 管理画面（BeerSalonAdmin）固有ルール

- **ユーザーテーブル**: `admin_users`（`user_profiles` とは完全に別）
- **認証方式**: カスタムJWT認証（jose + bcryptjs）※ Supabase Auth は不使用
- **権限**: `bar_owner`（自分のバーのみ編集）、`admin`（全データ閲覧・編集）
- **Stripe連携**: サブスクリプション管理あり

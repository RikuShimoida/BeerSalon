---
globs: apps/admin/**
---

## 管理画面（BeerSalonAdmin）固有ルール

- **ユーザーテーブル**: `admin_users`（`user_profiles` とは完全に別）
- **認証方式**: カスタムJWT認証（jose + bcryptjs）※ Supabase Auth は不使用
- **権限**: `bar_owner`（自分のバーのみ編集）、`admin`（全データ閲覧・編集）
- **Stripe連携**: サブスクリプション管理あり
- **メール送信**: パスワード再設定メールは Resend API を直接呼び出す（`src/lib/email.ts`、Supabase Auth 非経由）。`RESEND_API_KEY` / `RESEND_FROM_EMAIL` 未設定時は送信スキップ
- **パスワード再設定**: `/password/forgot`（bar_manage_id 起点・列挙対策で中立メッセージ）→ `/password/reset?token=...`。トークンは `admin_password_reset_tokens` に SHA-256 ハッシュで保持（有効期限1時間・二重使用防止）

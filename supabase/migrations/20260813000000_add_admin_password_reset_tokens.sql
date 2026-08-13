-- Issue #347: 管理画面(BeerSalonAdmin)にパスワード再設定機能を追加する。
--
-- 背景: 管理画面はカスタムJWT認証(jose + bcryptjs, admin_users.password_hash)を使い
-- Supabase Auth のリカバリーフローが使えないため、バーオーナーがパスワードを忘れると
-- 自力で復旧できない。再設定用トークンを保持する専用テーブルを新設する。
--
-- 方針: トークンの平文は保存せず、ハッシュ(token_hash)のみを保持する。有効期限
-- (expires_at)と使用済み記録(used_at)を持ち、失効・二重使用を防ぐ。web/admin の実
-- アクセスは service_role(supabaseAdmin) 経由で RLS をバイパスするため、他テーブルと
-- 同様に RLS を有効化して deny-by-default とし、anon/authenticated からは遮断する。

CREATE TABLE public.admin_password_reset_tokens (
	id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	admin_user_id uuid NOT NULL REFERENCES public.admin_users (id) ON DELETE CASCADE,
	token_hash    text NOT NULL,
	expires_at    timestamptz NOT NULL,
	used_at       timestamptz,
	created_at    timestamptz NOT NULL DEFAULT now()
);

-- Why not token_hash に UNIQUE: 検証はハッシュ値の完全一致で行うため索引で十分。
-- admin_user_id での失効掃除・最新トークン取得を高速化する索引を張る。
CREATE INDEX idx_admin_password_reset_tokens_admin_user_id
	ON public.admin_password_reset_tokens (admin_user_id);

CREATE INDEX idx_admin_password_reset_tokens_token_hash
	ON public.admin_password_reset_tokens (token_hash);

-- RLS 有効化(deny-by-default)。ポリシーを一切作らないことで anon/authenticated からの
-- 全操作を拒否する。管理画面は supabaseAdmin(service_role) 経由で RLS をバイパスする。
ALTER TABLE public.admin_password_reset_tokens ENABLE ROW LEVEL SECURITY;

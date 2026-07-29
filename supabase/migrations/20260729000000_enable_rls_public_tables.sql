-- Issue #511: public スキーマ全テーブルの RLS 未設定を解消する。
--
-- 背景: 初期スキーマ(20241201000000_init_schema.sql)以降、public の全テーブルで
-- Row-Level Security が一度も有効化されておらず、かつ anon/authenticated ロールに
-- 過剰な DML GRANT が残っている。この二重要因により、ブラウザに露出する anon 公開鍵
-- だけで全テーブルの読み書き削除が成立してしまう(user_profiles の個人情報や
-- admin_users.password_hash の匿名取得を含む)。
--
-- 方針: 全テーブルで RLS を有効化し deny-by-default にする。ポリシーが無い状態では
-- anon/authenticated は全操作が拒否される。web/admin の実データアクセスは
-- postgres(Prisma) / service_role(supabaseAdmin) 経由で RLS をバイパスするため影響しない。
-- 唯一 authenticated ロールを使う web middleware の自己プロフィール参照だけ、
-- 明示ポリシーで許可する。

-- ステップ A: public 全テーブルで RLS を有効化(deny-by-default)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_beer_menu_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_beer_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_food_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breweries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follow_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_histories ENABLE ROW LEVEL SECURITY;

-- ステップ B: web(middleware)が壊れないための唯一のポリシー。
-- authenticated ロールが自分の行のみ SELECT できる。他人の個人情報は読めない。
-- Why not(anon への公開 SELECT を足さない): web は公開バー情報も Prisma(postgres)経由で
-- 読んでおり anon で bars 等を読む経路が存在しないため、現時点で anon ポリシーは不要。
-- 将来 anon で公開データを読む要件が出た時点で個別に SELECT ポリシーを追加する。
CREATE POLICY user_profiles_select_own ON public.user_profiles
	FOR SELECT TO authenticated
	USING (user_auth_id = auth.uid());

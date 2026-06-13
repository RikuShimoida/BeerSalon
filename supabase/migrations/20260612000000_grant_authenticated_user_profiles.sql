-- E2E CI で発生する permission denied (42501) を解消する
-- middleware が認証済みユーザーセッションで public.user_profiles を SELECT するため、
-- authenticated ロールに public スキーマ USAGE と user_profiles の読み書き権限を付与する。
-- anon にも USAGE のみ付与する（将来の RLS ポリシー適用時に必要になるため）。
-- DELETE は付与しない: user_profiles はユーザー自身が物理削除しない設計のため
-- anon への INSERT/UPDATE は付与しない: 未認証ユーザーからの更新経路は存在しないため

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

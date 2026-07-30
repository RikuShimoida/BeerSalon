-- Issue #513: anon / authenticated への過剰 DML GRANT を REVOKE し最小権限化する。
--
-- 背景: #511 で public 全テーブルの RLS を有効化したが、GRANT とデフォルト権限は
-- 過剰なまま残存していた。実 DB では anon / authenticated の両ロールが public 全テーブルに
-- GRANT ALL(DELETE/INSERT/REFERENCES/SELECT/TRIGGER/TRUNCATE/UPDATE)を保持し、
-- さらに pg_default_acl に「新規テーブル/シーケンス/関数へ anon/authenticated へ ALL を
-- 自動付与する」ALTER DEFAULT PRIVILEGES が postgres と supabase_admin の両ロール由来で
-- 残っていた。これがある限り、テーブルを追加するたびに過剰 GRANT が復活する。
--
-- 方針: anon / authenticated からテーブル・シーケンスの ALL を REVOKE し、
-- authenticated が web middleware の自己プロフィール参照に必要とする
-- user_profiles の SELECT/INSERT/UPDATE のみ再付与する(20260612000000 と一致)。
-- あわせてデフォルト権限を打ち消し、恒久的に最小権限を維持する。
-- web/admin の実データアクセスは postgres(Prisma) / service_role(supabaseAdmin) 経由で
-- RLS をバイパスするため、本 REVOKE の影響を受けない。

-- ステップ A: anon から public 全テーブルの ALL を REVOKE。
-- Why not(SELECT を残さない): anon で public データを読む経路は現状存在せず(公開バー情報も
-- Prisma 経由)、将来必要になった時点で個別テーブルに SELECT を GRANT する方針のため。
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- ステップ B: authenticated から全テーブルの ALL を REVOKE し、必要分のみ再付与。
-- Why not(user_profiles だけ個別 REVOKE しない): 全消し→必要分再付与にすることで、
-- 過去テンプレート由来の取りこぼしテーブルも確実に剥がれるため。
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- ステップ C: シーケンスの過剰 GRANT も REVOKE。
-- anon/authenticated は INSERT 経路が無く nextval を使わないため USAGE は不要。
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- ステップ D: デフォルト権限(pg_default_acl)を打ち消す。恒久対策の核。
-- 実 DB には postgres 由来と supabase_admin 由来の 2 系統の defacl が残っているが、
-- 打ち消せるのは「マイグレーション実行ロール(postgres)自身」の defacl のみ。
-- Why not(supabase_admin 由来も REVOKE しない): ALTER DEFAULT PRIVILEGES FOR ROLE
-- supabase_admin は postgres が supabase_admin のメンバーでないため permission denied となり、
-- 本番/プレビューの supabase db push(postgres 実行)でマイグレーション全体が失敗する。
-- 新規テーブルに適用される defacl は「そのテーブルを CREATE したロール」の defacl であり、
-- マイグレーションでテーブルを作るのは postgres のため、postgres 由来 defacl の REVOKE だけで
-- 新規テーブルへの過剰 GRANT は構造的に防げる(実測で新規テーブルに anon/authenticated の
-- GRANT が付かないことを確認済み)。supabase_admin が直接テーブルを作る運用経路は無い。
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Why not(USAGE ON SCHEMA public を剥がさない): 20260612000000 で anon/authenticated に
-- 付与済み。スキーマ USAGE は個別テーブル権限とは別レイヤで、テーブル GRANT を剥がせば
-- 実害はなく、RLS ポリシー評価や Auth 関連経路への副作用を避けるため維持する。

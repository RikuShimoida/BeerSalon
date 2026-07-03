-- 取得済みクーポンの利用（消し込み）を原子化する RPC。
-- 利用は user_coupons.is_used=true / used_at=now() への更新と、bar_coupons.used_count の
-- インクリメントを同時に行う必要がある。取得ボタン連打などの並行リクエストで used_count が
-- 破綻しないよう、対象行を FOR UPDATE でロックしてから検証・更新する（PL/pgSQL 関数は単一
-- トランザクションで実行され、検証失敗の RETURN でも既に確定した更新は無いため整合が保たれる）。
--
-- 戻り値は判別可能な文字列コードを返す:
--   'ok'            利用成功
--   'not_found'     対象 user_coupon が存在しない / 本人のものでない / クーポンが無効
--   'already_used'  既に利用済み
--   'expired'       有効期間外
--   'limit_reached' 利用上限到達
CREATE OR REPLACE FUNCTION use_user_coupon(
  p_user_coupon_id BIGINT,
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon_id BIGINT;
  v_is_used BOOLEAN;
  v_coupon bar_coupons%ROWTYPE;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 本人の user_coupon をロックして取得（他者のクーポンは対象外）
  SELECT coupon_id, is_used
    INTO v_coupon_id, v_is_used
  FROM user_coupons
  WHERE id = p_user_coupon_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF v_is_used THEN
    RETURN 'already_used';
  END IF;

  -- 紐づくクーポン定義をロックして検証（used_count のインクリメント前提）
  SELECT * INTO v_coupon
  FROM bar_coupons
  WHERE id = v_coupon_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_coupon.is_active THEN
    RETURN 'not_found';
  END IF;

  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > v_now THEN
    RETURN 'expired';
  END IF;
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < v_now THEN
    RETURN 'expired';
  END IF;

  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN 'limit_reached';
  END IF;

  UPDATE user_coupons
  SET is_used = true, used_at = v_now
  WHERE id = p_user_coupon_id;

  UPDATE bar_coupons
  SET used_count = used_count + 1
  WHERE id = v_coupon_id;

  RETURN 'ok';
END;
$$;

-- service_role には既存マイグレーション（20260419000001）の ALTER DEFAULT PRIVILEGES で
-- 自動付与されるが、適用順序に依存せず明示的に付与しておく。
-- web の Server Action は DATABASE_URL 経由の直接接続（postgres ロール）で RPC を呼ぶが、
-- SECURITY DEFINER のため呼び出しロールを問わず関数所有者権限で実行される。
GRANT EXECUTE ON FUNCTION use_user_coupon(BIGINT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION use_user_coupon(BIGINT, UUID) TO authenticated;

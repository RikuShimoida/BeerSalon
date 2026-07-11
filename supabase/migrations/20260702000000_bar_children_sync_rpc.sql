-- 店舗の子データ（支払い方法・営業時間）を「全削除→再登録」で同期する RPC。
-- PostgREST の複数文はトランザクション境界を持たないため、DELETE 成功後に INSERT が
-- 失敗すると子データが全消失したまま復元されない。PL/pgSQL 関数は単一トランザクションで
-- 実行され例外時に自動ロールバックされるため、DELETE と INSERT を関数内に閉じ込めて原子化する。

-- 支払い方法の同期
-- p_payment_method_ids は API 側で重複除去・整数検証済みを前提とするが、
-- UNIQUE 制約 bar_id+payment_method_id 違反を関数内でも防ぐため DISTINCT で二重防御する。
CREATE OR REPLACE FUNCTION sync_bar_payment_methods(
  p_bar_id BIGINT,
  p_payment_method_ids BIGINT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM bar_payment_methods WHERE bar_id = p_bar_id;

  IF p_payment_method_ids IS NOT NULL AND array_length(p_payment_method_ids, 1) > 0 THEN
    INSERT INTO bar_payment_methods (bar_id, payment_method_id)
    SELECT p_bar_id, ids.payment_method_id
    FROM (SELECT DISTINCT unnest(p_payment_method_ids) AS payment_method_id) AS ids;
  END IF;
END;
$$;

-- 営業時間の同期
-- p_opening_hours は整形済み（open_time/close_time は HH:MM:SS、is_closed 反映済み）の
-- jsonb 配列を前提とする。整形ロジックは API 側に残し、関数は書き込みの原子化のみを担う。
CREATE OR REPLACE FUNCTION sync_bar_opening_hours(
  p_bar_id BIGINT,
  p_opening_hours JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM bar_opening_hours WHERE bar_id = p_bar_id;

  IF p_opening_hours IS NOT NULL AND jsonb_array_length(p_opening_hours) > 0 THEN
    INSERT INTO bar_opening_hours (
      bar_id, day_of_week, open_time, close_time, sort_order, is_closed
    )
    SELECT
      p_bar_id,
      (elem->>'day_of_week')::INTEGER,
      (elem->>'open_time')::TIME,
      (elem->>'close_time')::TIME,
      (elem->>'sort_order')::INTEGER,
      (elem->>'is_closed')::BOOLEAN
    FROM jsonb_array_elements(p_opening_hours) AS elem;
  END IF;
END;
$$;

-- service_role には既存マイグレーション（20260419000001）の
-- ALTER DEFAULT PRIVILEGES ... GRANT EXECUTE ON FUNCTIONS で自動付与されるが、
-- 適用順序に依存せず明示的に付与しておく。
GRANT EXECUTE ON FUNCTION sync_bar_payment_methods(BIGINT, BIGINT[]) TO service_role;
GRANT EXECUTE ON FUNCTION sync_bar_opening_hours(BIGINT, JSONB) TO service_role;

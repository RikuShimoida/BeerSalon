-- まず、重複する閲覧履歴を削除（各user_id, bar_idの組み合わせで最新のviewed_atのみ残す）
DELETE FROM view_histories
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, bar_id) id
  FROM view_histories
  ORDER BY user_id, bar_id, viewed_at DESC
);

-- 次に、UNIQUE制約を追加
CREATE UNIQUE INDEX "view_histories_user_id_bar_id_key" ON "view_histories"("user_id", "bar_id");

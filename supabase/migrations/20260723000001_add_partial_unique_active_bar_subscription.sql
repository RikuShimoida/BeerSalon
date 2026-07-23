-- #335 二重課金防止の最終防波堤。checkout の 409 ガードは「DB に既に有効行がある」ときしか
-- 効かず、連打・複数タブ・並行リクエストで webhook 到達前に Checkout セッションが2つ生成されると、
-- 別々の stripe_subscription_id を持つ2行が同一 bar_id に insert され得る（二重課金）。
-- bar_id × 有効 status に部分ユニークインデックスを張り、DB レイヤーで1店舗1有効サブスクを保証する。

-- Why not: 全 status を対象にした UNIQUE(bar_id) だと、過去の解約（canceled）や incomplete の
--   履歴行が複数残るケースを弾いてしまう。有効な課金状態（active/trialing/past_due）に限定した
--   部分インデックスにする。
-- Why not: 単にインデックスを張るだけだと、既に有効行が重複している DB では作成が失敗する。
--   万一の重複を先に1行（id 最小）へ集約してから張る。
DELETE FROM bar_subscriptions a
USING bar_subscriptions b
WHERE a.bar_id = b.bar_id
  AND a.status IN ('active', 'trialing', 'past_due')
  AND b.status IN ('active', 'trialing', 'past_due')
  AND a.id > b.id;

CREATE UNIQUE INDEX "uniq_bar_subscriptions_active_bar_id"
  ON "bar_subscriptions" ("bar_id")
  WHERE status IN ('active', 'trialing', 'past_due');

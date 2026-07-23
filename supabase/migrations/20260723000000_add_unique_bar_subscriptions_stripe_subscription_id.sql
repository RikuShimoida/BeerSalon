-- #335 Stripe Checkout サブスク開始フローの webhook insert を冪等化するための UNIQUE 制約。
-- Stripe は at-least-once 配信のため customer.subscription.created が重複・逆順で届きうる。
-- stripe_subscription_id を一意にし、webhook 側の upsert(onConflict) が二重行を作らないようにする。

-- Why not: 単に UNIQUE 制約を張るだけだと、既に重複行が存在する DB では制約作成が失敗する。
--   万一の既存重複を先に1行へ集約してから制約を張る（id 最小の行を残す）。
DELETE FROM bar_subscriptions a
USING bar_subscriptions b
WHERE a.stripe_subscription_id = b.stripe_subscription_id
  AND a.id > b.id;

-- 既存の通常インデックスは UNIQUE インデックスで代替できるため落とす。
DROP INDEX IF EXISTS "idx_bar_subscriptions_stripe_subscription_id";

ALTER TABLE "bar_subscriptions"
  ADD CONSTRAINT "bar_subscriptions_stripe_subscription_id_key"
  UNIQUE ("stripe_subscription_id");

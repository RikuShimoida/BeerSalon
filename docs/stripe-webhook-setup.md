# Stripe Webhook 設定手順（Preview / 本番）

Issue #528 の受入条件のうち、**コードでは解決できない環境作業**をまとめる。
決済成功を BeerSalon の DB（`bar_subscriptions`）へ反映するには、Stripe 側で webhook
エンドポイントを登録し、その署名シークレット（`STRIPE_WEBHOOK_SECRET`）を Vercel の
該当環境に登録する必要がある。コード側（webhook 受け口・課金バッジ切替）は実装・テスト済みで、
本手順を完了すると決済完了 → 「課金中」バッジ切替が自動で動く。

## 前提（コード側は対応済み）

- Webhook 受け口: `apps/admin/src/app/api/webhooks/stripe/route.ts`
  - 署名検証に `process.env.STRIPE_WEBHOOK_SECRET` を使用
  - 処理イベント: `customer.subscription.created` / `.updated` / `.deleted`、`invoice.paid` / `.payment_failed`
  - `customer.subscription.created` を受けると、Checkout の `subscription_data.metadata`
    （`bar_id` / `subscription_plan_id`）を復元して `bar_subscriptions` へ upsert する
  - at-least-once 配信に備え `stripe_subscription_id` の onConflict upsert で冪等化済み
- 課金カードの「未課金 / 課金中」バッジは subscription API の結果で切り替わるため、
  `bar_subscriptions` に active 行が入れば自動で「課金中」+ 支払い方法管理に変わる

## エンドポイント URL

環境ごとに以下のパスへ webhook を登録する（末尾にクエリ等は付けない）。

| 環境 | Webhook エンドポイント URL |
|---|---|
| Preview (develop) | `https://beer-salon-admin-develop.vercel.app/api/webhooks/stripe` |
| 本番 | `https://beer-salon-admin.vercel.app/api/webhooks/stripe` |

> Preview の安定 URL が古いデプロイを指していないこと（`beer-salon-admin-develop` エイリアスが
> 最新 develop デプロイに向いていること）を先に確認する。

## 手順（Preview を例に。本番も同じ流れ）

### 1. Stripe ダッシュボードで Webhook エンドポイントを登録

1. Stripe ダッシュボードを **テストモード**（Preview 用）で開く
   - 本番向けに設定するときは本番モードで行う
2. 「開発者」→「Webhook」→「エンドポイントを追加」
3. 「エンドポイント URL」に上表の Preview URL を入力
4. 「リッスンするイベント」で以下を選択（コードが処理する 5 種）
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. エンドポイントを作成する

### 2. 署名シークレットを控える

作成したエンドポイントの詳細画面で「署名シークレット」（`whsec_...`）を表示してコピーする。
これが `STRIPE_WEBHOOK_SECRET` の値になる。**Preview と本番でシークレットは別物**なので取り違えない。

### 3. Vercel に `STRIPE_WEBHOOK_SECRET` を登録

admin プロジェクトの環境変数として、対象環境（Preview / Production）に登録する。

```bash
# Preview に登録
vercel env add STRIPE_WEBHOOK_SECRET preview
# → プロンプトで whsec_... を貼り付け

# 本番に登録する場合
vercel env add STRIPE_WEBHOOK_SECRET production
```

- **`SUPABASE_SERVICE_ROLE_KEY` が対象環境に正しく入っているかも併せて確認する**。
  webhook ハンドラは `supabaseAdmin`（service_role）で `bar_subscriptions` へ書き込むため、
  Preview の service_role キーが anon キーにすり替わっていると RLS で書き込みが無言失敗する。

### 4. 再デプロイして反映

環境変数は既存のデプロイには反映されないため、対象環境を再デプロイする。

```bash
# deploy.yml の再実行、または
vercel --prebuilt   # 対象環境へ
```

## 動作確認

1. Preview の管理画面に bar_owner でログインし、対象店舗の課金カードから Checkout を開始
2. Stripe テストカード（`4242 4242 4242 4242` 等）で決済を完了
3. Stripe ダッシュボードの「Webhook」→当該エンドポイントの「送信済みイベント」で
   `customer.subscription.created` が **200** で配信されていることを確認
   - 400（署名検証失敗）なら `STRIPE_WEBHOOK_SECRET` の値・環境が誤っている
   - 500 なら Vercel Runtime Logs でハンドラのエラー（service_role キー等）を確認
4. `bar_subscriptions` に当該 `bar_id` の `status = active` 行が作成されていることを確認
5. 店舗詳細を再読込し、課金カードが「課金中」バッジ + 支払い方法管理に切り替わることを確認

## 本番移行時の注意

- 本番モードの Stripe で別エンドポイントを登録し、本番用 `STRIPE_WEBHOOK_SECRET` を
  Production 環境に登録する（テストモードのシークレットは本番では使えない）。
- 決済後の戻り先 URL はコード側でリクエストオリジン（`x-forwarded-host`）から解決するため、
  本番ドメインからの決済は本番へ戻る。環境変数の戻り先設定は不要（Issue #528 課題2で対応済み）。

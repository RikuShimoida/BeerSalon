# Stripe 決済まわりの環境設定手順（Preview / 本番）

Issue #528 のうち、**コードでは解決できない環境作業**をまとめる。対象は次の2つ。

1. **戻り先URL用の env 是正**（課題2の環境側対応）: admin の `ADMIN_BASE_URL` /
   `NEXT_PUBLIC_APP_URL`（Preview）が本番ドメインを指しているのを、プレビュードメインへ直す。
2. **webhook 設定**（課題1）: Stripe ダッシュボードで webhook エンドポイントを登録し、
   実際の署名シークレット（`STRIPE_WEBHOOK_SECRET`）を Preview / 本番に登録する。

コード側（オリジン解決・webhook 受け口・課金バッジ切替）は実装・テスト済み。本手順を完了すると、
決済完了 → 「課金中」バッジ切替、および決済後に決済元オリジンへ戻る挙動が揃う。

---

## 1. 戻り先URL用の env 是正（課題2の環境側対応）

### 背景

admin のオリジン解決 `resolveRequestOrigin`（`apps/admin/src/lib/request-origin.ts`）は、
Host Header Injection を防ぐため **env（`ADMIN_BASE_URL` → `NEXT_PUBLIC_APP_URL`）を最優先**に解決する
（web 側 `getSiteUrl` と揃えた方針）。したがって Preview の戻り先を正しくするには、
**Preview 環境の env をプレビュードメインに設定する**必要がある。

### 現状（2026-08-03 時点の実測）

`vercel env pull --environment=preview`（apps/admin）で確認した値:

| env（admin Preview） | 現状の値 | あるべき値 |
|---|---|---|
| `ADMIN_BASE_URL` | `https://beer-salon-admin.vercel.app`（本番） | `https://beer-salon-admin-develop.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://beer-salon-admin.vercel.app`（本番） | `https://beer-salon-admin-develop.vercel.app` |

プレビューの安定URLは `beer-salon-admin-develop.vercel.app`（`vercel alias ls` で最新 Preview デプロイを指す）。

### 手順

```bash
cd apps/admin

# 既存の Preview 値を差し替える（remove → add）
vercel env rm ADMIN_BASE_URL preview
vercel env add ADMIN_BASE_URL preview
# → プロンプトで https://beer-salon-admin-develop.vercel.app を入力

vercel env rm NEXT_PUBLIC_APP_URL preview
vercel env add NEXT_PUBLIC_APP_URL preview
# → 同上
```

### 反映（env 変更は再デプロイ＋alias付け替えが必要）

env 変更は既存デプロイに反映されない。かつ `vercel redeploy` では固定 alias が自動で付け替わらない。

```bash
# develop を push して deploy.yml 経由で再デプロイ（推奨。alias まで面倒を見る）
# または手動の場合は redeploy 後に必ず alias を付け替える:
vercel alias set <新しいPreviewデプロイURL> beer-salon-admin-develop.vercel.app
```

### 本番について

本番（Production）の `ADMIN_BASE_URL` は `https://beer-salon-admin.vercel.app`（本番ドメイン）で正しい。
本番からの決済は env（本番ドメイン）優先で本番へ戻るため、本番側の是正は不要。

---

## 2. Webhook 設定（課題1）

### 前提（コード側は対応済み）

- Webhook 受け口: `apps/admin/src/app/api/webhooks/stripe/route.ts`
  - 署名検証に `process.env.STRIPE_WEBHOOK_SECRET` を使用
  - 処理イベント: `customer.subscription.created` / `.updated` / `.deleted`、`invoice.paid` / `.payment_failed`
  - `customer.subscription.created` を受けると Checkout の `subscription_data.metadata`
    （`bar_id` / `subscription_plan_id`）を復元して `bar_subscriptions` へ upsert（onConflict で冪等化済み）
- 課金カードの「未課金 / 課金中」バッジは subscription API の結果で切り替わるため、
  `bar_subscriptions` に active 行が入れば自動で「課金中」+ 支払い方法管理に変わる

### 現状（2026-08-03 時点の実測）

`STRIPE_WEBHOOK_SECRET`（Preview）は**登録済みだが値が `whsec_dummy_for_now` というダミー**。
このままでは署名検証が通らず webhook が 400 で弾かれる。Stripe 側のエンドポイント登録も未の可能性が高い。
→ **「未登録→登録」ではなく「ダミー→実シークレット差し替え + Stripe endpoint 登録」が必要**。

### エンドポイント URL

| 環境 | Webhook エンドポイント URL |
|---|---|
| Preview (develop) | `https://beer-salon-admin-develop.vercel.app/api/webhooks/stripe` |
| 本番 | `https://beer-salon-admin.vercel.app/api/webhooks/stripe` |

### 手順（Preview を例に。本番も同じ流れ）

1. Stripe ダッシュボードを **テストモード**（Preview 用）で開く
2. 「開発者」→「Webhook」→「エンドポイントを追加」
3. 「エンドポイント URL」に上表の Preview URL を入力
4. 「リッスンするイベント」で以下5種を選択:
   - `customer.subscription.created` / `customer.subscription.updated` / `customer.subscription.deleted`
   - `invoice.paid` / `invoice.payment_failed`
5. エンドポイントを作成し、詳細画面の「署名シークレット」（`whsec_...`）をコピー
6. Vercel の Preview 環境の `STRIPE_WEBHOOK_SECRET` を実シークレットに差し替える:

```bash
cd apps/admin
vercel env rm STRIPE_WEBHOOK_SECRET preview   # ダミー値を削除
vercel env add STRIPE_WEBHOOK_SECRET preview  # 実 whsec_... を入力
```

7. 再デプロイ（上記「反映」と同じ。develop push → deploy.yml）で反映

> **`SUPABASE_SERVICE_ROLE_KEY` が対象環境に正しく入っているかも確認する**。webhook ハンドラは
> `supabaseAdmin`（service_role）で `bar_subscriptions` に書き込むため、service_role キーが
> anon キーにすり替わっていると RLS で書き込みが無言失敗する。

---

## 動作確認

1. Preview の管理画面に bar_owner でログインし、対象店舗の課金カードから Checkout を開始
2. Stripe テストカード（`4242 4242 4242 4242` 等）で決済を完了
3. **決済完了後、プレビュー（`beer-salon-admin-develop.vercel.app`）へ戻る**ことを確認（課題2）
   - 本番へ飛ぶ場合は env 是正（手順1）の再デプロイ・alias 付け替えが未反映
4. Stripe ダッシュボードの Webhook →当該エンドポイントの「送信済みイベント」で
   `customer.subscription.created` が **200** で配信されていることを確認（課題1）
   - 400（署名検証失敗）なら `STRIPE_WEBHOOK_SECRET` がダミーのまま／値・環境が誤り
   - 500 なら Vercel Runtime Logs でハンドラのエラー（service_role キー等）を確認
5. `bar_subscriptions` に当該 `bar_id` の `status = active` 行が作成されていることを確認
6. 店舗詳細を再読込し、課金カードが「課金中」バッジ + 支払い方法管理に切り替わることを確認

## 本番移行時の注意

- 本番モードの Stripe で別エンドポイントを登録し、本番用 `STRIPE_WEBHOOK_SECRET` を
  Production 環境に登録する（テストモードのシークレットは本番では使えない）。
- 戻り先 URL は env（本番は `beer-salon-admin.vercel.app`）優先で本番へ戻るため、本番側の env 是正は不要。

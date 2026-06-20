# 🍺 Beer Salon（ビアサロン）

クラフトビール × 人 × 店舗 をつなぐ  
**クラフトビール特化型の検索・投稿・集客プラットフォーム**

---

## 📌 サービス概要

Beer Salon は、クラフトビールに特化した  
「探せる・つながれる・通える」Webサービスです。

現在、クラフトビールに関する情報は

- Instagram
- 個人ブログ
- Google Maps
- 公式サイト

などに **分散しており、非常に探しづらい** 状態です。

Beer Salon は以下を1つの場所に集約します。

- 今どこで、どんなビールが飲めるのか
- 実際に飲んだ人のリアルな投稿
- クーポン・イベント情報

---

## 🎯 このサービスで解決したい課題

- クラフトビールの情報が点在しすぎている
- 初心者には敷居が高い
- 店舗側は集客効果が可視化できない
- 「行った・飲んだ」を共有する場が弱い

---

## 💡 なぜこのサービスを作るのか（背景）

- クラフトビールが純粋に好き
- 静岡はクラフトビールが全国上位の県
- 食べログにはない「ビール特化」の価値がある
- 個人開発で “本当に使われるサービス” を作りたい
- React の実務スキルを圧倒的に高めたい

---

## 🧭 サービスの特徴

- ✅ クラフトビール特化検索
- ✅ 地域・ジャンル・タグで絞り込み
- ✅ 投稿 × 店舗 × 来店の導線が一気通貫
- ✅ スタンプラリー・クーポン機能
- ✅ 店舗側に来店データを定量フィードバック

---

## 💰 収益モデル

- 店舗月額課金：**¥5,000 / 月**
- 将来的に広告 / イベント連動も検討

---

## 🚀 想定ターゲット

- 20代〜50代の男女
- クラフトビール好き
- 観光 × グルメ層
- インバウンド観光客

---

## 🛠 技術スタック

- 言語：TypeScript
- ライブラリ：React
- フレームワーク：Next.js（App Router, RSC, Server Actions）
- CSS：Tailwind CSS
- フォーム：React Hook Form
- バリデーション：Zod
- ORM：Prisma
- DB：Supabase（PostgreSQL, Auth, Storage）
- テスト：Vitest / Playwright / Faker
- Lint：Biome
- パッケージ管理：pnpm
- デプロイ：Vercel
- CI/CD：GitHub Actions
- 開発環境：VSCode
- AI支援：
  - Claude Code
  - ChatGPT
  - GitHub Copilot

---

## 📂 設計ドキュメント

詳細設計は以下に分離して管理する。

- `database.md`：テーブル設計
- `routing.md`：画面遷移・URL設計（ユーザー画面 + 管理画面）
- `wireframe.md`：ワイヤーフレーム（ユーザー画面 UI構造）
- `wireframe-admin.md`：ワイヤーフレーム（管理画面 UI構造）
- `docs/e2e.md`：E2E テスト運用ガイド（ローカル/CI 実行手順・テスト一覧・UTカバー範囲）

---

## 🧪 ローカル E2E 実行（3コマンドで完了）

Docker を起動した状態で以下の3コマンドを叩けば、E2E（web 5本 / admin 2本 = 計7本）が緑になる。
E2E はテストピラミッドの原則により最小化しており、それ以上の網羅は UT で担保している。

```bash
supabase start        # Supabase ローカルスタックを起動
pnpm e2e:setup        # seed.e2e.sql 投入 + Supabase Auth テストユーザー作成
pnpm e2e              # E2E 7本を実行 (web 5本 + admin 2本)
```

詳細・トラブルシューティング・UIモード起動方法は `docs/e2e.md` を参照。

---

## 🌐 プレビュー環境（develop 追従）

`develop` ブランチに push されると、GitHub Actions が Vercel に自動デプロイし、以下の固定 URL を最新ビルドに付け替える。
共有時はコミット別ハッシュ URL ではなく **必ずこちらを使うこと**（ハッシュ URL はそのコミット時点のビルドに固定されるため、共有後に追加修正が反映されない）。

| アプリ | プレビュー URL |
|--------|---------------|
| BeerSalon（ユーザー画面） | https://beer-salon-develop.vercel.app |
| BeerSalonAdmin（管理画面） | https://beer-salon-admin-develop.vercel.app |

`main` への merge では production（`https://beer-salon.vercel.app` / 管理画面本番ドメインは未確定）にデプロイされる。

### トラブルシュート

- **片肺で alias が古いまま残る場合**
  - `deploy-web` / `deploy-admin` は並列実行されるため、片方の alias 付与だけ失敗すると web/admin の指すコミットがズレる可能性がある。
  - 対処: `develop` に空コミット等で再 push し、両ジョブを揃え直す。
- **初回マージで `vercel alias set` が失敗する場合**
  - 同名 alias が他用途で予約済みの可能性あり。Vercel ダッシュボード → Project → Settings → Domains で該当 alias を解放してから再 push する。
- **最新を確認したいのに古いビルドが見える場合**
  - 上記固定 URL は CDN キャッシュの影響を受けることがある。ブラウザのスーパーリロード（Cmd+Shift+R）か、curl の `-H 'Cache-Control: no-cache'` で確認する。

---

## ✉️ 認証メール（登録確認・パスワード再設定）の配信設定

新規登録の確認メール・パスワード再設定メールは Supabase Auth が送信する。
**全環境でメールが届くようにするには、コード（リポジトリ）側の設定に加えて、各環境のダッシュボード／環境変数の設定が必須**。

### コード側（このリポジトリで管理。設定済み）

- `supabase/config.toml`
  - `[auth.email] enable_confirmations = true`（確認メールを送信し、確認後にプロフィール登録へ進ませる）
  - `[auth.email.template.confirmation]` / `[auth.email.template.recovery]`（日本語の確認・再設定メールテンプレート）
- `/auth/callback`（`apps/web/src/app/auth/callback/route.ts`）
  - PKCE フローの `?code=` と OTP フローの `?token_hash=&type=` の両方を処理する

### ローカル

- `supabase start` で起動する Mailpit（`http://127.0.0.1:54424`）に送信メールが届く。
- `config.toml` を変更した場合は `supabase stop && supabase start` で再起動して反映する。

### プレビュー / 本番（Supabase ダッシュボード・Vercel）※コード外。手動設定が必要

メールが「届かない」場合、まず以下を確認する。

1. **Supabase ダッシュボード → Authentication → Providers → Email**
   - "Confirm email" が ON になっていること（OFF だと確認メールが送られない）。
2. **Supabase ダッシュボード → Authentication → URL Configuration → Redirect URLs**
   - local / preview / production の各オリジンの `/auth/callback` が許可されていること。
   - Vercel Preview はワイルドカード（例: `https://*.vercel.app/auth/callback`）で登録する。
   - 許可外オリジンへのリダイレクトはブロックされ、メール内リンクが無効化される。
3. **Supabase ダッシュボード → Project Settings → Authentication → SMTP**
   - 無料枠のデフォルト SMTP は送信レート・到達率が低い。独自 SMTP（SendGrid 等）の設定を推奨。
4. **Vercel → 環境変数 `NEXT_PUBLIC_SITE_URL`**
   - production では必ず設定する（Host Header Injection 対策。`apps/web/src/lib/site-url.ts` の `getSiteUrl()` が最優先で参照する）。

---

## ✅ MVPに含める機能

- ユーザー登録 / ログイン
- プロフィール登録
- バー検索（地域 / カテゴリ / タグ）
- Google Maps表示
- 店舗詳細
- 投稿機能
- フォロー / フォロワー
- タイムライン
- お気に入り
- クーポン取得
- 通知
- 閲覧履歴

---

## 🎯 開発目的

- React / Next.js 実務スキルの証明
- フリーランス案件獲得用ポートフォリオ
- 店舗向けBtoB SaaSの実績
- 将来的な事業化・売却も視野

---

## 🔒 注意事項

- 本サービスは実験的プロダクトであり、
  実運用時にはプライバシーポリシー・利用規約を整備予定

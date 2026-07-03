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

## 🧩 開発ワークフロープラグイン（bs-workflow）

Issue 起点の実装ワークフロー（`plan` → `pr` → `pr-review` → `merge`）と E2E 動作確認（`playwright`）を、
Claude Code のプラグインとして `plugins/bs-workflow/` にバンドルしている。
このプラグインはプロジェクト固有のドメイン知識・インフラ値を含まない**汎用スキルの骨格**であり、
他プロジェクトへ持ち出して再利用できる（本リポジトリ `.claude/skills/` のプロジェクト特化スキルとは別物）。

```bash
# マニフェスト検証・ローカル読み込み
claude plugin validate ./plugins/bs-workflow
claude --plugin-dir ./plugins/bs-workflow
# 読み込み後は /bs-workflow:plan などの名前空間付きで呼び出せる
```

詳細・収録スキル一覧は `plugins/bs-workflow/README.md` を参照。

---

## 🌐 プレビュー環境（develop 追従）

`develop` ブランチに push されると、GitHub Actions が Vercel に自動デプロイし、以下の固定 URL を最新ビルドに付け替える。
共有時はコミット別ハッシュ URL ではなく **必ずこちらを使うこと**（ハッシュ URL はそのコミット時点のビルドに固定されるため、共有後に追加修正が反映されない）。

| アプリ | プレビュー URL |
|--------|---------------|
| BeerSalon（ユーザー画面） | https://beer-salon-develop.vercel.app |
| BeerSalonAdmin（管理画面） | https://beer-salon-admin-develop.vercel.app |

`main` への merge では production（`https://beer-salon.vercel.app` / 管理画面本番ドメインは未確定）にデプロイされる。

### DB マイグレーションの自動適用

`develop` / `main` に push され、`supabase/migrations/**` に変更が含まれる場合、GitHub Actions（`.github/workflows/migrate.yml`）が `supabase db push` でリモート Supabase へ未適用のマイグレーションを自動適用する。

- **preview（develop）と production（main）は別々の Supabase プロジェクトに分離している**。`migrate.yml` は `github.ref_name` に応じて適用先を切り替える（`develop` → dev プロジェクト、`main` → prod プロジェクト）。これにより、`develop` への破壊的マイグレーションが本番 DB に直撃する事故と、preview のテストデータ・テストユーザー（`auth.users`）が本番に混入する事故を防ぐ。
- `supabase db push` は `supabase_migrations.schema_migrations` を見て未適用分のみを適用するため冪等。マイグレーション変更が無い push ではワークフロー自体が起動しない（paths フィルタ）。
- 適用に失敗するとジョブが fail する。
- **`supabase/config.toml`（認証メールテンプレート・`enable_confirmations` 等）は `supabase db push` の対象外**。このワークフローでは反映されないため、config.toml を変更した場合は別途リモートへ反映する必要がある（誤って「自動反映される」と誤認しないよう、トリガーの paths からも `config.toml` を除外している）。プロジェクトを分離しているため、dev / prod の**両プロジェクト**へ手動反映が必要になる点に注意。
- **`deploy.yml`（Vercel デプロイ）と `migrate.yml` は実行順序が保証されず並列で走る**。スキーマ追加に依存するアプリ変更を同一 push に含めると、マイグレーション適用前にデプロイが先行して実行時エラーになり得る。スキーマ変更とそれに依存するアプリ変更は、マイグレーションを先行 push してから（または別 PR で先にマージしてから）アプリ変更を入れるのが安全。

**必要な GitHub Secrets**（事前に登録すること。未登録だと自動適用が動かない）:

| Secret 名 | 用途 |
|-----------|------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI のアクセストークン（`supabase link` 用）。ダッシュボード → Account → Access Tokens で発行。dev / prod 共通で1つ。**ただしトークンは組織スコープのため、dev プロジェクトは prod と同一 Supabase 組織に作成すること**（別組織に作るとこの1トークンでは dev を link できず、組織ごとに別トークンが必要になる） |
| `SUPABASE_PROJECT_ID` | **prod（main 用）** プロジェクトの ref（`supabase link --project-ref` に渡す） |
| `SUPABASE_DB_PASSWORD` | **prod（main 用）** リモート DB のパスワード（`supabase db push` 用） |
| `SUPABASE_PROJECT_ID_DEV` | **dev（develop 用）** プロジェクトの ref |
| `SUPABASE_DB_PASSWORD_DEV` | **dev（develop 用）** リモート DB のパスワード |

> `develop` push 時は `*_DEV` Secret、`main` push 時は無印（prod 用）Secret が参照される。push したブランチ側の Secret が未登録だと、`Resolve target project by branch` ステップで「どの Secret が足りないか」を明示して fail する。

> **接続文字列の注意**: dev プロジェクトの `DATABASE_URL` / `DIRECT_URL` は Session pooler を使う（過去に Pooler ホストが `aws-0` → 正しくは `aws-1` のズレで `tenant not found` が起きた経緯がある）。

> 過去に、この自動適用が存在せずリモート DB へマイグレーションが一切適用されていなかったため、プロフィール画像アップロード時にバケットが無く「画像のアップロードに失敗しました」が発生した経緯がある（Issue #313）。この仕組みはその再発防止のためのもの。

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
   - **preview（develop）と production（main）は別 Supabase プロジェクトに分離しているため、登録先プロジェクトを取り違えないこと**。preview のオリジンは dev プロジェクト、production のオリジンは prod プロジェクトに登録する。
   - dev プロジェクト: preview オリジン（Vercel Preview はワイルドカード `https://*.vercel.app/auth/callback`。固定 URL の `https://beer-salon-develop.vercel.app/auth/callback` 等）＋ローカル（`http://127.0.0.1:3000/auth/callback` 等）の `/auth/callback` を許可する。
   - prod プロジェクト: production オリジン（`https://beer-salon.vercel.app/auth/callback` 等）の `/auth/callback` を許可する。
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

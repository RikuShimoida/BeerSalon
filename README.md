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

## 🎨 配色テーマ（ユーザー画面 / apps/web）＝ Dark Taproom 基盤

ユーザー画面は **Dark Taproom（ダーク×アンバー基調）** で全画面を統一する方針（#440 で基盤導入）。配色は「テーマ」単位で差し替えられる（方式③: ビルド時・開発者切替。実行時のユーザー向けトグルは対象外）。目的は、デザインを変えても**容易に前へ戻せる**こと。配色・タイポの正は `design_handoff_user_screens/README.md` の Design Tokens 表。

```bash
# 現行 = Dark Taproom（巻き戻し先）に戻す
pnpm --filter @beersalon/web theme current

# Dark Taproom を明示的に復元する（current.css と同内容）
pnpm --filter @beersalon/web theme dark-taproom
```

- テーマ本体は `apps/web/src/styles/themes/<name>.css`（各ファイルが `:root { ... }` を1つ持つ）。
- `pnpm theme <name>` は `apps/web/src/app/globals.css` 内の `/* THEME:START */` 〜 `/* THEME:END */` で囲まれた `:root` ブロックを、指定テーマの内容へ差し替える。反映は `pnpm dev` の再ビルド / ブラウザリロードで行われる。
- **#440 で HSL トークンの透明化を解消済み**: 以前は `:root` の `--background` / `--primary` 等が HSL 成分値（`30 75% 45%`）のままで `@theme inline` が `hsl()` ラップせず、`bg-background` / `bg-primary` / `text-foreground` / `bg-card` 等が**透明（無色）**で機能していなかった。#440 で各トークンに**実 Hex 値**（例 `--primary: #e0a341`、`--background: #15100a`）を直接持たせ、`@theme inline` の `--color-*` がそれを返すことでこれらのクラスが有効化された。web 全体の面が Dark Taproom で色を持つ。
- **拡張トークン**: `--heading` / `--subtext` / `--primary-strong` / `--surface-deep` / `--surface-raised` / `--success` を追加（`text-heading` / `bg-surface-raised` 等で参照可）。
- **タイポグラフィ（`next/font`）**: `apps/web/src/app/layout.tsx` で **Zen Old Mincho**（見出し・店名・記事本文）/ **Zen Kaku Gothic New**（UI 本文・デフォルト）/ **Archivo**（ラテン見出し・ロゴ）を読み込み、CSS 変数（`--font-mincho` / `--font-gothic` / `--font-archivo`）を `<body>` に付与。デフォルト UI フォント（`font-sans`）は Zen Kaku Gothic New。明朝は `.font-mincho`、Archivo は `.font-archivo` ユーティリティで任意要素へ当てる。
- **新しいテーマを足すときは `themes/` に CSS を1つ追加するだけ**でよい（`current.css` を複製して値を変える）。手で `globals.css` の `:root` を直接編集した場合は、巻き戻し先である `themes/current.css` も同じ内容に揃えること（UT `apply-theme.test.ts` が両者の一致を検査する）。
- **旧 `amber-dark.css` は #449 で撤去済み**: #389（#383 案A）で作られた「surface トークンのみダーク化・他は旧ライト HSL 値の据え置き」テーマ。#440 の Dark Taproom 基盤化（`:root` が実 Hex トークンに置換）で、当てると surface 以外が旧 HSL 値のため透明化する壊れたテーマとなり役割を失ったため、#449 でファイル・関連テスト・本 README 記述ごと撤去した。`--surface-panel` / `--surface-control` トークン自体は Dark Taproom の現役トークン（`current.css` に実値がある）であり撤去対象ではない。

### トップページ（`/`）の Dark Taproom 再実装（#442 で `.top-amber-dark` 撤去済み）

トップ/検索ページ（`apps/web` の `/`）は #442 で Dark Taproom（1a / 2a）で再実装済み。以前 `page-client.tsx` の最上位ラッパに付いていた暫定スコープ `.top-amber-dark` は**撤去した**。

- **撤去の理由**: #440 で `:root` 自体が Dark Taproom 化され、壊れトークンが実 Hex で有効化されたため、トップの背景・文字色は共通レイアウト（`AuthenticatedLayout` の `bg-background`）と基盤トークンだけで足りる。トップ限定のスコープ上書きは役割を失っていた。
- **画面構成**: ヒーロー（オーバーライン `font-archivo` + 明朝見出し `font-mincho`）→ 検索フォーム（`SearchForm`）→ 地図（`GoogleMap`）+ 店舗一覧（`BarList`）→ 人気カテゴリ横スクロール（`components/home/popular-categories-scroll.tsx`）。PC（`md:` 以上）はヒーロー右に検索カード、地図（左・`sticky`）と一覧（右・2列グリッド）の2カラム。
- **旧モックセクション撤去**: `components/home/` にあった `popular-articles-section` / `popular-bars-section` / `popular-cities-section` / `popular-categories-section` / `popular-ranking-section` / `popular-regions-section` / `learn-about-craft-beer-card` / `footer-links`（Unsplash 画像ハードコードのモック）は #442 で削除。`home/` は実データ導線の `popular-categories-scroll.tsx` のみ残る。
- `.top-amber-dark` が globals.css・page-client から撤去されていること、`:root` が Dark Taproom の実 Hex トークンで定義されていることは UT `apply-theme.test.ts` が検査する。

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

### アプリ実行時の Supabase 接続先（Vercel 環境変数）の分離

上記 `migrate.yml` は「マイグレーションの適用先」を分離するものだが、**アプリが実行時に接続する Supabase プロジェクトは Vercel の環境変数（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `DATABASE_URL` / `DIRECT_URL`）で決まる**。この2つは別レイヤーなので、両方を分離しないと「マイグレーションは dev に流れるのにアプリは prod を見る」というズレが起きる。

- **Preview 環境変数（`beer-salon` / `beer-salon-admin` の各 Vercel プロジェクト）は dev プロジェクト（ref: `utwrpxokugqgyrntbpfw`）を指すこと**。Production 環境変数は prod（ref: `srgecvsxybsqyyhjnzsc`）を指すこと。
- `DATABASE_URL`（ポート 6543）/ `DIRECT_URL`（ポート 5432）は上記「接続文字列の注意」のとおり、両方とも **`aws-1` の Session pooler**（`postgresql://postgres.<ref>:<pw>@aws-1-ap-northeast-1.pooler.supabase.com:<port>/postgres`）を使う。`db.<ref>.supabase.co` 直結や `aws-0` は使わない。
- 過去に admin/web の Preview がいずれも prod を指しており、develop プレビューでの管理画面操作が本番 DB に直撃する状態だった（Issue #382）。上記のとおり Preview を dev に是正済み。環境変数変更は再デプロイ（`deploy.yml` 経由 = develop push）で初めて実ビルドに反映される点に注意。

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
3. **Supabase ダッシュボード → Project Settings → Authentication → SMTP（独自SMTP = Resend。dev/prod 両プロジェクトに設定する）**
   - 無料枠のデフォルト SMTP（`noreply@mail.app.supabase.io`）は送信レート（config.toml では 1時間2通）・到達率が低く「たまに届かない」状態になる。これを回避するため独自SMTP（**Resend**）に切り替える。
   - **前提（未確定・ブロッカー）**: 独自SMTP には**自分が DNS を編集できる独自ドメイン**が必要（SPF/DKIM を登録して到達率を担保するため）。当初想定した `beersalon.com` は**第三者（ドメイン転売業者 Domain Asset Holdings, LLC）が保有しており取得・DNS 編集ができない**ため使えない。**送信元ドメインは未定**であり、まず以下のいずれかを決める必要がある:
     - 取得可能な別ドメインを取る（例: `beersalon.jp` / `beer-salon.app` / `craftbeersalon.com` 等。空き状況を確認して年額数千円で取得）→ 送信元を `noreply@<取得したドメイン>` にする（**本命**）
     - ドメイン取得までの暫定として Resend の共有ドメイン（`onboarding@resend.dev`）で送る（DNS 不要ですぐ動くが到達率は独自ドメインに劣る。動作確認・暫定運用向け）
   - **手順（ドメイン確定後。dev / prod の各プロジェクトで同じ設定を行う。取り違えないこと）**:
     1. Resend でアカウントを作成し、**Domains** に**取得した独自ドメイン**を追加する。表示される SPF（`TXT`）・DKIM（`TXT`）・Return-Path 用 `CNAME`・（任意で）DMARC など、**画面に出るレコードをすべて**そのドメインの DNS に登録して Verified 状態にする。
     2. Resend の **API Keys** で送信用 API キーを発行する（`RESEND_API_KEY`）。
     3. Supabase ダッシュボード → **Project Settings → Authentication → SMTP Settings** で「Enable Custom SMTP」を ON にし、以下を設定する:
        - Host: `smtp.resend.com`
        - Port: `587`
        - Username: `resend`
        - Password: 発行した `RESEND_API_KEY`
        - Sender email: `noreply@<取得したドメイン>`
        - Sender name: `Beer Salon`
     4. あわせて **Authentication → Rate Limits** の "Emails sent per hour" を、デフォルトSMTP前提の低い値から実運用に耐える値へ引き上げる（config.toml のローカル値 `[auth.rate_limit] email_sent = 2` は Mailpit ローカル用であり、リモートには反映されない）。
   - **これは `apps/web` の全認証メール（`/signup` の確認メール・`/password/forgot`/`/password/reset` の再設定メール）に共通で効く**（すべて同一の Supabase Auth SMTP を経由するため、SMTP を切り替えれば両方が同時に改善する）。
   - **検証**: preview（dev プロジェクト）で新規登録し、メールが届くことを確認する。加えて Supabase ダッシュボード → **Logs → Auth Logs** で送信ログの `mail_from` が**設定した独自ドメインの送信元**（= デフォルトの `noreply@mail.app.supabase.io` ではない）になっていることを確認する。
   - **注意**: `supabase/config.toml` の `[auth.email.smtp]` はコメントアウトのままでよい（ローカルは Mailpit を使うため。config.toml は `supabase db push` の対象外で、この SMTP 設定はダッシュボードでの手動設定でのみ有効になる）。
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

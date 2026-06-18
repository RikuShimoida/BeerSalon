# Worktree 開発ワークフロー設計

BeerSalon の「常時 worktree 開発」と並列開発の設計をまとめたドキュメント。
2026-06-18 にユーザーと設計合意。技術的成立性は実機検証済み（後述）。

---

## 0. 撤退路（`--no-worktree`）と費用対効果の前提

このワークフローは「常時worktree」を既定とするが、**worktree作成にはタスクごとの固定オーバーヘッド
（`pnpm install` 数十秒〜数分、必要なら `prisma generate`）がある**。一方で並列化の旨味は
「実装＋UT」フェーズに限られ、IT/E2E は共有DBのため直列キューになる（§3）。

そのため、個人開発では「重い独立タスクが本当に同時に複数ある」場面以外は worktree が割に合わないことがある。

**撤退路**: `/implement <Issue> --no-worktree` でその場で従来の checkout 方式に切り替えられる
（worktree を作らず install もスキップ）。コードを巻き戻す必要はない。
worktree が恒常的に割に合わないと判断したら、運用として `--no-worktree` を既定にし、その判断をこの節に追記する。

> 「やめる」は Git で戻すのではなくスキルのスイッチで切る、が原則。
> どうしても全撤去したい場合に限り、導入PRごと revert する（再現性のある最終手段）。

## 1. 基本思想

**並列・単独を問わず、開発は必ず git worktree で行う（既定）。developメインのチェックアウトは「司令塔」専用とし、実装で汚さない。**
（`--no-worktree` 指定時はこの限りでない。§0参照）

- `develop` メインチェックアウト = 司令塔（指揮所）。常に clean に保つ。
- 各タスクの実装は `.claude/worktrees/<branch>` で行う。
- これにより「単独開発」も「並列開発」もフローの入口が統一される。

### なぜこの形か（Why）

- 司令塔の `git status` がいつ見ても綺麗で、ブランチ取り違え・stash地獄が起きない。
- `/implement`（単独）も `/parallel`（並列）も「worktreeを切る」が共通の起点になる。
- worktree はファイルを物理的に分離するので、複数タスクのコードが混ざらない。

### 重要な前提：worktree が隔離するのは「ファイルだけ」

worktree は作業ディレクトリのファイルを分離するが、**以下は全 worktree で共有されたまま**：

- **Supabase（Kong 54421 / Postgres 54422、単一インスタンス・単一物理DB）**
- **devサーバーのポート（web 3000 / admin 3001 が既定）**

→ 「常時worktree化」が解決するのは *ファイルの分離* であって *ランタイムの分離* ではない。
この事実が、以下の①②③の制約すべての根っこにある。

---

## 2. 確定した制約と対策

### ① DBスキーマ変更は直列ロック

全 worktree が同一物理DB（54422 の `postgres`）を共有するため、スキーマ変更
（`prisma/` 変更・`supabase/migrations/` 追加・`prisma generate` を要する変更）を
2つの worktree で同時に行うと互いに壊し合う。

**対策**: スキーマ変更を含むタスクは、最初の worktree がロックを取得し、他 worktree は待機（直列化）。
ロックは排他ファイル（例: `prisma/.migration.lock`）で表現する。
ロックは「同時書き込み事故」を防ぐが「変更の波及」は防げない点に注意——
スキーマ変更中は他 worktree の dev/E2E も止めるのが安全。

### ② devサーバーはポートプールから払い出し

複数 worktree で `pnpm dev` を同時起動するとポートが衝突する。

**対策（実機検証済みで成立）**:
- ポートを「プール」から払い出す（例: 3000/3001, 3100/3101, 3200/3201）。
- **`NEXT_PUBLIC_SITE_URL` を明示**してオリジンのポートを制御する。
  これを設定すれば `getSiteUrl()` の host 解決を上書きできる（実装確認済み）。
- **Supabase の Redirect URL 許可リストにポートを exact 列挙**する
  （例: `http://localhost:3000/**`, `http://localhost:3100/**` …）。
  ポート番号のワイルドカードは公式保証がないため、有限個を個別列挙して回避する。

**やってはいけない**: ポートを動的に好き勝手ずらすこと。
`getSiteUrl()`（`apps/web/src/lib/site-url.ts`）の host 解決と Supabase 許可リストがズレ、
認証・パスワードリセットのメールリンクが壊れる（routing.md 記載の挙動）。

**現状の改修要否**:
- `package.json` の dev script（`-p 3000` / `-p 3001` 固定）をポート可変にする改修が必要。
- Playwright config の baseURL / webServer.url 固定を解除する改修が必要。

### ③ E2E用DBの物理複製は「不成立」（採用しない）

> 当初「マスターDBを TEMPLATE で複製→テスト→DROP し、worktree ごとに使い捨てDBで
> ステートレスにE2E並列」という案を検討したが、**実機検証で技術的に不成立と判明した**。

**検証で確認した事実（2026-06-18、実コマンド実行）**:

1. **複製できない** — `postgres` DB に Supabase サービスの常時接続が約11本
   （PostgREST / Realtime / pg_cron / pg_net / Storage）。スタック稼働中は
   `CREATE DATABASE ... TEMPLATE postgres` が
   `source database "postgres" is being accessed by other users` で恒久的に失敗する。
2. **仮に複製できても無意味** — GoTrue（`GOTRUE_DB_DATABASE_URL`）・
   PostgREST（`PGRST_DB_URI`）・Webアプリの Prisma（`DATABASE_URL`）が
   全員 DB名 `postgres` にハードコード結合。クローンDBは認証層が誰も参照しない。
   E2Eテストユーザーは `supabase.auth.admin.createUser()` で
   Kong(54421)→GoTrue→`postgres`DB の `auth.users` に作られるため、別名DBには届かない。

**結論**: GoTrue/PostgREST/アプリが全員 `postgres` DB名に密結合しているため、
DB単位の物理分離は認証層に効かない。これは CLAUDE.md の
「supabase init 禁止・54421固定」ルールの裏返しでもある。

**代替（ステートレス化の現実解）**:
現行の「固定ID + `ON CONFLICT DO NOTHING` による冪等seed」維持を基本とし、
必要ならテスト前後の truncate でデータ空間を綺麗にする。物理DB分離は採らない。

---

## 3. 共有DB依存テスト（IT・E2E）は「司令塔での直列キュー」

③が不成立のため、共有DBに触るテストは並列化せず**司令塔（developメイン会話）が1つずつ直列実行**する。

### テストの3分類（現状のテスト実体に基づく・実機調査済み）

| フェーズ | スクリプト | 共有DB依存 | 並列可否 |
|---|---|---|---|
| 実装 + **UT** | `pnpm test`（vitest、Supabase/Prismaをモック） | 触らない | **並列OK**（worktree内で完結） |
| **IT（統合テスト）** | `pnpm test:integration`（`*.integration.test.ts`） | **触る** | **直列キュー** |
| **E2E** | `pnpm test:e2e`（Playwright） | **触る（DB＋固定ポート）** | **直列キュー** |

- IT は `apps/*/src/test/integration-setup.ts` が `supabase start` 必須・`DATABASE_URL` で実DB接続・
  `pnpm e2e:setup` の seed 済みDBを前提とする。**E2E と同じ共有DBを使う**ため、IT も E2E と同様に直列消化する。
- 「並列で作る」のは **実装 + UT まで**。IT/E2E は司令塔の直列キューへ。

以下、本節で「E2E」と書く箇所は **IT も含む共有DB依存テスト全般**を指す。

```
worktree-A (実装サブエージェント) ──「実装＋UT完了。IT/E2E要求」──┐
worktree-B (実装サブエージェント) ──「実装＋UT完了。IT/E2E要求」──┤
worktree-C (実装サブエージェント) ──「実装＋UT完了。IT/E2E要求」──┤
                                                               ▼
                                       ┌──────────────────────────────┐
                                       │ 司令塔 (developメイン)          │
                                       │ IT/E2E実行キューを管理（直列消化）│
                                       │  ① qa-engineer起動→A検証→結果へ │
                                       │  ② qa-engineer起動→B検証→結果へ │
                                       │  ③ qa-engineer起動→C検証→結果へ │
                                       └──────────────────────────────┘
```

- **並列なのは「実装＋UT」まで**。ここは各 worktree で実装サブエージェントが同時に走る（短縮効果大）。
  IT/E2E は共有DBに触るため司令塔のキューへ集約する。
- **E2E は司令塔が交通整理し、実行は `qa-engineer` エージェントに1体ずつ任せる**。
  司令塔が worktree ごとに `qa-engineer` を **1体だけ起動 → 検証完了 → 次を起動** の順で直列消化する。
- 各実装サブエージェントは最終報告に「E2E要否」を含めて返す。司令塔が要求順に消化し、
  1本終わるごとに該当タスクのPRへ結果を反映する。

### なぜ qa-engineer に任せるか（実行主体の確定）

- BeerSalon には既に `qa-engineer`（受入条件検証・Playwright担当）と `/playwright`・`/layout-review`
  スキルがあり、E2E はこのエージェントが担う前提で設計されている。司令塔が直接 `pnpm e2e` を回すより、
  検証の専門性と既存資産との一貫性を保てる。
- 司令塔が直接回すと、E2Eログや試行錯誤が司令塔のコンテキスト窓に流れ込んで肥大化する。
  実行を qa-engineer に切り出すことで司令塔は「キュー管理」に専念できる。

### 厳守事項

- **`qa-engineer` を複数同時に起動して E2E を並列で回してはいけない**（共有DB＋固定ポート競合で
  結果が非決定的になる）。司令塔は必ず「1体起動 → 完了 → 次」を守る。

### なぜ許容範囲か

BeerSalon の E2E はテストピラミッド原則で最小化されている（web 5本 + admin 2本 = 計7本、
残りは UT で担保）。1タスク分のE2Eは数分で済むため、「数分 × タスク数」の直列キューで収まる。
「並列で作って、直列で検品する」生産ライン型。検品台（共有DB＋固定ポート）が1つなので
そこだけ列になる。

---

## 4. worktree 作成の正確な手順

### develop 起点で切る（必須）

```
git fetch origin develop
git worktree add .claude/worktrees/<branch> origin/develop -b <branch>
```

- ブランチ命名は /implement と同じ規則: `feature/<issue番号>-<英語スラッグ>` 等。
- **なぜ生の `git worktree add` か**: Claude Code の Agent `isolation: "worktree"` /
  `--worktree` は既定ベースが `origin/HEAD`(=main) で、`worktree.baseRef` も
  `"fresh"`/`"head"` の2択のみ。`origin/develop` を直接指定できない（公式確認済み）。
  develop追従プレビュー運用と整合させるため、ベースを明示できる生コマンドを使う。

### worktree の初期化はスキルの手続きで行う

以下は git / Claude Code のネイティブ機能では**自動化されない**ため、スキルが明示的に実行する：

- **環境ファイルのコピー**: `apps/web/.env.local` / `apps/admin/.env.local` を新worktreeへコピー。
  - 注意: `.worktreeinclude` は git/Claude Code 標準機能では**ない**（このリポジトリ独自の取り決め）。
    実際のコピーはスキルの手続きとしてエージェントが行う。
- **依存インストール**: 新worktree内で `pnpm install`（pnpm はハードリンクで比較的速い）。

### 後片付け

- PR作成完了後、`git worktree remove .claude/worktrees/<branch>`。
- 未コミット変更が残る場合は撤去せずユーザーに報告。
- `.gitignore` に `.claude/worktrees/` を追加済み（メインチェックアウトを汚さない）。

---

## 5. アンチパターン（やってはいけない）

- worktree ごとに `supabase start`（54421単一インスタンス共有の設計に反する）
- 複数 worktree で同時にマイグレーション / `prisma generate`
- devポートを動的に好き勝手ずらす（許可リスト・SITE_URLとズレて認証が壊れる）
- E2E用にDBを物理複製しようとする（§2-③のとおり不成立）
- 複数 worktree で同時にE2Eを回す（共有DBシードが競合し非決定的になる）

---

## 6. 既存資産への影響

| 対象 | 影響 |
|---|---|
| `/implement` スキル | **worktree起点に統合済み**。1タスク=1worktreeの実装フロー本体。単独でも割り込みでもこれを呼ぶ |
| `/parallel` スキル | **薄い司令塔バッチに変更済み**。複数Issue一括投入時のみ使用。中身は各Issueへ/implement相当を発火しE2Eキューを束ねるだけ |
| `package.json` dev script | ポート可変化の改修が必要（②） |
| Playwright config | baseURL/webServer.url 固定解除の改修が必要（②） |
| `scripts/e2e-setup.sh` | 現行維持（DB名 `postgres` 固定、冪等seed）。物理分離は採らない |
| Supabase Redirect URL 許可リスト | ポートプールを exact 列挙で事前登録（②） |

---

## 7. 検証の出典

- DB物理複製不成立の実機検証: `.claude/agent-memory/dev-doctor/project_e2e_db_isolation_constraints.md`
- worktree / ポート運用の制約: `.claude/agent-memory/claude-code-expert/project_worktree_constraints.md`

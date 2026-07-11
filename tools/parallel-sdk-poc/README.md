# parallel-sdk-poc（Issue #373 調査PoC）

`/parallel` の司令塔ロジックを **Claude Agent SDK（TypeScript）で手続き的に再実装できるか**を検証する PoC。
分岐・リトライ・結果集約を決定論的なコードで表現し、自然言語スキル版との制御性・再現性を比較する。

> 本格移行するかは本 PoC の結果を見て判断する（本 Issue は調査止まり）。
> 比較評価と移行判断材料は `docs/parallel-sdk-poc.md` を参照。

## 位置づけ・隔離

- ルート pnpm workspace（`apps/*` / `packages/*`）には**含めない**。`tools/parallel-sdk-poc/pnpm-workspace.yaml`
  で独立 workspace 境界を切り、依存が親（beersalon-monorepo）へ混入しないようにしている。
- プロダクトコード（apps/web, apps/admin, prisma, supabase）には一切触れない。
- UT はこの package の Vitest で完結し、ルートの `turbo test`・共有 DB には乗らない。

## セットアップ

```bash
cd tools/parallel-sdk-poc
pnpm install
```

## 実行

```bash
pnpm poc        # dry-run 実演（実 SDK・実 worktree・実 DB に触れない）
pnpm test       # UT（決定論部分: 適格判定・振り分け・リトライ・集約）
pnpm typecheck  # 型検査（SDK の型と整合するか含む）
```

## 構成

| ファイル | 役割 | SDK 依存 | UT |
|---|---|---|---|
| `src/types.ts` | 型定義（司令塔ロジックの入出力契約・`AgentRunner` 抽象） | なし | - |
| `src/eligibility.ts` | Phase 0 適格判定（DB スキーマ変更を含むか＝並列/直列の振り分け） | なし | ✓ |
| `src/orchestrator.ts` | 並列/直列制御・リトライ・共有 DB テストの直列キュー | なし | ✓ |
| `src/report.ts` | 結果集約レポートの決定論的レンダリング | なし | ✓ |
| `src/mock-runner.ts` | dry-run 用ランナー（実 I/O なし。トレースで並行性を観測） | なし | ✓（間接） |
| `src/sdk-runner.ts` | 本番用ランナー（`query()` でサブエージェント起動） | あり | - |
| `src/main.ts` | dry-run 実演エントリ | なし | - |

**設計の肝**: `AgentRunner` インターフェースで「決定論ロジック（振り分け・集約・リトライ）」と
「SDK 呼び出し」を分離している。dry-run では `MockAgentRunner`、本番では `createSdkRunner()` を差し込む。
差し替え点が 1 箇所なので、決定論部分を SDK から切り離して UT できる。

## 本番（実 SDK）への切り替え

`src/main.ts` の `createMockRunner(...)` を `createSdkRunner(repoRoot)`（`src/sdk-runner.ts`）に差し替える。
実 SDK は実 worktree・実 DB に触れるため、切り替え時は共有インフラ制約（`docs/worktree-workflow.md`）を必ず守ること。

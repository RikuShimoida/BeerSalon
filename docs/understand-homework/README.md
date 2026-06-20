# 理解チェック宿題（understand-homework）

`/understand` スキルで「宿題にする」を選んだときに、理解チェックの問いを書き出す置き場所。

- ファイル名: `ISSUE-<Issue番号>.md`（Issue 番号が特定できない手動起動時は `MANUAL-<実装日>.md`）
- 1回の実装ぶんを1つの `## 実装` ブロックとして追記する
- 各問いは `- [ ]`（未回答）/ `- [x]`（回答済み）でステータスを表す

GitHub アプリ等からこのディレクトリのファイルを開けば、未回答の問いを後から確認できる。
机に戻ったら `/understand` を手動起動すると、未回答分を出題して回答・判定を記録する。

フォーマットと運用の正は `.claude/skills/understand/SKILL.md` を参照。

---

## 理解チェックの3方式と使い分け

理解チェックには入口が3つある。**判定基準（核心の有無・ヒント3段階・正誤）はすべて
`understand` スキルの Phase 1 を単一の正とし、どの入口でも同一**。Phase R / Phase G は
Phase 1 を参照するだけで、独自の基準は持たない（基準のブレ・三重定義を防ぐため）。

| 方式 | 入口 | いつ使うか | 出題・判定の場所 |
|---|---|---|---|
| CLI 対話 | `/understand`（その場で「いま解く」） | 机にいて、その場で解ける日 | ターミナルの対話 |
| Markdown 宿題 | `/understand`（「宿題にする」）→ 後で Phase R | 外出予定だが、解くのは机に戻ってから | `docs/understand-homework/` のファイル + CLI |
| GitHub コメント | Issue/PR コメントに `@claude` 付き投稿 | 外出先で、その場で一問一答まで完結させたい | GitHub Issue/PR のコメントスレッド |

- **Markdown 宿題と GitHub コメントは併存**する（どちらかに一本化しない）。問いを書き出すのは Markdown 宿題、
  それを GitHub Issue に転記して外出先で解くのが GitHub コメント、という補完関係。
- 宿題 Markdown の問いを GitHub Issue に転記すれば、外出先で Phase G として解ける。
  机に戻って宿題ファイルへ結果を反映したい場合は Phase R で該当ファイルを `- [x]` に更新する。

---

## GitHub コメント方式（Phase G）の運用方針

実体は GitHub Actions ワークフロー `.github/workflows/claude.yml`（`anthropics/claude-code-action`）。
以下は確定済みの方針。

- **認証**: `CLAUDE_CODE_OAUTH_TOKEN`（Claude サブスク連携）を使う。
  `ANTHROPIC_API_KEY` の従量課金は採らない（サブスク枠で運用しコストを固定するため）。
  Secret はリポジトリの Settings → Secrets に登録済み。
- **コスト負担**: サブスクリプション枠内で完結。問い1問ごとに Actions が1回起動する程度の利用を想定し、
  従量課金は発生させない。
- **トリガー範囲**: Issue コメント・PR レビューコメント・Issue 起票・PR レビューで `@claude` を含むもの
  （`claude.yml` の `if` 条件を参照）。理解チェックの宿題は専用 Issue を立て、そのコメント欄でやり取りする。
- **濫用対策（セキュリティ）**: write 権限を持つユーザーのコメントのみ `claude-code-action` が処理する
  （GitHub App の標準動作）。private リポジトリ前提のため、外部ユーザーによる無制限起動は起きない。
- **宿題 Issue の作り方**: 手動で立てる（Markdown 宿題ファイルからの自動起票は行わない）。
  宿題ファイルの問いをコピーして Issue 本文／コメントに貼り、`@claude` を付けて回答していく。
- **長大スレッドへの対処**: スレッドが長くなりトークンが嵩む場合は、問いのまとまりごとに Issue を分ける。
- **制約**: `.github/workflows/` は GitHub Actions 上の Claude 自身は編集できない。ワークフロー変更は
  ローカル（CLI）から手動で行う。

# 理解チェック宿題（understand-homework）

理解チェックを宿題化したときに、問いを書き出す置き場所。宿題化される入口は2つある:

- **`/implement` 完了時の自動発動**: モード選択を聞かず、常に宿題化される（実装時間を対話に取られないため）。
- **手動 `/understand` で「宿題にする」を選んだとき**: 机で今すぐ解きたくない日に選ぶ。

- ファイル名: `ISSUE-<Issue番号>.md`（Issue 番号が特定できない手動起動時は `MANUAL-<実装日>.md`）
- 1回の実装ぶんを1つの `## 実装` ブロックとして追記する
- 各問いは `- [ ]`（未回答）/ `- [x]`（回答済み）でステータスを表す
- ファイル冒頭の `> 宿題 Issue:` 行に、自動起票した宿題 Issue の URL を記録する（Markdown ↔ Issue の対応記録）

宿題化時は Markdown 書き出しに加えて**宿題用 Issue を自動起票する**（後述「自動起票の方針」）。
外出先からはその Issue のコメントに `@claude` 付きで回答すれば、その場で採点される（Phase G）。
机に戻ったら `/understand` を手動起動すると、未回答分を出題して回答・判定を記録する（Phase R）。

フォーマットと運用の正は `.claude/skills/understand/SKILL.md` を参照。

---

## 理解チェックの3方式と使い分け

理解チェックには入口が3つある。**判定基準（核心の有無・ヒント3段階・正誤）はすべて
`understand` スキルの Phase 1 を単一の正とし、どの入口でも同一**。Phase R / Phase G は
Phase 1 を参照するだけで、独自の基準は持たない（基準のブレ・三重定義を防ぐため）。

| 方式 | 入口 | いつ使うか | 出題・判定の場所 |
|---|---|---|---|
| CLI 対話 | 手動 `/understand`（その場で「いま解く」） | 机にいて、その場で解ける日 | ターミナルの対話 |
| Markdown 宿題 | implement 自動発動 / 手動「宿題にする」→ 後で Phase R | 外出予定だが、解くのは机に戻ってから | `docs/understand-homework/` のファイル + CLI |
| GitHub コメント | 宿題化時に自動起票された Issue に `@claude` 付き投稿 | 外出先で、その場で一問一答まで完結させたい | GitHub Issue のコメントスレッド |

- **Markdown 宿題と GitHub コメントは併存**する（どちらかに一本化しない）。問いを書き出すのは Markdown 宿題、
  それを自動起票した GitHub Issue で外出先で解くのが GitHub コメント、という補完関係。
- 宿題化すると Markdown 書き出しと同時に GitHub Issue が自動起票されるので、外出先でそのまま Phase G として解ける。
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
- **長大スレッドへの対処**: スレッドが長くなりトークンが嵩む場合は、問いのまとまりごとに Issue を分ける。
- **制約**: `.github/workflows/` は GitHub Actions 上の Claude 自身は編集できない。ワークフロー変更は
  ローカル（CLI）から手動で行う。

---

## 自動起票の方針（宿題 Issue の作り方）

宿題化時（implement 自動発動 / 手動「宿題にする」のどちらでも）、`/understand` の Phase H が
宿題用 Issue を **`gh issue create` で自動起票する**。手動転記は原則不要（失敗時のみ手動転記にフォールバック）。

- **採点指示テンプレートの置き場所**: `.claude/skills/understand/SKILL.md` の Phase H 内にインライン定義する。
  専用テンプレファイルは作らず、判定基準（Phase 1）と同じく単一の正を保つ（テンプレの二重メンテを避けるため）。
  起票される Issue 本文は `#281`（手動起票の実例）と同形で、採点指示（「`@claude` は Phase G に従い、判定基準は
  Phase 1 を単一の正として採点せよ」）＋スマホ回答方法＋各問本文を含む。
- **ラベル**: 起票時に `understand-homework` ラベルを付与する（宿題 Issue を一覧でフィルタできるようにするため）。
  ラベル未作成なら Phase H が `gh label create understand-homework` で作成してから付与する。
- **対応記録**: 起票成功後、宿題 Markdown ファイル冒頭の `> 宿題 Issue:` 行に Issue URL を追記する。
  Markdown ↔ Issue の対応を残し、机に戻って Phase R で解くときに辿れるようにする。
- **失敗時の挙動**: `gh issue create`（または `gh label create`）が失敗した場合は、Markdown 書き出しのみで完了とし、
  「Issue 起票に失敗。手動転記が必要」と報告して終了する。自動発動経由でも `/implement` はブロックしない。
  後で机に戻ったとき、Markdown の問いを手動で Issue に転記すればよい。

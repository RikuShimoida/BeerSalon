# 理解チェック宿題: ISSUE-285

> 宿題 Issue: https://github.com/RikuShimoida/BeerSalon/issues/290

## 実装: PR #287（2026-06-21 / 規模区分: 中）

プロフィール入力ページの「登録内容を確認」で確認ページへ遷移しないバグの修正。
Server Action の `redirect()` を `try/catch` の外へ出し、hidden `birthday` を controlled state 化した。

### Spring Boot 翻訳

今回の実装を Spring Boot で例えると:

**変更内容の要約**
プロフィール入力フォームを送信したとき、サーバー側処理で「確認ページへリダイレクト」する命令が
例外処理に飲み込まれて効かなくなっていたのを直した。あわせて生年月日の hidden 項目を、
画面状態（state）から自動で組み立てる方式に変えて、送信タイミングに依存しないようにした。

**ファイルごとの対応**
- `actions.ts`（Server Action）→ Spring Boot では `@Controller` の `@PostMapping` メソッドに相当
  - `redirect("/signup/confirm")` は Spring の `return "redirect:/signup/confirm"` に相当
- `profile-form.tsx`（Client Component）→ Spring では Thymeleaf テンプレート + フロント JS に相当

**使われた技術概念**
- Server Action の `redirect()`: Spring でいう `return "redirect:/path"`。ただし Next.js では
  `redirect()` は**例外を throw して制御フローを中断する**仕組みで動く点が大きく異なる。
- `useState`: Spring に対応なし。フロントエンド固有で、画面上の入力状態をメモリに保持する仕組み。
- controlled component: フォーム値を「DOM が持つ」のではなく「React の state が持つ」方式。

**Spring Boot 開発者として注意すべき違い**
- Spring の `return "redirect:..."` は単なる戻り値だが、Next.js の `redirect()` は**例外 throw**で動く。
  そのため `try/catch` で囲むと、リダイレクトの例外まで catch が捕まえてしまい、リダイレクトが
  「握りつぶされる」事故が起きる。これが今回のバグの主因。Spring の `@ExceptionHandler` で
  正常系のリダイレクトまで拾ってしまうイメージに近い。

### 問1 [中]
- [ ] 未回答
**問い:** 今回のバグの主因は「`redirect()` を `try/catch` の中で呼んでいたこと」だった。
なぜ `try/catch` の中で `redirect()` を呼ぶと、確認ページへ遷移できず「エラーが起きた」ことに
なってしまうのか。`redirect()` がどういう仕組みで動くのかに触れて説明してください。

### 問2 [中]
- [ ] 未回答
**問い:** 生年月日の hidden 入力を、submit ボタンの `onClick` で DOM に直接書き込む方式から、
`useState` で管理する controlled な方式に変えた。なぜこの変更が「送信タイミングに依存しない」
という安全性につながるのか、自分の言葉で説明してください。

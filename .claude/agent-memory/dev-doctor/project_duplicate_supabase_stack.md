---
name: duplicate-supabase-stack
description: web/adminは単一Supabaseインスタンス(54421/54422)共有が正。54321を使う別スタック起動は誤り
metadata:
  type: project
---

このプロジェクトでは `apps/web` と `apps/admin` は **単一の Supabase インスタンスを共有する**設計（`.claude/rules/supabase.md`）。正しい構成は Kong=54421 / PostgreSQL=54422 の1スタックのみ。

**観測された問題パターン（2026-05-21 の診断時）:**
Docker上に `*_BeerSalon`（Kong=54421/DB=54422）と `*_BeerSalonAdmin`（Kong=**54321**/DB=54322）の2系統のSupabaseスタックが同時起動していた。後者は禁止ポート54321を占有しており、設計外。`apps/admin` 配下などで誤って `supabase start` を実行すると生成される疑い。

**Why:** web/adminが別DBを見ると `bars` 等の共有データが同期されず不整合になる。54321はCLAUDE.mdで明示的に禁止ポート。

**How to apply:** access系/DB系の診断では `docker ps --filter name=supabase_kong --format '{{.Names}} -> {{.Ports}}'` で Kong のポートマッピングを必ず確認する。54321にマップされたスタックや `*Admin` 系の重複スタックを見つけたら、アプリが使う 54421/54422 スタックには触れず、余剰スタックのみ停止を提案する。`.env.local` は54421で正、54321に書き換えないよう案内する。

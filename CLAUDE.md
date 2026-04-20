## 参照ルール

実装時は必ず @README.md @routing.md @wireframe.md @database.md を参照すること。

## 用語定義

- **本体画面** → BeerSalon（ユーザー向けアプリ）
- **管理画面** → BeerSalonAdmin（バーオーナー・管理者向けアプリ）

## コーディングルール

- コメントは Why not（なぜ別のやり方を採用しなかったか）のみ。What/How/Why 禁止
- デバッグコードは最終コードに残さない
- 作業終了前に `pnpm format` → `pnpm lint` を必ず実行
- 推測実装・「それっぽく動く」実装は禁止。仕様不明時はユーザーに確認
- 受入条件は必ず Playwright MCP で検証。未確認での作業完了は禁止

## 禁止事項（違反厳禁）

- `pnpm dev` / `pnpm run dev` / `npm run dev` の実行（ユーザーが起動済みのサーバーを利用すること）
- `run_in_background: true` の使用
- ポート54321の使用（正しいポート: 54421）
- BeerSalonAdminでの `supabase init` 実行

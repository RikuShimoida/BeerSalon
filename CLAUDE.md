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

## モノレポ構成

```
/
├── apps/
│   ├── web/          # BeerSalon（ユーザー画面）- ポート3000
│   └── admin/        # BeerSalonAdmin（管理画面）- ポート3001
├── packages/
│   └── shared/       # 共通型定義・ユーティリティ（将来拡張用）
├── prisma/           # Prismaスキーマ・マイグレーション（一元管理）
├── supabase/         # Supabase設定・マイグレーション（一元管理）
└── 設計ドキュメント   # CLAUDE.md, README.md, database.md, routing.md, wireframe.md
```

## 禁止事項（違反厳禁）

- `run_in_background: true` の使用
- ポート54321の使用（正しいポート: 54421）
- `supabase init` の実行（既存のsupabase/設定を使用すること）

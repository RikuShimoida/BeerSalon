---
name: ask
description: BeerSalonプロジェクトの仕様・設計・ドメインに関する質問にbeersalon-domain-expertが回答する。
when_to_use: 「/ask 〇〇」「仕様を確認して」「これってどうなってる？」などプロジェクトの仕様・設計に関する質問時
agent: beersalon-domain-expert
---

## BeerSalon ドメイン質問

引数: `$ARGUMENTS`（質問内容）

### 回答ルール

1. 設計ドキュメント（README.md, routing.md, wireframe.md, wireframe-admin.md, database.md）を参照して回答する
2. 必要に応じて Prisma スキーマや実装コードも参照する
3. 推測で回答せず、根拠となるファイルと該当箇所を明示する
4. 設計ドキュメントとコードに矛盾がある場合はその旨を指摘する
5. 仕様で未定義の部分は「未定義」と明示する
6. 日本語で回答する

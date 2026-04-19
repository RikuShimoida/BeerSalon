---
name: pencil
description: Pencil MCP運用ルール。デザイン生成時の.penファイル操作とファイル命名規則。
user_invocable: true
auto_trigger:
  - デザイン生成時
  - 「Pencil」「デザイン」「ワイヤーフレーム作成」などの発言時
---

## Pencil 運用ルール

### デザイン生成時のルール
- .pen ファイルは直接編集しない。必ず Pencil MCP ツール経由で操作する
- デザインシステムは shadcn/ui を基本とする
- カラーは CSS 変数（--primary, --secondary 等）で定義済みのものを使用
- 1 回の指示で完璧を求めず、「大枠→詳細」の順で調整する

### ファイル命名規則
- `designs/[画面名].pen` の形式で保存
- 画面名は英語小文字、ハイフン区切り（例: user-settings.pen）

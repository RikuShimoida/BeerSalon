# Handoff: Beer Salon ロゴ刷新（Dark Taproom）

Issue #480 の成果物バンドル。ユーザー画面（`apps/web`）共通ヘッダー左上のサービスロゴを、Dark Taproom デザインと一体感のあるロゴへ刷新するための **デザイン案 + ハンドオフデータ** をまとめる。

> **スコープ**: 本バンドルは「案出し + Claude Code へのハンドオフ」まで。**実際のコード反映（`header.tsx` の差し替え・favicon 生成・不要ロゴ削除）は別 Issue で対応する。**

## 背景（なぜ刷新するか）

現行 `apps/web/public/beer-salon-logo.svg` は Dark Taproom 導入前のもので、以下が不整合:

| 要素 | 現行ロゴ | Dark Taproom トークン |
|------|---------|----------------------|
| グラス | `#FFD700`（原色イエロー）+ `#8B4513`（茶） | プライマリ `#e0a341`〜`#c47f28`（アンバーゴールド） |
| テキスト | `#2C1810`（濃茶・ダーク背景で沈む） | 見出し `#f5e9d4` |
| 書体 | `Arial` | "Beer"=Zen Old Mincho / "Salon"=Archivo |

## Claude Design プロジェクト

4案を横並びキャンバスで比較できるデザインリファレンス:

- **URL**: https://claude.ai/design/p/c37c4840-d9a6-4131-a8f7-0637b733f7f3?file=Beer+Salon+Logo.dc.html

各フレームは「カード面（`#1e160d`）」と「実ヘッダー帯（`rgba(21,16,10,.9)`）」の両方でロゴの見え方を確認できる。

## Design Tokens（Dark Taproom 準拠）

正は `design_handoff_user_screens/README.md`。ロゴで使う値:

| 用途 | Hex |
|------|-----|
| プライマリ（アンバーゴールド） | `#e0a341` |
| プライマリ濃（グラデ終点） | `#c47f28` / `#a5691f` |
| プライマリ上のテキスト（濃茶） | `#20160a` |
| 見出しテキスト | `#f5e9d4` |
| サブテキスト | `#c9b48c` / `#9c8763` |
| ヘッダー帯背景 | `rgba(21,16,10,.9)` |
| カード面 | `#1e160d` |

グラデ: `linear-gradient(135deg, #e0a341, #c47f28)` / `(160deg, #e0a341, #a5691f)`。

**書体**: "Beer" = Zen Old Mincho（900）、"Salon" = Archivo（800）。オーバーライン（"SHIZUOKA CRAFT BEER"）= Archivo（600, `letter-spacing` 広め, `uppercase`）。Archivo は和文グリフを持たないためラテン文字要素に限定して適用する（`design_handoff_user_screens/README.md` の運用ルール準拠）。

## ロゴ案（SVG ファイル）

| ファイル | 案 | 方向性 | viewBox |
|---------|----|--------|---------|
| `logo-a-icon-wordmark.svg` | **A** | アイコンタイル + ワードマーク。アンバーグラデの角丸タイルに泡付きグラス。最も汎用的でファビコン単体にも切り出せる。 | `0 0 240 52` |
| `logo-b-monogram.svg` | **B** | モノグラム "B" バッジ。円形バッジに B を中配し、下に細い罫線 + "SALON"。コンパクトでアバター/スタンプ展開に強い。 | `0 0 240 52` |
| `logo-c-emblem.svg` | **C** | エンブレム（アーチ + ホップ）。円形エンブレムにアーチ状英字とホップの幾何シンボル。クラフト感・専門店感が最も強い。 | `0 0 150 72` |
| `logo-d-minimal.svg` | **D** | ミニマル罫線 + ドロップ。細いアンバー罫線とビールの雫でワードマークを引き締める。最も軽快でヘッダー横幅に馴染む。 | `0 0 240 52` |

### 実装時の注意

- **シンボルは幾何プリミティブ（円・矩形・線・多角形）の組み合わせ**で構成しており、手描きイラストではない。スケーラブルで軽量。
- **フォント依存**: SVG 内の `font-family` は `'Zen Old Mincho'` / `'Archivo'` を指定。ホストに Web フォントが読み込まれていれば反映され、無ければ `serif` / `sans-serif` にフォールバックする（`<img>` 埋め込みでも Google Fonts があれば反映されることを確認済み）。実装で確実に指定書体を出したい場合は、テキストをアウトライン化するか、ロゴを表示する箇所で `next/font` の Web フォントが効いていることを前提にする。
- 現行ヘッダー実装は `width=240 / height=48`（`viewBox 0 0 240 48`）で `apps/web/src/components/layout/header.tsx` の1箇所のみが `/beer-salon-logo.svg` を参照。新案は同等のアスペクト比を基準にしている（本バンドルは 52/72 高さだが、実装時にヘッダー高さへ合わせて調整する）。
- **クリックで `/` に遷移**する共通ヘッダー左のロゴ用途。`role="img"` + `aria-label="Beer Salon"` を各 SVG に付与済み。

## 受入条件との対応（Issue #480）

- [x] ロゴ案が複数（4案）作成されている → Claude Design キャンバス + 単体 SVG 4種
- [x] 各案が Dark Taproom と一体感のあるおしゃれな雰囲気 → 全案アンバー×ダーク基調・ブランド書体で統一
- [x] SVG 形式で単なるテキストのみで終わっていない → 各案にグラス/モノグラム/エンブレム/雫のシンボルを付与
- [x] Claude Code にハンドオフできるバンドルが作成されている → 本ディレクトリ（SVG + 本 README + Design URL）

---
name: understand
description: 実装完了後にユーザーの理解を確認する対話スキル。Claudeが何をやったのか・なぜそうしたのかを、ユーザー自身の言葉で説明させることで理解を定着させる。Spring Boot（Java）との対比で技術概念を翻訳する機能も持つ。/implement の完了報告後に自動発動する。
when_to_use: /implement の Phase 2 完了報告の直後に自動発動する。手動で「/understand」と呼んだ場合も発動する。
---

## Phase 0: Spring Boot 翻訳（理解チェックの前に必ず実行）

今回の実装で使われた Next.js / React の技術概念を、Spring Boot（Java）の対応概念に翻訳して説明する。
ユーザーは Spring Boot / Java の開発経験があり、Next.js / React は学習中である。

### 対応表

| Next.js / React | Spring Boot / Java |
|---|---|
| Server Actions | `@Controller` の `@PostMapping` / `@GetMapping` メソッド |
| Server Components (RSC) | Thymeleaf テンプレート + Controller（サーバーサイドレンダリング） |
| Client Components (`"use client"`) | REST API を呼ぶフロントエンド JS（Thymeleaf + fetch/axios） |
| App Router (`app/` ディレクトリ) | `@RequestMapping` によるルーティング定義 |
| `layout.tsx` | 共通テンプレートレイアウト / Spring Security の `FilterChain` |
| `middleware.ts` | Spring Security の `Filter` / `HandlerInterceptor` |
| `page.tsx` | Controller メソッド + 対応する Thymeleaf テンプレート |
| `loading.tsx` | ※ Spring MVC に直接対応なし（フロントエンド固有のローディング表示） |
| `error.tsx` | `@ControllerAdvice` + `@ExceptionHandler` |
| Prisma ORM | Spring Data JPA / Hibernate |
| Prisma schema (`schema.prisma`) | `@Entity` アノテーション付き Java クラス |
| Prisma の `findMany`, `create` 等 | JPA Repository の `findAll()`, `save()` 等 |
| Zod バリデーション | Jakarta Bean Validation (`@Valid`, `@NotNull`, `@Size` 等) |
| React Hook Form | Spring MVC のフォームバインディング (`@ModelAttribute`) |
| Supabase Auth | Spring Security + JWT / OAuth2 |
| API Route (`route.ts`) | `@RestController` のエンドポイント |
| `useEffect` | ※ フロントエンド固有。Spring に対応なし |
| `useState` | ※ フロントエンド固有。Spring に対応なし |
| Tailwind CSS | ※ CSS フレームワーク。Java 側に対応なし |
| `revalidatePath` / `revalidateTag` | Spring Cache の `@CacheEvict` |
| `redirect()` | `return "redirect:/path"` |
| `cookies()` / `headers()` | `HttpServletRequest` から取得 |
| 環境変数 (`process.env`) | `application.properties` / `@Value` |

### 出力フォーマット

```
---
## Spring Boot 翻訳

今回の実装を Spring Boot で例えると:

**変更内容の要約**
{1-2文で今回やったことを要約}

**ファイルごとの対応**
- `{変更したファイル}` → Spring Boot では `{対応するクラス/ファイル}` に相当
  - {具体的な説明}

**使われた技術概念**
- {Next.js の概念}: Spring Boot でいう {対応概念}。{補足説明}

**Spring Boot 開発者として注意すべき違い**
- {考え方が根本的に異なる部分があれば記載。なければ省略}
---
```

### ルール

- 今回の実装で実際に使われた概念だけを翻訳する（対応表を全部出さない）
- 対応がない概念（`useState` 等）は「Spring Boot に対応なし。フロントエンド固有の仕組みで〜」と正直に伝える
- 翻訳は簡潔に。1概念につき1-2文で説明する
- ユーザーが追加で「これは Spring Boot でいうと何？」と聞いてきたら、対応表を参考に回答する

---

## Phase 1: 実装理解チェック

実装完了後、ユーザーが「何が変わったのか」「なぜそうしたのか」を自分の言葉で説明できるか確認する対話を行う。

### Phase 1 の質問生成ルール

今回の実装内容を振り返り、以下の両面から質問を作る:

- **意図（なぜ）**: なぜこの実装方針を選んだのか、なぜこの設計にしたのか
- **仕組み（どう動くか）**: 技術的にどう動作するのか、データの流れはどうなっているか

#### 質問数の決定

変更の規模に応じて質問数を決める:

- **小さい修正**（1〜2ファイル、バグ修正、スタイル調整など）: 1問
- **中規模の変更**（新しいコンポーネント追加、API追加など）: 2問
- **大きい機能追加**（複数ページ、DB変更、認証周りなど）: 3問

各質問は、今回の実装で最も重要なポイントから順に出題する。

### 対話の進め方

#### ステップ1: 質問を出す（ヒントなし）

質問をユーザーに投げかける。最初はヒントを一切出さない。

**出力フォーマット:**

```
---
## 実装理解チェック（1/N問目）

【質問】
{質問文}

あなたの言葉で説明してください。
---
```

#### ステップ2: 回答を判定する

ユーザーの回答を受け取ったら、核心を突いているかどうかを判定する。

- 技術用語の正確さは求めない
- 言い回しが多少違っていてもOK
- 核心部分（なぜそうしたか、どう動くか）を自分の言葉で説明できていれば正解

#### ステップ3-A: 正解の場合

```
正解です！

{ユーザーの理解を補強する一言（30文字以内）}
```

次の質問があればステップ1に戻る。全問正解なら対話を終了する。

#### ステップ3-B: 不正解の場合（1回目）

ヒントは出さず、どの部分が惜しいかだけ伝える。

```
惜しいです。{どの観点が足りないか}の部分をもう少し考えてみてください。
```

#### ステップ3-C: 不正解の場合（2回目）

具体的なヒントを1つ出す。

```
ヒント: {実装内容に関連する具体的な手がかり}
```

#### ステップ3-D: 不正解の場合（3回目）

正解を伝えて次の質問へ進む。

```
正解はこうです:

{正解の説明}

次の質問に進みます。
```

### 全問終了時

すべての質問が終わったら、以下を出力して対話を終了する。

```
---
## 理解チェック完了

{正解数}/{全問数} 問正解でした。
---
```

### 注意事項

- 質問はコードの細部（変数名、行番号など）を問うものではなく、設計意図や動作の流れを問うこと
- ユーザーが「スキップ」「わからない」と言った場合は正解を教えて次に進む
- 対話中にユーザーが追加の質問をしてきた場合は、それに答えてから理解チェックに戻る

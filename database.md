# Beer Salon - Database Design

## 方針

- DB: PostgreSQL（Supabase 上で運用）
- 認証: Supabase Auth（`auth.users`）を利用
- アプリ側のユーザ情報は `user_profiles` に保持する
- テーブル名・カラム名は `snake_case`
- 主キーは基本 `bigserial`（Supabase/Prisma で扱いやすいようにする）
- 画像は Supabase Storage に保存し、DB には `image_url` / `storage_path` などの文字列のみ保持する
- タイムスタンプは `created_at`, `updated_at`（`timestamptz`）

---

## 1. 認証・ユーザ

### 1-1. user_profiles

Supabase Auth の `auth.users` にぶら下がるアプリ側のユーザプロフィール。

- **Table name:** `user_profiles`
- **Description:** Beer Salon のユーザー基本情報を保持

#### Columns

| Column          | Type        | Constraints                           | Description                    |
|-----------------|------------|----------------------------------------|--------------------------------|
| id              | uuid       | PK, default gen_random_uuid()         | アプリ内でのユーザID（将来拡張用） |
| user_auth_id         | uuid       | NOT NULL, UNIQUE, FK → auth.users(id) | Supabase Auth のユーザID       |
| last_name       | text       | NOT NULL                               | 姓                            |
| first_name      | text       | NOT NULL                               | 名                            |
| nickname        | text       | NOT NULL                               | ニックネーム                   |
| birthday        | date       | NOT NULL                               | 生年月日                       |
| gender          | text       | NOT NULL                               | 性別（'male' / 'female' / ... 想定） |
| prefecture      | text       | NOT NULL                               | 都道府県（文字列で持つ）       |
| is_active       | boolean    | NOT NULL DEFAULT true                  | 退会フラグなどに利用           |
| created_at      | timestamptz| NOT NULL DEFAULT now()                 | 作成日時                       |
| updated_at      | timestamptz| NOT NULL DEFAULT now()                 | 更新日時                       |

---

## 2. 店舗・メニュー関連

### 2-1. bars

ビアバーの基本情報。

- **Table name:** `bars`
- **Description:** ビアバー / クラフトビール提供店舗

#### Columns

| Column          | Type        | Constraints                     | Description                             |
|-----------------|------------|----------------------------------|-----------------------------------------|
| id              | bigserial  | PK                               | 店舗ID                                  |
| name            | text       | NOT NULL                         | 店舗名                                  |
| prefecture      | text       | NOT NULL                         | 都道府県                                |
| city            | text       | NOT NULL                         | 市区町村                                |
| address_line1   | text       | NOT NULL                         | 住所1                                   |
| address_line2   | text       | NULLABLE                         | 建物名・部屋番号など                    |
| latitude        | numeric(10,7) | NULLABLE                      | 緯度（Google Maps 表示用）             |
| longitude       | numeric(10,7) | NULLABLE                      | 経度                                    |
| phone_number    | text       | NULLABLE                         | 電話番号（タップで発信）               |
| opening_time   | time       | NULLABLE                          | 17:00                               |
| ending_time   | time       | NULLABLE                           | 24:00                               |
| regular_holiday | text       | NULLABLE                         | 不定休など曜日で表せない休業の補足テキスト。管理画面の営業時間ブロックで入力（POST/PUT で `bars.regular_holiday` に保存）。ユーザー画面の店舗詳細「基本情報」タブで曜日別営業時間と併記表示する |
| access          | text       | NULLABLE                         | 交通手段・最寄駅など                    |
| website_url     | text       | NULLABLE                         | 店舗公式サイト URL                      |
| instagram_url   | text       | NULLABLE                         | Instagram URL                           |
| x_url           | text       | NULLABLE                         | X (Twitter) URL                         |
| facebook_url    | text       | NULLABLE                         | Facebook URL                            |
| line_url        | text       | NULLABLE                         | LINE URL                                |
| description     | text       | NULLABLE                         | PR文                                    |
| preview_image_url | text     | NULLABLE                         | 一覧表示用プレビュー画像URL             |
| is_active       | boolean    | NOT NULL DEFAULT true            | 掲載中フラグ                            |
| created_at      | timestamptz| NOT NULL DEFAULT now()           | 作成日時                                |
| updated_at      | timestamptz| NOT NULL DEFAULT now()           | 更新日時                                |

---

### 2-2. bar_images

店舗の写真・動画（外観・店内・ビール・料理）。

- **Table name:** `bar_images`
- **Description:** 店舗ごとの画像・動画（外観/店内/ビール/料理など）

#### Columns

| Column       | Type        | Constraints                         | Description                                  |
|--------------|------------|--------------------------------------|----------------------------------------------|
| id           | bigserial  | PK                                   | 画像ID                                       |
| bar_id       | bigint     | NOT NULL, FK → bars(id)             | 紐づく店舗                                   |
| media_type   | text       | NOT NULL DEFAULT 'image'             | 'image' / 'video'（画像または動画）          |
| image_type   | text       | NOT NULL                             | 'exterior' / 'interior' / 'beer' / 'food' など |
| image_url    | text       | NOT NULL                             | 画像・動画URL（Supabase Storage へのパス等） |
| sort_order   | integer    | NOT NULL DEFAULT 0                   | 表示順                                       |
| created_at   | timestamptz| NOT NULL DEFAULT now()               | 作成日時                                     |

---

### 2-2-2. bar_opening_hours

店舗の曜日別・複数時間帯の営業時間。

- **Table name:** `bar_opening_hours`
- **Description:** 店舗の曜日別営業時間（複数時間帯対応）

#### Columns

| Column      | Type        | Constraints                     | Description                             |
|-------------|------------|----------------------------------|-----------------------------------------|
| id          | bigserial  | PK                               | ID                                      |
| bar_id      | bigint     | NOT NULL, FK → bars(id)         | 店舗ID                                  |
| day_of_week | integer    | NOT NULL CHECK (0-6)             | 曜日（0=月, 1=火, ..., 6=日）           |
| open_time   | time       | NOT NULL                         | 開始時刻                                |
| close_time  | time       | NOT NULL                         | 終了時刻                                |
| sort_order  | integer    | NOT NULL DEFAULT 0               | 表示順                                  |
| is_closed   | boolean    | NOT NULL DEFAULT false           | 定休日フラグ                            |
| created_at  | timestamptz| NOT NULL DEFAULT now()           | 作成日時                                |
| updated_at  | timestamptz| NOT NULL DEFAULT now()           | 更新日時                                |

**インデックス**: `bar_id + day_of_week`

**CASCADE削除**: 店舗削除時に関連する営業時間レコードも削除

**書き込み（管理画面）**: 店舗登録（POST）・店舗更新（PUT）の営業時間は「当該 `bar_id` を全削除→整形済みレコードを再登録」で同期する。PostgREST（`supabaseAdmin`）は複数文を1トランザクションにまとめられないため、DELETE 成功後に INSERT が失敗すると営業時間が全消失したまま復元されない。これを防ぐため、DELETE+INSERT を単一トランザクション化する RPC `sync_bar_opening_hours(p_bar_id bigint, p_opening_hours jsonb)` に書き込みを一本化している（`open_time`/`close_time` への `:00` 付与・`is_closed` 反映などの整形は API 側で行い、整形済み jsonb 配列を RPC に渡す）。

**使用例**:
- 複数時間帯: 昼営業（11:00-14:00）+ 夜営業（17:00-23:00）を2レコードで表現
- 定休日: `is_closed=true` のレコードで表現
- 24時間営業: `open_time=00:00, close_time=23:59` で表現
- 翌日にまたがる営業: `open_time=17:00, close_time=02:00` など

---

### 2-3. beer_categories

ビールのカテゴリ（IPA / ピルスナー など）。

- **Table name:** `beer_categories`
- **Description:** ビール種別マスタ

#### Columns

| Column      | Type        | Constraints              | Description          |
|-------------|------------|--------------------------|----------------------|
| id          | bigserial  | PK                       | カテゴリID           |
| name        | text       | NOT NULL, UNIQUE         | カテゴリ名（IPA 等） |
| is_active   | boolean    | NOT NULL DEFAULT true    | 使用中フラグ         |
| created_at  | timestamptz| NOT NULL DEFAULT now()   | 作成日時             |
| updated_at  | timestamptz| NOT NULL DEFAULT now()   | 更新日時             |

---

### 2-4. countries

国マスタ。

- **Table name:** `countries`
- **Description:** 国マスタ

#### Columns

| Column      | Type        | Constraints            | Description          |
|-------------|------------|------------------------|----------------------|
| id          | bigserial  | PK                     | 国ID                 |
| name        | text       | NOT NULL, UNIQUE       | 国名                 |
| is_active   | boolean    | NOT NULL DEFAULT true  | 使用中フラグ         |
| created_at  | timestamptz| NOT NULL DEFAULT now() | 作成日時             |
| updated_at  | timestamptz| NOT NULL DEFAULT now() | 更新日時             |

---

### 2-5. regions

地域マスタ（ビールの産地、ブルワリーの所在地）。

- **Table name:** `regions`
- **Description:** 地域マスタ（ビールの産地＝ブルワリーの所在地）

#### Columns

| Column      | Type        | Constraints            | Description          |
|-------------|------------|------------------------|----------------------|
| id          | bigserial  | PK                     | 地域ID               |
| name        | text       | NOT NULL               | 地域名               |
| country_id  | bigint     | NOT NULL, FK → countries(id) | 国ID           |
| is_active   | boolean    | NOT NULL DEFAULT true  | 使用中フラグ         |
| created_at  | timestamptz| NOT NULL DEFAULT now() | 作成日時             |
| updated_at  | timestamptz| NOT NULL DEFAULT now() | 更新日時             |

UNIQUE制約: `country_id + name`

---

### 2-6. breweries

醸造所情報。

- **Table name:** `breweries`
- **Description:** ビールの醸造所マスタ

#### Columns

| Column      | Type        | Constraints            | Description          |
|-------------|------------|------------------------|----------------------|
| id          | bigserial  | PK                     | 醸造所ID             |
| name        | text       | NOT NULL, UNIQUE       | 醸造所名             |
| country_id  | bigint     | NOT NULL, FK → countries(id) | 国ID           |
| region_id   | bigint     | NULLABLE, FK → regions(id) | 地域ID           |
| website_url | text       | NULLABLE               | Webサイト            |
| is_active   | boolean    | NOT NULL DEFAULT true  | 使用中フラグ         |
| created_at  | timestamptz| NOT NULL DEFAULT now() | 作成日時             |
| updated_at  | timestamptz| NOT NULL DEFAULT now() | 更新日時             |

**管理画面での変更**: 国IDを必須化し、管理画面でのフィルタリングを容易にする。

---

### 2-7. beers

ビール単体の情報（ブランド）。

- **Table name:** `beers`
- **Description:** ビール銘柄マスタ

#### Columns

| Column           | Type        | Constraints                       | Description                 |
|------------------|------------|------------------------------------|-----------------------------|
| id               | bigserial  | PK                                 | ビールID                    |
| name             | text       | NOT NULL                           | ビール名                    |
| beer_category_id | bigint     | NOT NULL, FK → beer_categories(id) | カテゴリ                     |
| brewery_id       | bigint     | NULLABLE, FK → breweries(id)       | 醸造所                       |
| region_id        | bigint     | NULLABLE, FK → regions(id)         | 地域ID（産地）              |
| abv              | numeric(4,2)| NULLABLE                          | アルコール度数              |
| ibu              | integer    | NULLABLE                           | IBU                         |
| description      | text       | NULLABLE                           | 説明文                      |
| image_url        | text       | NULLABLE                           | サムネイル画像              |
| is_active        | boolean    | NOT NULL DEFAULT true              | 使用中フラグ                |
| created_at       | timestamptz| NOT NULL DEFAULT now()             | 作成日時                    |
| updated_at       | timestamptz| NOT NULL DEFAULT now()             | 更新日時                    |

---

### 2-8. bar_beer_menus

店舗ごとのビールメニュー。

- **Table name:** `bar_beer_menus`
- **Description:** 店舗で提供しているビールのメニュー

#### Columns

| Column       | Type        | Constraints                     | Description                         |
|--------------|------------|----------------------------------|-------------------------------------|
| id           | bigserial  | PK                               | メニューID                          |
| bar_id       | bigint     | NOT NULL, FK → bars(id)         | 店舗ID                              |
| beer_id      | bigint     | NOT NULL, FK → beers(id)        | ビールID                            |
| description  | text       | NULLABLE                         | メニュー用説明                      |
| image_url    | text       | NULLABLE                         | 写真                                |
| is_active    | boolean    | NOT NULL DEFAULT true            | 提供中フラグ                        |
| created_at   | timestamptz| NOT NULL DEFAULT now()           | 作成日時                            |
| updated_at   | timestamptz| NOT NULL DEFAULT now()           | 更新日時                            |

**変更履歴**: `size` カラムと `price` カラムを削除。サイズ/価格は `bar_beer_menu_sizes` テーブルに移行（1メニューに複数サイズ/価格を設定可能に）。

---

### 2-8-2. bar_beer_menu_sizes

ビールメニューのサイズ・価格バリエーション。

- **Table name:** `bar_beer_menu_sizes`
- **Description:** ビールメニューごとのサイズ/価格（1メニューに複数設定可能）

#### Columns

| Column            | Type        | Constraints                              | Description                 |
|-------------------|------------|-------------------------------------------|-----------------------------|
| id                | bigserial  | PK                                        | ID                          |
| bar_beer_menu_id  | bigint     | NOT NULL, FK → bar_beer_menus(id)         | ビールメニューID            |
| size_name         | text       | NOT NULL                                  | サイズ名（例: "パイント", "ハーフ", "Sサイズ"）|
| price             | integer    | NULLABLE                                  | 価格（オプション）          |
| sort_order        | integer    | NOT NULL DEFAULT 0                        | 表示順                      |
| created_at        | timestamptz| NOT NULL DEFAULT now()                    | 作成日時                    |
| updated_at        | timestamptz| NOT NULL DEFAULT now()                    | 更新日時                    |

**CASCADE削除**: ビールメニュー削除時に関連するサイズ/価格レコードも削除

---

### 2-9. bar_food_menus

店舗ごとのフードメニュー。

- **Table name:** `bar_food_menus`
- **Description:** 店舗の料理メニュー

#### Columns

| Column       | Type        | Constraints                     | Description            |
|--------------|------------|----------------------------------|------------------------|
| id           | bigserial  | PK                               | メニューID             |
| bar_id       | bigint     | NOT NULL, FK → bars(id)         | 店舗ID                 |
| name         | text       | NOT NULL                         | 料理名                 |
| price        | integer    | NULLABLE                         | 価格                    |
| description  | text       | NULLABLE                         | 説明文                 |
| image_url    | text       | NULLABLE                         | 画像URL                |
| is_active    | boolean    | NOT NULL DEFAULT true            | 提供中フラグ           |
| created_at   | timestamptz| NOT NULL DEFAULT now()           | 作成日時               |
| updated_at   | timestamptz| NOT NULL DEFAULT now()           | 更新日時               |

---

## 3. クーポン・記事

### 3-1. bar_coupons

店舗が発行するクーポン。

- **Table name:** `bar_coupons`
- **Description:** 店舗ごとのクーポン定義

#### Columns

| Column          | Type           | Constraints                  | Description             |
|-----------------|----------------|------------------------------|-------------------------|
| id              | bigserial      | PK                           | クーポンID              |
| bar_id          | bigint         | NOT NULL, FK → bars(id)      | 店舗ID                  |
| title           | text           | NOT NULL                     | 見出し                  |
| description     | text           | NULLABLE                     | 内容文                  |
| discount_type   | text           | NOT NULL                     | 割引タイプ（'percentage', 'fixed_amount'） |
| discount_value  | numeric(10,2)  | NOT NULL                     | 割引値（%または金額）   |
| code            | text           | NULLABLE                     | クーポンコード（任意）  |
| usage_limit     | integer        | NULLABLE                     | 利用回数上限（NULLで無制限） |
| used_count      | integer        | NOT NULL DEFAULT 0           | 利用回数                |
| valid_from      | timestamptz    | NULLABLE                     | 有効期間開始            |
| valid_until     | timestamptz    | NULLABLE                     | 有効期間終了            |
| is_active       | boolean        | NOT NULL DEFAULT true        | 掲載中フラグ            |
| created_at      | timestamptz    | NOT NULL DEFAULT now()       | 作成日時                |
| updated_at      | timestamptz    | NOT NULL DEFAULT now()       | 更新日時                |

**インデックス**:
- `bar_id`, `is_active`

---

### 3-2. user_coupons

ユーザーが取得したクーポン。

- **Table name:** `user_coupons`
- **Description:** ユーザーごとの取得済クーポン

#### Columns

| Column        | Type        | Constraints                       | Description          |
|---------------|------------|------------------------------------|----------------------|
| id            | bigserial  | PK                                 | ID                   |
| user_id       | uuid       | NOT NULL, FK → user_profiles(user_id) | ユーザーID       |
| coupon_id     | bigint     | NOT NULL, FK → bar_coupons(id)     | クーポンID          |
| obtained_at   | timestamptz| NOT NULL DEFAULT now()             | 取得日時            |
| used_at       | timestamptz| NULLABLE                           | 使用日時            |
| is_used       | boolean    | NOT NULL DEFAULT false             | 使用済みフラグ      |

**UNIQUE制約**: `(user_id, coupon_id)`（1ユーザー1クーポンにつき1レコード）

**二重取得の防止**: `(user_id, coupon_id)` に DB の UNIQUE 制約を張り、二重取得を DB レベルで担保する。ユーザー画面のクーポン取得アクション（`apps/web` の `obtainCoupon`）は、事前の存在チェック（UX フィードバック用）で取得済みを返しつつ、並行リクエスト（取得ボタン連打）による TOCTOU（存在チェックをすり抜けた並行 INSERT）は UNIQUE 制約違反（Prisma の `P2002`）を「既に取得済み」として catch することで、最終的に1レコードへ収束させる。

**取得可否の判定（`obtainCoupon`）**: `bar_coupons.is_active=true` かつ有効期間内（`valid_from` が未来でなく `valid_until` が過去でない。いずれも NULL なら該当方向の制限なし）、かつ `usage_limit` が非 NULL の場合は `used_count < usage_limit` のときのみ取得できる。`used_count` は「利用回数」であり、取得（`user_coupons` への INSERT）ではインクリメントしない。

**利用（消し込み）の判定と書き込み（`redeemCoupon`）**: マイページ「持っているクーポン」タブ（`/mypage`）から本人が「クーポンを利用する」を押すと、取得済み `user_coupons` レコードを利用（消し込み）する。利用は `user_coupons.is_used=true` / `used_at=now()` への更新と `bar_coupons.used_count` の +1 インクリメントを同時に行う。取得ボタン連打などの並行リクエストで `used_count` が破綻しないよう、営業時間・支払い方法の同期と同じく DELETE/UPDATE の原子化を RPC に一本化する（RPC `use_user_coupon(p_user_coupon_id bigint, p_user_id uuid)`）。RPC は対象 `user_coupons` を `FOR UPDATE` でロックしてから検証・更新し、判別可能な文字列コード（`ok` / `already_used` / `expired` / `limit_reached` / `not_found`）を返す。利用可否は「本人の未利用レコードであること」「`bar_coupons.is_active=true`」「有効期間内」「`usage_limit` が非 NULL の場合は `used_count < usage_limit`」で判定する。他人が取得したクーポンは `p_user_id` の一致で弾かれ `not_found` を返す。利用（使用済みにする）はここまでを対象とし、利用の取り消し（再有効化）フローは未対応。

---

### 3-3. articles

店舗からの投稿（ブログ/インタビュー記事）。

- **Table name:** `articles`
- **Description:** 店舗ごとの記事（「お店からの投稿」タブ）

#### Columns

| Column       | Type        | Constraints                    | Description     |
|--------------|------------|---------------------------------|-----------------|
| id           | bigserial  | PK                              | 記事ID          |
| bar_id       | bigint     | NOT NULL, FK → bars(id)         | 店舗ID          |
| title        | text       | NOT NULL                        | 記事タイトル    |
| body         | text       | NOT NULL                        | 記事本文        |
| image_url    | text       | NULLABLE                        | 画像1（サムネイル兼用）|
| image_url_2  | text       | NULLABLE                        | 画像2           |
| image_url_3  | text       | NULLABLE                        | 画像3           |
| status       | text       | NOT NULL DEFAULT 'draft'        | ステータス（'draft', 'published', 'scheduled'） |
| published_at | timestamptz| NULLABLE                        | 公開日時        |
| deleted_at   | timestamptz| NULLABLE                        | 削除日時（論理削除） |
| created_at   | timestamptz| NOT NULL DEFAULT now()          | 作成日時        |
| updated_at   | timestamptz| NOT NULL DEFAULT now()          | 更新日時        |

**管理画面での変更**:
- `is_published` を `status` に変更（draft/published/scheduledを管理）
- `deleted_at` を追加（論理削除により誤削除からの復旧が可能）

---

### 3-4. article_likes

記事への「いいね」。

- **Table name:** `article_likes`
- **Description:** 記事に対するいいね

#### Columns

| Column       | Type        | Constraints                         | Description       |
|--------------|------------|--------------------------------------|-------------------|
| id           | bigserial  | PK                                   | ID                |
| article_id   | bigint     | NOT NULL, FK → articles(id)          | 記事ID            |
| user_id      | uuid       | NOT NULL, FK → user_profiles(id)     | いいねしたユーザー |
| created_at   | timestamptz| NOT NULL DEFAULT now()               | いいね日時         |

`article_id + user_id` に UNIQUE 制約を張る想定。

---

## 4. 投稿・タイムライン・お気に入り

### 4-1. posts

ユーザーの店舗に対する投稿（写真＋本文）。

- **Table name:** `posts`
- **Description:** ユーザー投稿（タイムライン/店舗タブに表示）

#### Columns

| Column       | Type        | Constraints                         | Description                 |
|--------------|------------|--------------------------------------|-----------------------------|
| id           | bigserial  | PK                                   | 投稿ID                      |
| user_id      | uuid       | NOT NULL, FK → user_profiles(user_id)| 投稿者ユーザーID           |
| bar_id       | bigint     | NOT NULL, FK → bars(id)             | 紐づく店舗ID                |
| body         | text       | NOT NULL                             | 投稿本文                    |
| like_count   | integer    | NOT NULL DEFAULT 0                   | いいね数（集計用）          |
| created_at   | timestamptz| NOT NULL DEFAULT now()               | 作成日時                    |
| updated_at   | timestamptz| NOT NULL DEFAULT now()               | 更新日時                    |

---

### 4-2. post_images

投稿に紐づく写真（最大4枚想定）。

- **Table name:** `post_images`
- **Description:** ユーザー投稿の画像

#### Columns

| Column       | Type        | Constraints                   | Description           |
|--------------|------------|--------------------------------|-----------------------|
| id           | bigserial  | PK                             | 画像ID                |
| post_id      | bigint     | NOT NULL, FK → posts(id)       | 投稿ID                |
| image_url    | text       | NOT NULL                       | 画像URL               |
| sort_order   | integer    | NOT NULL DEFAULT 0             | 表示順                |
| created_at   | timestamptz| NOT NULL DEFAULT now()         | 作成日時              |

---

### 4-3. post_likes

投稿への「いいね」。

- **Table name:** `post_likes`
- **Description:** 投稿に対するいいね

#### Columns

| Column       | Type        | Constraints                         | Description       |
|--------------|------------|--------------------------------------|-------------------|
| id           | bigserial  | PK                                   | ID                |
| post_id      | bigint     | NOT NULL, FK → posts(id)             | 投稿ID            |
| user_id      | uuid       | NOT NULL, FK → user_profiles(user_id)| いいねしたユーザー |
| created_at   | timestamptz| NOT NULL DEFAULT now()               | いいね日時         |

`post_id + user_id` に UNIQUE 制約を張る想定。

---

### 4-4. user_follow_relations

フォロー / フォロワー関係。

- **Table name:** `user_follow_relations`
- **Description:** ユーザー間のフォロー関係

#### Columns

| Column        | Type        | Constraints                         | Description                     |
|---------------|------------|--------------------------------------|---------------------------------|
| id            | bigserial  | PK                                   | ID                              |
| follower_id   | uuid       | NOT NULL, FK → user_profiles(user_id)| フォローする側                  |
| followee_id   | uuid       | NOT NULL, FK → user_profiles(user_id)| フォローされる側                |
| created_at    | timestamptz| NOT NULL DEFAULT now()               | フォローした日時                |

`follower_id + followee_id` に UNIQUE 制約。

---

### 4-5. favorite_bars

ユーザーのお気に入りバー。

- **Table name:** `favorite_bars`
- **Description:** ユーザーのお気に入り店舗

#### Columns

| Column      | Type        | Constraints                         | Description   |
|-------------|------------|--------------------------------------|---------------|
| id          | bigserial  | PK                                   | ID            |
| user_id     | uuid       | NOT NULL, FK → user_profiles(user_id)| ユーザーID    |
| bar_id      | bigint     | NOT NULL, FK → bars(id)             | 店舗ID        |
| created_at  | timestamptz| NOT NULL DEFAULT now()               | 登録日時      |

---

## 5. 支払い方法

### 5-1. payment_methods

決済手段マスタ。

- **Table name:** `payment_methods`
- **Description:** 決済手段マスタ

#### Columns

| Column        | Type        | Constraints              | Description          |
|---------------|------------|--------------------------|----------------------|
| id            | bigserial  | PK                       | 決済手段ID           |
| name          | text       | NOT NULL, UNIQUE         | 決済手段名           |
| display_order | integer    | NOT NULL DEFAULT 0       | 表示順               |
| is_active     | boolean    | NOT NULL DEFAULT true    | 使用中フラグ         |
| created_at    | timestamptz| NOT NULL DEFAULT now()   | 作成日時             |
| updated_at    | timestamptz| NOT NULL DEFAULT now()   | 更新日時             |

**初期マスタデータ**:
1. 現金
2. クレジットカード
3. 電子マネー
4. QRコード決済

---

### 5-2. bar_payment_methods

店舗と決済手段の中間テーブル。

- **Table name:** `bar_payment_methods`
- **Description:** 店舗×決済手段の中間テーブル

#### Columns

| Column            | Type        | Constraints                            | Description       |
|-------------------|-------------|----------------------------------------|-------------------|
| id                | bigserial   | PK                                     | ID                |
| bar_id            | bigint      | NOT NULL, FK → bars(id)               | 店舗ID            |
| payment_method_id | bigint      | NOT NULL, FK → payment_methods(id)    | 決済手段ID        |
| created_at        | timestamptz | NOT NULL DEFAULT now()                 | 作成日時          |

**UNIQUE制約**: `bar_id + payment_method_id`

**CASCADE削除**: 店舗削除時に関連する `bar_payment_methods` も削除される

**書き込み（管理画面）**: 店舗編集（PUT）の支払い方法は「当該 `bar_id` を全削除→選択分を再登録」で同期する。営業時間と同様に PostgREST では DELETE+INSERT を1トランザクションにできないため、原子化した RPC `sync_bar_payment_methods(p_bar_id bigint, p_payment_method_ids bigint[])` に一本化している。INSERT 失敗時は DELETE ごとロールバックされ、既存の支払い方法が保持される。API 側で `payment_method_ids` の整数検証・重複除去を行い、RPC 内でも `DISTINCT` で UNIQUE 制約 `bar_id + payment_method_id` 違反を二重防御する。

---

## 6. 閲覧履歴・通知

### 6-1. view_histories

店舗の閲覧履歴（閲覧履歴ページ用）。

- **Table name:** `view_histories`
- **Description:** ユーザーによる店舗閲覧ログ

#### Columns

| Column      | Type        | Constraints                         | Description    |
|-------------|------------|--------------------------------------|----------------|
| id          | bigserial  | PK                                   | ID             |
| user_id     | uuid       | NOT NULL, FK → user_profiles(user_id)| ユーザーID     |
| bar_id      | bigint     | NOT NULL, FK → bars(id)             | 店舗ID         |
| viewed_at   | timestamptz| NOT NULL DEFAULT now()               | 閲覧日時       |

---

### 6-2. notifications

通知（いいね／フォロー／お気に入り店舗の新記事など）。

- **Table name:** `notifications`
- **Description:** ユーザーへの通知（通知一覧ページ用）

#### Columns

| Column        | Type        | Constraints                         | Description                               |
|---------------|------------|--------------------------------------|-------------------------------------------|
| id            | bigserial  | PK                                   | 通知ID                                    |
| user_id       | uuid       | NOT NULL, FK → user_profiles(user_id)| 通知対象ユーザー                          |
| type          | text       | NOT NULL                             | 'post_liked', 'new_article', 'followed'など |
| title         | text       | NOT NULL                             | 通知タイトル文                            |
| message       | text       | NOT NULL                             | 通知本文                                  |
| link_url      | text       | NULLABLE                             | 遷移先URL（投稿/店舗/記事など）           |
| is_read       | boolean    | NOT NULL DEFAULT false               | 既読フラグ                                 |
| created_at    | timestamptz| NOT NULL DEFAULT now()               | 作成日時                                   |

**生成される `type` と発火タイミング**:

| type          | 発火タイミング                                                                 | title      | message 例                                  | link_url 例           |
|---------------|--------------------------------------------------------------------------------|------------|---------------------------------------------|-----------------------|
| `post_liked`  | 自分の投稿に他ユーザーがいいねしたとき（`apps/web` の `togglePostLike`）。自分の投稿への自己いいねは除外 | いいね     | `${ニックネーム}さんがあなたの投稿にいいねしました` | `/timeline`           |
| `followed`    | 他ユーザーにフォローされたとき（`apps/web` の `followUser`）。自己フォローは除外。フォロー解除では生成しない | フォロー   | `${ニックネーム}さんにフォローされました`        | `/users/[userId]`（フォローした側のアプリ内ユーザーID `user_profiles.id`） |
| `new_article` | お気に入り登録した店舗が記事を公開したとき（`apps/admin` の記事 POST / PUT で status が published へ遷移した瞬間）。配信対象は `favorite_bars` 経由で解決。published のまま再保存した場合は二重通知防止のため生成しない。予約公開（scheduled→published）を実行するバッチは未実装のため、scheduled は通知対象外 | 新着記事   | `${店舗名}が新しい記事「${記事タイトル}」を公開しました` | `/articles/[articleId]` |

---

## 7. ログ関連（任意で実装）

### 7-1. login_histories

ログイン履歴（セキュリティ・分析用）。MVPでは必須ではないが、将来用に設計。

- **Table name:** `login_histories`
- **Description:** ユーザーのログイン履歴

#### Columns

| Column        | Type        | Constraints                         | Description               |
|---------------|------------|--------------------------------------|---------------------------|
| id            | bigserial  | PK                                   | ID                        |
| user_id       | uuid       | NOT NULL, FK → user_profiles(user_id)| ユーザーID                |
| logged_in_at  | timestamptz| NOT NULL DEFAULT now()               | ログイン日時              |
| login_status  | text       | NOT NULL                             | 'success' / 'failure' など|
| ip_address    | text       | NULLABLE                             | IPアドレス                |
| user_agent    | text       | NULLABLE                             | ブラウザ情報              |
| auth_provider | text       | NULLABLE                             | 'email', 'google', 'x' 等 |

---

## 8. 管理画面専用テーブル

BeerSalonAdmin（管理画面）専用のテーブル。ユーザー向けアプリでは使用しない。

### 8-1. admin_users

管理画面のログインユーザー（バーオーナー、システム管理者）。

**※重要**: `user_profiles`（ユーザー向けアプリのユーザー）とは完全に別のテーブル。

- **Table name:** `admin_users`
- **Description:** 管理画面のバーオーナー・システム管理者アカウント

#### Columns

| Column          | Type        | Constraints                     | Description                 |
|-----------------|------------|----------------------------------|-----------------------------|
| id              | uuid       | PK, default gen_random_uuid()   | 管理ユーザーID              |
| bar_manage_id   | text       | NOT NULL, UNIQUE                | 店舗管理ID（スラッグ形式のログインID。例: `fuji-beer-bar`）|
| password_hash   | text       | NOT NULL                         | パスワードハッシュ          |
| name            | text       | NOT NULL                         | 氏名                        |
| role            | text       | NOT NULL DEFAULT 'bar_owner'    | 権限（`bar_owner`, `admin`）|
| bar_id          | bigint     | NULLABLE, FK → bars(id)         | 紐づく店舗ID（bar_ownerは必須、adminはNULL）|
| contact_email   | text       | NULLABLE                         | 店舗管理者メールアドレス（請求書送付用）|
| contact_phone   | text       | NULLABLE                         | 店舗管理者電話番号（トラブル時連絡用）|
| approval_status | text       | NOT NULL DEFAULT 'approved' CHECK (in 'pending'/'approved'/'rejected') | セルフサーブ登録の承認状態 |
| is_active       | boolean    | NOT NULL DEFAULT true            | アカウント有効フラグ        |
| created_at      | timestamptz| NOT NULL DEFAULT now()           | 作成日時                    |
| updated_at      | timestamptz| NOT NULL DEFAULT now()           | 更新日時                    |

**インデックス**:
- `bar_manage_id` (UNIQUE)
- `bar_id`

**運用ルール**:
- 1店舗 = 1アカウント（店舗スタッフ全員で `bar_manage_id` とパスワードを共有してログイン）
- 店舗登録時に `admin_users` レコードも自動作成される

**承認ステータス（`approval_status`）**:
- 店舗登録の経路により初期値が異なる:
  - admin 手動作成（`POST /api/bars` / `/bars/new`）: 従来どおり承認不要。列は `DEFAULT 'approved'` で作成される
  - 店舗セルフサーブ登録（`POST /api/bars/register` / `/bars/register`）: `'pending'`（審査中）で作成し、あわせて `bars.is_active=false` にして承認まで非公開にする
- ログイン API（`POST /api/auth/login`）は `approval_status='pending'`/`'rejected'` のアカウントを 403 で弾く（`'approved'` のみログイン可能）
- admin が承認（`POST /api/bars/[barId]/approve`）すると `approval_status='approved'`・`bars.is_active=true` に更新され、ログイン可能・ユーザー画面に公開される
- 既存レコードは `DEFAULT 'approved'` により後方互換（既存 admin/bar_owner のログインに影響しない）
- `'rejected'`（却下）値は予約済みだが、却下操作の UI は本スコープ外（別 Issue）

**権限**:
- `bar_owner`: 自店舗（`bar_id` で紐づく店舗）の全データを編集可能
- `admin`: 全店舗の店舗情報（`bars`）を閲覧・編集可能。ただし店舗配下データ（メニュー・記事・クーポン・イベント）は参照のみで編集不可

---

### ~~8-2. bar_owners~~（廃止）

**このテーブルは廃止されました。** `admin_users` テーブルに `bar_id` カラムを追加し、1対1の紐付けに変更。中間テーブルは不要になりました。

---

### 8-3. subscription_plans

サブスクリプションプラン定義。

- **Table name:** `subscription_plans`
- **Description:** サブスクリプションのプラン定義マスタ

#### Columns

| Column          | Type        | Constraints                     | Description                 |
|-----------------|------------|----------------------------------|-----------------------------|
| id              | bigserial  | PK                               | プランID                    |
| name            | text       | NOT NULL                         | プラン名                    |
| stripe_price_id | text       | NOT NULL                         | Stripe Price ID             |
| price           | integer    | NOT NULL                         | 価格                        |
| currency        | text       | NOT NULL                         | 通貨コード（'jpy' 等）     |
| interval        | text       | NOT NULL                         | 課金間隔（'month', 'year'） |
| features        | jsonb      | NULLABLE                         | プラン機能一覧              |
| is_active       | boolean    | NOT NULL DEFAULT true            | 有効フラグ                  |
| created_at      | timestamptz| NOT NULL DEFAULT now()           | 作成日時                    |
| updated_at      | timestamptz| NOT NULL DEFAULT now()           | 更新日時                    |

---

### 8-4. bar_subscriptions

バーごとのサブスクリプション情報（Stripe連携）。

- **Table name:** `bar_subscriptions`
- **Description:** バーごとのサブスクリプション状態

#### Columns

| Column                  | Type        | Constraints                              | Description                        |
|-------------------------|------------|-------------------------------------------|------------------------------------|
| id                      | bigserial  | PK                                        | サブスクリプションID               |
| bar_id                  | bigint     | NOT NULL, FK → bars(id)                   | バーID                             |
| subscription_plan_id    | bigint     | NOT NULL, FK → subscription_plans(id)     | プランID                           |
| stripe_customer_id      | text       | NOT NULL                                  | Stripe顧客ID                      |
| stripe_subscription_id  | text       | NOT NULL                                  | StripeサブスクリプションID         |
| status                  | text       | NOT NULL DEFAULT 'active'                 | ステータス（'active', 'canceled', 'past_due', 'trialing', 'incomplete'） |
| current_period_start    | timestamptz| NOT NULL                                  | 現在の課金期間開始日               |
| current_period_end      | timestamptz| NOT NULL                                  | 現在の課金期間終了日               |
| cancel_at_period_end    | boolean    | NOT NULL DEFAULT false                    | 期間終了時にキャンセルするか       |
| canceled_at             | timestamptz| NULLABLE                                  | キャンセル日時                     |
| created_at              | timestamptz| NOT NULL DEFAULT now()                    | 作成日時                           |
| updated_at              | timestamptz| NOT NULL DEFAULT now()                    | 更新日時                           |

**インデックス**:
- `bar_id`
- `stripe_customer_id`
- `stripe_subscription_id`

**権限**:
- バーオーナー: 自バーのサブスクリプション参照のみ
- プロダクト管理者: 全サブスクリプション参照可能

---

### 8-5. invoices

請求書情報（Stripe連携）。

- **Table name:** `invoices`
- **Description:** バーごとの請求書

#### Columns

| Column              | Type        | Constraints                                | Description                 |
|---------------------|------------|---------------------------------------------|-----------------------------|
| id                  | bigserial  | PK                                          | 請求書ID                    |
| bar_id              | bigint     | NOT NULL, FK → bars(id)                     | バーID                      |
| bar_subscription_id | bigint     | NULLABLE, FK → bar_subscriptions(id)        | サブスクリプションID        |
| stripe_invoice_id   | text       | NOT NULL                                    | Stripe Invoice ID           |
| amount_paid         | integer    | NOT NULL                                    | 支払済み金額                |
| amount_due          | integer    | NOT NULL                                    | 請求金額                    |
| currency            | text       | NOT NULL                                    | 通貨コード                  |
| status              | text       | NOT NULL                                    | ステータス（'paid', 'open', 'void', 'uncollectible'） |
| invoice_pdf         | text       | NULLABLE                                    | PDF URL                     |
| paid_at             | timestamptz| NULLABLE                                    | 支払日時                    |
| created_at          | timestamptz| NOT NULL DEFAULT now()                      | 作成日時                    |

**権限**:
- バーオーナー: 自バーの請求書参照のみ
- プロダクト管理者: 全請求書参照可能

---

### 8-6. bar_events

店舗のイベント情報。管理画面で登録し、ユーザー画面の店舗詳細ページ（イベントタブ）でも表示する。

- **Table name:** `bar_events`
- **Description:** 店舗が開催するイベント（管理画面・ユーザー画面の両方で使用）

#### Columns

| Column       | Type        | Constraints                     | Description            |
|--------------|------------|----------------------------------|------------------------|
| id           | bigserial  | PK                               | イベントID             |
| bar_id       | bigint     | NOT NULL, FK → bars(id)         | 店舗ID                 |
| title        | text       | NOT NULL                         | イベントタイトル       |
| description  | text       | NULLABLE                         | イベント説明文         |
| start_date   | timestamptz| NOT NULL                         | 開始日時               |
| end_date     | timestamptz| NULLABLE                         | 終了日時               |
| image_url    | text       | NULLABLE                         | イベント画像URL        |
| is_active    | boolean    | NOT NULL DEFAULT true            | 掲載中フラグ           |
| created_at   | timestamptz| NOT NULL DEFAULT now()           | 作成日時               |
| updated_at   | timestamptz| NOT NULL DEFAULT now()           | 更新日時               |

**インデックス**:
- `bar_id`

---

### ~~8-7. master_beer_styles~~（廃止）

**このテーブルは廃止されました。** マスタ管理機能の廃止に伴い、不要となりました。

---

### ~~8-8. master_breweries~~（廃止）

**このテーブルは廃止されました。** マスタ管理機能の廃止に伴い、不要となりました。醸造所情報は Web 側の `breweries` テーブルに一本化。

---

### ~~8-9. master_food_categories~~（廃止）

**このテーブルは廃止されました。** マスタ管理機能の廃止に伴い、不要となりました。

---

### ~~8-10. master_event_categories~~（廃止）

**このテーブルは廃止されました。** マスタ管理機能の廃止に伴い、不要となりました。

---

## 9. 今回の Prisma/Supabase への渡し方イメージ

- この `database.md` を Claude Code に渡し、
  - 「この設計に基づいて Prisma schema を作成してください」
  - 「Supabase 用のマイグレーション SQL を生成してください」
  といった指示を出す前提。

- フロント側の画面仕様（`routing.md`, `wireframe.md`）と合わせて使うことで、
  - API / Server Actions の設計
  - タイムライン・店舗詳細・クーポン・お気に入り・通知
  を一貫したモデルで実装できるようにする。

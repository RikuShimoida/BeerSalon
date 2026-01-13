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
| regular_holiday | text       | NULLABLE                         | 定休日                                  |
| access          | text       | NULLABLE                         | 交通手段・最寄駅など                    |
| website_url     | text       | NULLABLE                         | 店舗公式サイト URL                      |
| description     | text       | NULLABLE                         | PR文                                    |
| is_active       | boolean    | NOT NULL DEFAULT true            | 掲載中フラグ                            |
| created_at      | timestamptz| NOT NULL DEFAULT now()           | 作成日時                                |
| updated_at      | timestamptz| NOT NULL DEFAULT now()           | 更新日時                                |

---

### 2-2. bar_images

店舗の写真（外観・店内・ビール・料理）。

- **Table name:** `bar_images`
- **Description:** 店舗ごとの画像（外観/店内/ビール/料理など）

#### Columns

| Column       | Type        | Constraints                         | Description                                  |
|--------------|------------|--------------------------------------|----------------------------------------------|
| id           | bigserial  | PK                                   | 画像ID                                       |
| bar_id       | bigint     | NOT NULL, FK → bars(id)             | 紐づく店舗                                   |
| image_type   | text       | NOT NULL                             | 'exterior' / 'interior' / 'beer' / 'food' など |
| image_url    | text       | NOT NULL                             | 画像URL（Supabase Storage へのパス等）       |
| sort_order   | integer    | NOT NULL DEFAULT 0                   | 表示順                                       |
| created_at   | timestamptz| NOT NULL DEFAULT now()               | 作成日時                                     |

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

### 2-5. origins

産地マスタ（国に紐づく地域）。

- **Table name:** `origins`
- **Description:** ビールの産地マスタ

#### Columns

| Column      | Type        | Constraints            | Description          |
|-------------|------------|------------------------|----------------------|
| id          | bigserial  | PK                     | 産地ID               |
| name        | text       | NOT NULL               | 産地名（地域名）     |
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
| country     | text       | NULLABLE               | 国                   |
| region      | text       | NULLABLE               | 地域/都道府県等      |
| website_url | text       | NULLABLE               | Webサイト            |
| is_active   | boolean    | NOT NULL DEFAULT true  | 使用中フラグ         |
| created_at  | timestamptz| NOT NULL DEFAULT now() | 作成日時             |
| updated_at  | timestamptz| NOT NULL DEFAULT now() | 更新日時             |

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
| origin_id        | bigint     | NULLABLE, FK → origins(id)         | 産地ID                      |
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
| price        | integer    | NULLABLE                         | 価格（税抜/税込はUI側で定義）      |
| size         | text       | NULLABLE                         | "Mサイズ", "パイント" 等            |
| description  | text       | NULLABLE                         | メニュー用説明                      |
| image_url    | text       | NULLABLE                         | 写真                                |
| is_active    | boolean    | NOT NULL DEFAULT true            | 提供中フラグ                        |
| created_at   | timestamptz| NOT NULL DEFAULT now()           | 作成日時                            |
| updated_at   | timestamptz| NOT NULL DEFAULT now()           | 更新日時                            |

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

### 3-1. coupons

店舗が発行するクーポン。

- **Table name:** `coupons`
- **Description:** 店舗ごとのクーポン定義

#### Columns

| Column          | Type        | Constraints                  | Description             |
|-----------------|------------|------------------------------|-------------------------|
| id              | bigserial  | PK                           | クーポンID              |
| bar_id          | bigint     | NOT NULL, FK → bars(id)      | 店舗ID                  |
| title           | text       | NOT NULL                     | 見出し                  |
| description     | text       | NOT NULL                     | 内容文                  |
| conditions      | text       | NULLABLE                     | 取得/利用条件           |
| valid_from      | timestamptz| NULLABLE                     | 有効期間開始            |
| valid_until     | timestamptz| NULLABLE                     | 有効期間終了            |
| is_active       | boolean    | NOT NULL DEFAULT true        | 掲載中フラグ            |
| created_at      | timestamptz| NOT NULL DEFAULT now()       | 作成日時                |
| updated_at      | timestamptz| NOT NULL DEFAULT now()       | 更新日時                |

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
| coupon_id     | bigint     | NOT NULL, FK → coupons(id)         | クーポンID          |
| obtained_at   | timestamptz| NOT NULL DEFAULT now()             | 取得日時            |
| used_at       | timestamptz| NULLABLE                           | 使用日時            |
| is_used       | boolean    | NOT NULL DEFAULT false             | 使用済みフラグ      |

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
| image_url    | text       | NULLABLE                        | サムネイル画像   |
| published_at | timestamptz| NULLABLE                        | 公開日時        |
| is_published | boolean    | NOT NULL DEFAULT false          | 公開フラグ      |
| created_at   | timestamptz| NOT NULL DEFAULT now()          | 作成日時        |
| updated_at   | timestamptz| NOT NULL DEFAULT now()          | 更新日時        |

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

## 5. 閲覧履歴・通知

### 5-1. view_histories

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

### 5-2. notifications

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

---

## 6. ログ関連（任意で実装）

### 6-1. login_histories

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

## 7. 今回の Prisma/Supabase への渡し方イメージ

- この `database.md` を Claude Code に渡し、
  - 「この設計に基づいて Prisma schema を作成してください」
  - 「Supabase 用のマイグレーション SQL を生成してください」
  といった指示を出す前提。

- フロント側の画面仕様（`routing.md`, `wireframe.md`）と合わせて使うことで、
  - API / Server Actions の設計
  - タイムライン・店舗詳細・クーポン・お気に入り・通知
  を一貫したモデルで実装できるようにする。

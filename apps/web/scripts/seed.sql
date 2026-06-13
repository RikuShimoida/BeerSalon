-- ビールカテゴリ
INSERT INTO beer_categories (name, is_active, created_at, updated_at)
VALUES ('IPA', true, NOW(), NOW())
RETURNING id;

-- 醸造所
INSERT INTO breweries (name, country, region, is_active, created_at, updated_at)
VALUES ('静岡クラフトビール', '日本', '静岡県', true, NOW(), NOW())
RETURNING id;

-- ビール
INSERT INTO beers (name, beer_category_id, brewery_id, origin, abv, ibu, description, is_active, created_at, updated_at)
VALUES ('静岡ペールエール', 1, 1, '静岡県', 5.5, 40, '静岡産ホップを使用した爽やかなペールエール', true, NOW(), NOW())
RETURNING id;

-- バー
INSERT INTO bars (name, prefecture, city, address_line1, latitude, longitude, phone_number, opening_time, ending_time, regular_holiday, access, website_url, description, is_active, created_at, updated_at)
VALUES (
  'ビアバー サンプル',
  '静岡県',
  '静岡市',
  '葵区紺屋町1-1',
  34.9756,
  138.3828,
  '054-123-4567',
  '17:00:00',
  '24:00:00',
  '月曜日',
  'JR静岡駅から徒歩5分',
  'https://example.com',
  '静岡駅近くのクラフトビール専門店です。
常時20種類以上のクラフトビールを取り揃えております。',
  true,
  NOW(),
  NOW()
)
RETURNING id;

-- ビールメニュー
INSERT INTO bar_beer_menus (bar_id, beer_id, price, size, description, is_active, created_at, updated_at)
VALUES (1, 1, 800, 'パイント', 'おすすめの一杯', true, NOW(), NOW());

-- 料理メニュー
INSERT INTO bar_food_menus (bar_id, name, price, description, is_active, created_at, updated_at)
VALUES (1, 'フライドポテト', 500, 'ビールに合うカリカリポテト', true, NOW(), NOW());

-- クーポン
INSERT INTO coupons (bar_id, title, description, conditions, valid_from, valid_until, is_active, created_at, updated_at)
VALUES (
  1,
  '初回来店クーポン',
  '初回来店時にビール1杯無料',
  '会計時にこのクーポンを提示してください',
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  NOW(),
  NOW()
);

-- 記事
INSERT INTO articles (bar_id, title, body, is_published, published_at, created_at, updated_at)
VALUES (
  1,
  '新しいビールが入荷しました！',
  '今週、新しいクラフトビールが入荷しました。
静岡産のホップを使用した爽やかなIPAです。
ぜひお試しください！',
  true,
  NOW(),
  NOW(),
  NOW()
);

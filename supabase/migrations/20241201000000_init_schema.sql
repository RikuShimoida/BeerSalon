-- ============================================================
-- Beer Salon - 初期スキーマ
-- Prismaマイグレーションで管理されていたテーブル定義を
-- Supabaseマイグレーションに統合（Issue #180）
-- ============================================================

-- ============================================================
-- 1. ユーザー関連
-- ============================================================

CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_auth_id" UUID NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "birthday" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "profile_image_url" TEXT,
    "bio" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_user_auth_id_key" ON "user_profiles"("user_auth_id");

-- ============================================================
-- 2. 店舗関連
-- ============================================================

CREATE TABLE "bars" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "phone_number" TEXT,
    "opening_time" TIME(6),
    "ending_time" TIME(6),
    "regular_holiday" TEXT,
    "access" TEXT,
    "website_url" TEXT,
    "instagram_url" TEXT,
    "x_url" TEXT,
    "facebook_url" TEXT,
    "description" TEXT,
    "preview_image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bars_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bar_images" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "media_type" TEXT NOT NULL DEFAULT 'image',
    "image_type" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_images_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "bar_images" ADD CONSTRAINT "bar_images_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bar_opening_hours" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "day_of_week" INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    "open_time" TIME(6) NOT NULL,
    "close_time" TIME(6) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_opening_hours_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bar_opening_hours_bar_id_day_of_week_idx" ON "bar_opening_hours"("bar_id", "day_of_week");

ALTER TABLE "bar_opening_hours" ADD CONSTRAINT "bar_opening_hours_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMENT ON TABLE bar_opening_hours IS '店舗の曜日別営業時間';
COMMENT ON COLUMN bar_opening_hours.day_of_week IS '曜日 (0=月, 1=火, 2=水, 3=木, 4=金, 5=土, 6=日)';
COMMENT ON COLUMN bar_opening_hours.is_closed IS '定休日フラグ';
COMMENT ON COLUMN bar_opening_hours.sort_order IS '同一曜日内の表示順';

-- ============================================================
-- 3. ビール関連マスタ
-- ============================================================

CREATE TABLE "beer_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beer_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "beer_categories_name_key" ON "beer_categories"("name");

CREATE TABLE "countries" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

CREATE TABLE "regions" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regions_country_id_name_key" ON "regions"("country_id", "name");

ALTER TABLE "regions" ADD CONSTRAINT "regions_country_id_fkey"
  FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "breweries" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "region_id" BIGINT,
    "website_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breweries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "breweries_name_key" ON "breweries"("name");

ALTER TABLE "breweries" ADD CONSTRAINT "breweries_region_id_fkey"
  FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "beers" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "beer_category_id" BIGINT NOT NULL,
    "brewery_id" BIGINT,
    "region_id" BIGINT,
    "abv" DECIMAL(4,2),
    "ibu" INTEGER,
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "beers" ADD CONSTRAINT "beers_beer_category_id_fkey"
  FOREIGN KEY ("beer_category_id") REFERENCES "beer_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "beers" ADD CONSTRAINT "beers_brewery_id_fkey"
  FOREIGN KEY ("brewery_id") REFERENCES "breweries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "beers" ADD CONSTRAINT "beers_region_id_fkey"
  FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 4. メニュー関連
-- ============================================================

CREATE TABLE "bar_beer_menus" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "beer_id" BIGINT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_beer_menus_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "bar_beer_menus" ADD CONSTRAINT "bar_beer_menus_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bar_beer_menus" ADD CONSTRAINT "bar_beer_menus_beer_id_fkey"
  FOREIGN KEY ("beer_id") REFERENCES "beers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "bar_beer_menu_sizes" (
    "id" BIGSERIAL NOT NULL,
    "bar_beer_menu_id" BIGINT NOT NULL,
    "size_name" TEXT NOT NULL,
    "price" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_beer_menu_sizes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "bar_beer_menu_sizes" ADD CONSTRAINT "bar_beer_menu_sizes_bar_beer_menu_id_fkey"
  FOREIGN KEY ("bar_beer_menu_id") REFERENCES "bar_beer_menus"("id") ON DELETE CASCADE;

CREATE TABLE "bar_food_menus" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER,
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_food_menus_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "bar_food_menus" ADD CONSTRAINT "bar_food_menus_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 5. クーポン関連
-- ============================================================

CREATE TABLE "bar_coupons" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" TEXT NOT NULL DEFAULT 'percentage',
    "discount_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "code" TEXT,
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_coupons_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "bar_coupons" ADD CONSTRAINT "bar_coupons_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_coupons" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "coupon_id" BIGINT NOT NULL,
    "obtained_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMPTZ(6),
    "is_used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_coupons_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_coupon_id_fkey"
  FOREIGN KEY ("coupon_id") REFERENCES "bar_coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 6. 記事関連
-- ============================================================

CREATE TABLE "articles" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "image_url_2" TEXT,
    "image_url_3" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "articles" ADD CONSTRAINT "articles_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "article_likes" (
    "id" BIGSERIAL NOT NULL,
    "article_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "article_likes_article_id_user_id_key" ON "article_likes"("article_id", "user_id");

ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_article_id_fkey"
  FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 7. 投稿関連
-- ============================================================

CREATE TABLE "posts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "body" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "posts" ADD CONSTRAINT "posts_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "post_images" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "post_likes" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 8. ソーシャル関連
-- ============================================================

CREATE TABLE "user_follow_relations" (
    "id" BIGSERIAL NOT NULL,
    "follower_id" UUID NOT NULL,
    "followee_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follow_relations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_follow_relations_follower_id_followee_id_key" ON "user_follow_relations"("follower_id", "followee_id");

ALTER TABLE "user_follow_relations" ADD CONSTRAINT "user_follow_relations_follower_id_fkey"
  FOREIGN KEY ("follower_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_follow_relations" ADD CONSTRAINT "user_follow_relations_followee_id_fkey"
  FOREIGN KEY ("followee_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "favorite_bars" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_bars_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorite_bars_user_id_bar_id_key" ON "favorite_bars"("user_id", "bar_id");

ALTER TABLE "favorite_bars" ADD CONSTRAINT "favorite_bars_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "favorite_bars" ADD CONSTRAINT "favorite_bars_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 9. 閲覧履歴・通知・ログ
-- ============================================================

CREATE TABLE "view_histories" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_histories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "view_histories_user_id_bar_id_key" ON "view_histories"("user_id", "bar_id");

ALTER TABLE "view_histories" ADD CONSTRAINT "view_histories_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "view_histories" ADD CONSTRAINT "view_histories_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "login_histories" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "logged_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "login_status" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "auth_provider" TEXT,

    CONSTRAINT "login_histories_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "login_histories" ADD CONSTRAINT "login_histories_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 10. 決済手段
-- ============================================================

CREATE TABLE "payment_methods" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_methods_name_key" ON "payment_methods"("name");

CREATE TABLE "bar_payment_methods" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "payment_method_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bar_payment_methods_bar_id_payment_method_id_key" ON "bar_payment_methods"("bar_id", "payment_method_id");

ALTER TABLE "bar_payment_methods" ADD CONSTRAINT "bar_payment_methods_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bar_payment_methods" ADD CONSTRAINT "bar_payment_methods_payment_method_id_fkey"
  FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 11. 管理画面専用テーブル
-- ============================================================

-- admin_users（管理画面ログインユーザー）
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bar_manage_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'bar_owner',
    "bar_id" BIGINT REFERENCES bars(id) ON DELETE SET NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_users_bar_manage_id_key" ON "admin_users"("bar_manage_id");
CREATE INDEX "idx_admin_users_bar_id" ON "admin_users"("bar_id");

-- bar_events（イベント管理）
CREATE TABLE "bar_events" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_bar_events_bar_id" ON "bar_events"("bar_id");

ALTER TABLE "bar_events" ADD CONSTRAINT "bar_events_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE;

-- subscription_plans（サブスクリプションプラン）
CREATE TABLE "subscription_plans" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stripe_price_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- bar_subscriptions（バーのサブスクリプション）
CREATE TABLE "bar_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "subscription_plan_id" BIGINT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMPTZ NOT NULL,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_bar_subscriptions_bar_id" ON "bar_subscriptions"("bar_id");
CREATE INDEX "idx_bar_subscriptions_stripe_customer_id" ON "bar_subscriptions"("stripe_customer_id");
CREATE INDEX "idx_bar_subscriptions_stripe_subscription_id" ON "bar_subscriptions"("stripe_subscription_id");

ALTER TABLE "bar_subscriptions" ADD CONSTRAINT "bar_subscriptions_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE;

ALTER TABLE "bar_subscriptions" ADD CONSTRAINT "bar_subscriptions_subscription_plan_id_fkey"
  FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id");

-- invoices（請求書）
CREATE TABLE "invoices" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "bar_subscription_id" BIGINT,
    "stripe_invoice_id" TEXT NOT NULL,
    "amount_paid" INTEGER NOT NULL,
    "amount_due" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "invoice_pdf" TEXT,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_invoices_bar_id" ON "invoices"("bar_id");

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bar_id_fkey"
  FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bar_subscription_id_fkey"
  FOREIGN KEY ("bar_subscription_id") REFERENCES "bar_subscriptions"("id") ON DELETE SET NULL;

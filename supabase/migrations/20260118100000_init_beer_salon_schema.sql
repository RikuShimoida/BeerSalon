-- Beer Salon Schema Migration
-- This migration creates all tables for the Beer Salon application

-- Create user_profiles table with RLS
CREATE TABLE IF NOT EXISTS "user_profiles" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_user_auth_id_key" ON "user_profiles"("user_auth_id");

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_auth_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_auth_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_auth_id);

-- Create bars table
CREATE TABLE IF NOT EXISTS "bars" (
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
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bars_pkey" PRIMARY KEY ("id")
);

-- Create bar_images table
CREATE TABLE IF NOT EXISTS "bar_images" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "image_type" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_images_pkey" PRIMARY KEY ("id")
);

-- Create beer_categories table
CREATE TABLE IF NOT EXISTS "beer_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beer_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "beer_categories_name_key" ON "beer_categories"("name");

-- Create countries table
CREATE TABLE IF NOT EXISTS "countries" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "countries_name_key" ON "countries"("name");

-- Create regions table
CREATE TABLE IF NOT EXISTS "regions" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "regions_country_id_name_key" ON "regions"("country_id", "name");

-- Create breweries table
CREATE TABLE IF NOT EXISTS "breweries" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "region_id" BIGINT,
    "website_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breweries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "breweries_name_key" ON "breweries"("name");

-- Create beers table
CREATE TABLE IF NOT EXISTS "beers" (
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

-- Create bar_beer_menus table
CREATE TABLE IF NOT EXISTS "bar_beer_menus" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "beer_id" BIGINT NOT NULL,
    "price" INTEGER,
    "size" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_beer_menus_pkey" PRIMARY KEY ("id")
);

-- Create bar_food_menus table
CREATE TABLE IF NOT EXISTS "bar_food_menus" (
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

-- Create coupons table
CREATE TABLE IF NOT EXISTS "coupons" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conditions" TEXT,
    "valid_from" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- Create user_coupons table
CREATE TABLE IF NOT EXISTS "user_coupons" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "coupon_id" BIGINT NOT NULL,
    "obtained_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMPTZ(6),
    "is_used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_coupons_pkey" PRIMARY KEY ("id")
);

-- Create articles table
CREATE TABLE IF NOT EXISTS "articles" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- Create posts table
CREATE TABLE IF NOT EXISTS "posts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "body" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- Create post_images table
CREATE TABLE IF NOT EXISTS "post_images" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS "post_likes" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- Create user_follow_relations table
CREATE TABLE IF NOT EXISTS "user_follow_relations" (
    "id" BIGSERIAL NOT NULL,
    "follower_id" UUID NOT NULL,
    "followee_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follow_relations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_follow_relations_follower_id_followee_id_key" ON "user_follow_relations"("follower_id", "followee_id");

-- Create favorite_bars table
CREATE TABLE IF NOT EXISTS "favorite_bars" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_bars_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorite_bars_user_id_bar_id_key" ON "favorite_bars"("user_id", "bar_id");

-- Create view_histories table
CREATE TABLE IF NOT EXISTS "view_histories" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_histories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "view_histories_user_id_bar_id_key" ON "view_histories"("user_id", "bar_id");

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
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

-- Create login_histories table
CREATE TABLE IF NOT EXISTS "login_histories" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "logged_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "login_status" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "auth_provider" TEXT,

    CONSTRAINT "login_histories_pkey" PRIMARY KEY ("id")
);

-- Add Foreign Keys
ALTER TABLE "bar_images" DROP CONSTRAINT IF EXISTS "bar_images_bar_id_fkey";
ALTER TABLE "bar_images" ADD CONSTRAINT "bar_images_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regions" DROP CONSTRAINT IF EXISTS "regions_country_id_fkey";
ALTER TABLE "regions" ADD CONSTRAINT "regions_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "breweries" DROP CONSTRAINT IF EXISTS "breweries_region_id_fkey";
ALTER TABLE "breweries" ADD CONSTRAINT "breweries_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "beers" DROP CONSTRAINT IF EXISTS "beers_beer_category_id_fkey";
ALTER TABLE "beers" ADD CONSTRAINT "beers_beer_category_id_fkey" FOREIGN KEY ("beer_category_id") REFERENCES "beer_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "beers" DROP CONSTRAINT IF EXISTS "beers_brewery_id_fkey";
ALTER TABLE "beers" ADD CONSTRAINT "beers_brewery_id_fkey" FOREIGN KEY ("brewery_id") REFERENCES "breweries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "beers" DROP CONSTRAINT IF EXISTS "beers_region_id_fkey";
ALTER TABLE "beers" ADD CONSTRAINT "beers_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bar_beer_menus" DROP CONSTRAINT IF EXISTS "bar_beer_menus_bar_id_fkey";
ALTER TABLE "bar_beer_menus" ADD CONSTRAINT "bar_beer_menus_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bar_beer_menus" DROP CONSTRAINT IF EXISTS "bar_beer_menus_beer_id_fkey";
ALTER TABLE "bar_beer_menus" ADD CONSTRAINT "bar_beer_menus_beer_id_fkey" FOREIGN KEY ("beer_id") REFERENCES "beers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bar_food_menus" DROP CONSTRAINT IF EXISTS "bar_food_menus_bar_id_fkey";
ALTER TABLE "bar_food_menus" ADD CONSTRAINT "bar_food_menus_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "coupons_bar_id_fkey";
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_coupons" DROP CONSTRAINT IF EXISTS "user_coupons_user_id_fkey";
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_coupons" DROP CONSTRAINT IF EXISTS "user_coupons_coupon_id_fkey";
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_bar_id_fkey";
ALTER TABLE "articles" ADD CONSTRAINT "articles_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_user_id_fkey";
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_bar_id_fkey";
ALTER TABLE "posts" ADD CONSTRAINT "posts_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_images" DROP CONSTRAINT IF EXISTS "post_images_post_id_fkey";
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_likes" DROP CONSTRAINT IF EXISTS "post_likes_post_id_fkey";
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_likes" DROP CONSTRAINT IF EXISTS "post_likes_user_id_fkey";
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_follow_relations" DROP CONSTRAINT IF EXISTS "user_follow_relations_follower_id_fkey";
ALTER TABLE "user_follow_relations" ADD CONSTRAINT "user_follow_relations_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_follow_relations" DROP CONSTRAINT IF EXISTS "user_follow_relations_followee_id_fkey";
ALTER TABLE "user_follow_relations" ADD CONSTRAINT "user_follow_relations_followee_id_fkey" FOREIGN KEY ("followee_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "favorite_bars" DROP CONSTRAINT IF EXISTS "favorite_bars_user_id_fkey";
ALTER TABLE "favorite_bars" ADD CONSTRAINT "favorite_bars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "favorite_bars" DROP CONSTRAINT IF EXISTS "favorite_bars_bar_id_fkey";
ALTER TABLE "favorite_bars" ADD CONSTRAINT "favorite_bars_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "view_histories" DROP CONSTRAINT IF EXISTS "view_histories_user_id_fkey";
ALTER TABLE "view_histories" ADD CONSTRAINT "view_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "view_histories" DROP CONSTRAINT IF EXISTS "view_histories_bar_id_fkey";
ALTER TABLE "view_histories" ADD CONSTRAINT "view_histories_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "login_histories" DROP CONSTRAINT IF EXISTS "login_histories_user_id_fkey";
ALTER TABLE "login_histories" ADD CONSTRAINT "login_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

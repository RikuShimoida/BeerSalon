---
name: Monorepo DB layer divergence
description: Prisma schema is missing admin tables and has column-level drift from database.md; admin app uses raw Supabase client instead of Prisma
type: project
---

Prisma schema (`prisma/schema.prisma`) is missing `admin_users`, `subscriptions` (database.md section 8). `bar_owners` table has been **abolished** (2026-05-15 redesign). Admin app (`apps/admin`) uses `supabase.from()` directly to query these tables.

Key 2026-05-15 schema changes not yet reflected in code:
- `admin_users.email` renamed to `bar_manage_id` (slug-format login ID)
- `admin_users` gained `bar_id` FK, `contact_email`, `contact_phone` columns
- `bar_owners` table abolished entirely
- `bar_beer_menus.size` and `bar_beer_menus.price` removed; new `bar_beer_menu_sizes` table added
- `articles` gained `image_url_2`, `image_url_3` columns
- Master tables abolished: `master_beer_styles`, `master_breweries`, `master_food_categories`, `master_event_categories`

Additional pre-existing drift: `coupons` missing `code`, `discount_type`, `discount_value`, `max_uses`, `used_count`, `deleted_at`; `articles` uses `is_published` boolean instead of `status` text; `breweries` missing `country_id`.

**Why:** The two apps were developed in separate repos with different DB access patterns (Prisma vs raw Supabase). The monorepo migration unified the directory structure but not the data access layer. The 2026-05-15 redesign simplified the admin auth model (1 shop = 1 account, no intermediate table).

**How to apply:** When implementing features that touch tables shared between web and admin (bars, coupons, articles, bar_images), always verify which DB client is being used in each app and whether the Prisma schema matches database.md. The admin app needs significant migration work to align with the new schema. Prioritize resolving the database.md vs code divergence before adding new features.

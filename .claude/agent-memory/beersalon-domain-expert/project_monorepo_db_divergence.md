---
name: Monorepo DB layer divergence
description: Prisma schema is missing admin tables and has column-level drift from database.md; admin app uses raw Supabase client instead of Prisma
type: project
---

Prisma schema (`prisma/schema.prisma`) is missing `admin_users`, `bar_owners`, `subscriptions` (all of database.md section 8). Admin app (`apps/admin`) uses `supabase.from()` directly to query these tables.

Additional drift: `coupons` missing `code`, `discount_type`, `discount_value`, `max_uses`, `used_count`, `deleted_at`; `articles` uses `is_published` boolean instead of `status` text; `breweries` missing `country_id`.

**Why:** The two apps were developed in separate repos with different DB access patterns (Prisma vs raw Supabase). The monorepo migration unified the directory structure but not the data access layer.

**How to apply:** When implementing features that touch tables shared between web and admin (bars, coupons, articles, bar_images), always verify which DB client is being used in each app and whether the Prisma schema matches database.md. Prioritize resolving the database.md vs Prisma divergence before adding new features that depend on the drifted columns.

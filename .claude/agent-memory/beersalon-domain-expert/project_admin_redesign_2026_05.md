---
name: Admin panel redesign May 2026
description: Major admin panel restructuring - abolished bar_owners, master tables, dashboard; simplified to 1-shop-1-account model with bar_manage_id login
type: project
---

2026-05-15: BeerSalonAdmin underwent a major redesign:

**Auth model change**: Login changed from email to `bar_manage_id` (slug, e.g. `fuji-beer-bar`). 1 shop = 1 shared account for all staff. `bar_owners` intermediate table abolished; `admin_users.bar_id` FK directly links to `bars`.

**Abolished pages**: Dashboard (`/`), master management (`/admin/master/*`), admin user management (`/admin/users/*`), billing (`/billing`).

**Abolished tables**: `bar_owners`, `master_beer_styles`, `master_breweries`, `master_food_categories`, `master_event_categories`.

**Permission update**: admin can view/edit all bar info but can only **read** (not edit) bar sub-data (menus, articles, coupons, events). bar_owner can edit all data for their own bar.

**New documents**: `wireframe-admin.md` created. `routing.md` gained section 3 for admin routes. `database.md` updated with all schema changes.

**Why:** Simplified the admin model for MVP - multi-account per bar was overengineered, master management was unused overhead.

**How to apply:** When implementing admin features, always check wireframe-admin.md (not wireframe.md). The existing admin code has many pages/routes that need deletion. New features should follow the 1-shop-1-account model.

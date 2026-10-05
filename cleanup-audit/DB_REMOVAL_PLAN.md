# DB Removal Plan

Local DB only. Production untouched.

## SAFE TO REMOVE

Evidence complete: source + live data + relations + scripts.

### Rows (not tables)

| Target | Evidence | Action |
| --- | --- | --- |
| Product `id=1` `spider-man-backpack` | TH metaTitle `asdasdas`; EN keywords "สินค้าเพื่อทดสอบระบบ"; DRAFT; prior QA classified DEMO | Delete product + translations + variants + prices + category links |
| Order `1..8` | Every OrderItem is that product; emails `naiiwolf00@gmail.com` | Delete order items then orders |
| Customer `id=1` name `aaaa` | Only customer; only those test orders | Delete |
| Cart / CartItem leftover | Cart lines point at product 1 | Delete those carts/items |
| Empty Wishlist `cmrkhctgz…` | Created with the demo shop session | Delete |

### Code / packages (not DB)

See component and package audits. Applied in this round when evidence is an unused import graph.

## POSSIBLY REMOVE

Do **not** apply this round.

| Target | Why uncertain |
| --- | --- |
| `CompanyInfo.smtp*` columns | Deprecated, empty, unread by app; still written by `scripts/update_db_info.mjs` |
| `ProductVariant.price` | Marked @deprecated; still TH fallback in schema |
| `Service` table | Used in sitemap skip-list + repository; public pages are hardcoded |
| ContactSubmission `Brady` / `info@freeb2bdata.org` | Looks like a lead or spam, **not** confirmed QA |
| PageView 917 rows | Real local analytics, not junk |
| `AdminUser.roleId` without Role model | Used for owner vs employee |
| BlogCategory slug `ตัวอย่างเว็บไซต์` (Thai slug) | Real category; messy slug, not test data |

## KEEP

All 30 Prisma models. All relations. All indexes currently in schema. All real posts (12), portfolios (7), services (3), blog categories (5), company info, shop categories, payment settings, admin user.

## MIGRATE FIRST

None for data. Schema change this round is **baseline Prisma migration from empty → current schema** so a copied repo can create a new database. No column drops.

Failed leftover `_prisma_migrations` row `20260714045038_init` on local will be replaced by a real init migration marked applied on `db_tbm_local`.

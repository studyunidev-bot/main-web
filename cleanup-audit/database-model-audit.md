# Database Model Audit

Source of truth: `prisma/schema.prisma` + live `db_tbm_local` + codebase search (`src/`, `scripts/`).  
QA/SEO untracked scripts counted as script usage but not as product runtime.

Status key: ACTIVE | LEGACY | UNUSED | DUPLICATE | TEST | UNKNOWN  
Action key: KEEP | CLEAN | MERGE | REMOVE CANDIDATE | DEPRECATE | REVIEW

No model is UNUSED. None removed.

| Model | Purpose | Records | Frontend | Admin | API | Relations | Scripts | Status | Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AdminUser | Admin login / employees | 1 | No | Yes (`employees`, auth) | NextAuth | none | `create-admin-user.mjs` | ACTIVE | KEEP |
| Post | Blog articles | 12 | Yes `/blog` | Yes CMS | sitemap via repo | PostTranslation | QA leftover search | ACTIVE | KEEP |
| PostTranslation | Locale overlay for posts | 8 | Yes | Yes | No | Post cascade | QA | ACTIVE | KEEP |
| Portfolio | Case studies | 7 | Yes `/portfolio/[slug]` | Yes CMS | sitemap | PortfolioTranslation | QA | ACTIVE | KEEP |
| PortfolioTranslation | Locale overlay | 0 | Ready | Yes | No | Portfolio cascade | — | ACTIVE | KEEP |
| Service | CMS service records (3 cores) | 3 | Sitemap + some lists | No dedicated admin CRUD page found | sitemap | none | `dump_db.mjs` | ACTIVE | REVIEW |
| ContactSubmission | Contact form inbox | 1 | Write via action | Yes contacts | No | none | — | ACTIVE | KEEP |
| CompanyInfo | Company / NAP / branding | 1 | Yes (config) | Yes company + settings | No | none | `update_db_info.mjs` | ACTIVE | KEEP |
| BlogCategory | Blog category vocabulary | 5 | Yes filters | Yes | No | **no FK to Post** (Post.category is string) | — | ACTIVE | KEEP |
| PasswordResetToken | Admin password reset | 0 | `/auth/reset-password` | Yes | No | none | — | ACTIVE | KEEP |
| ProductCategory | Shop collections | 4 | Shop nav | Yes | sitemap slugs | translations, products, links | seed-shop-demo | ACTIVE | KEEP |
| ProductCategoryLink | M2M product↔category | 2 | Shop filters | Yes | No | Product, ProductCategory cascade | seed | ACTIVE | KEEP |
| ProductCategoryTranslation | Category names | 16 | Yes | Yes | No | Category cascade | seed | ACTIVE | KEEP |
| Product | Shop products | 1 DEMO | PDP if PUBLISHED | Yes | sitemap published only | variants, cart, order, wishlist | seed / QA | TEST row + ACTIVE model | CLEAN row / KEEP model |
| ProductTranslation | Product locale/SEO | 4 (demo) | PDP | Yes | No | Product cascade | seed | ACTIVE | KEEP |
| ProductVariant | SKU / color / size / stock | 3 | Cart/PDP | Yes | No | prices, cart, order | seed | ACTIVE | KEEP |
| ProductVariantPrice | Per-locale price | 12 | Checkout | Yes | No | Variant cascade | seed | ACTIVE | KEEP |
| Cart | Guest cart | 2 | Cart | No | cart-preview | items | — | ACTIVE | CLEAN leftover rows |
| CartItem | Cart lines | 2 | Cart | No | cart-preview | Cart/Product/Variant cascade | — | ACTIVE | CLEAN leftover rows |
| Wishlist | Guest wishlist | 1 | Wishlist | No | wishlist-count | items | — | ACTIVE | CLEAN leftover rows |
| WishlistItem | Wishlist lines | 0 | Wishlist | No | wishlist-count | cascade | — | ACTIVE | KEEP |
| Customer | Shop customer accounts | 1 TEST | Account | Orders show email | No | Order, reset tokens | — | TEST row + ACTIVE model | CLEAN row / KEEP model |
| CustomerPasswordResetToken | Customer reset | 0 | Account forgot | No | No | Customer cascade | — | ACTIVE | KEEP |
| Order | Shop orders | 8 TEST | Account / checkout | Yes | receipt, stripe | items, customer, payment notif | — | TEST rows + ACTIVE model | CLEAN rows / KEEP model |
| OrderItem | Order lines | 8 | Account | Yes | receipt | Order cascade, product SetNull | — | TEST rows | CLEAN |
| PaymentNotification | Bank-slip reports | 0 | Checkout bank | Orders | No | Order SetNull | — | ACTIVE | KEEP |
| ShopCoupon | Coupons | 0 | Checkout | Yes | No | none | — | ACTIVE | KEEP |
| ShopPaymentSettings | Bank / PromptPay copy | 1 | Checkout bank | Yes | No | none | seed-shop-demo | ACTIVE | KEEP |
| PageView | Analytics | 917 | Tracker write | Analytics dashboard | `/api/analytics/track`, `/api/admin/analytics` | none | — | ACTIVE | KEEP |
| OutboundClick | Click events | 2 | Tracker write | Analytics | same APIs | none | — | ACTIVE | KEEP |

## Notes

- **Service** has no admin CRUD. Public money pages are hardcoded route files (`/services/seo`, etc.). The 3 DB rows match core offerings and are skipped in sitemap when slug is one of the three hardcoded cores. KEEP rows. REVIEW whether a Service admin is needed later — do not add this round.
- **BlogCategory ↔ Post** is name-string matching, not a relation. Do not migrate this round (data risk).
- **Product.categoryId** (single) and **ProductCategoryLink** (many) both active. Dual system, not duplicate tables.
- **AdminUser.roleId** is an int flag (1 owner / 2 employee), not a Role table. KEEP.

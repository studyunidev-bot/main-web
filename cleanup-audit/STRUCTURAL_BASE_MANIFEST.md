# Structural Base Manifest

What this repository already provides after copy, based on code that exists today.

## Capabilities present

| Area | What exists |
| --- | --- |
| Authentication | NextAuth credentials for AdminUser; admin session guards; customer shop account sessions |
| Admin | `/admins` CMS dashboard (blogs, portfolio, contacts, shop, analytics, employees, company/settings) |
| Database | Prisma + MySQL, 30 models, baseline migration `20260921010000_init` |
| Blog | CRUD, categories, publish/draft, translations, FAQ JSON, SEO fields, public listing/detail |
| Portfolio | CRUD, categories (code map), album JSON, FAQ, SEO, public listing/detail + category landings |
| Products / Shop | Products, variants, locale prices, categories, cart, wishlist, checkout (Stripe + bank), orders, coupons, payment settings |
| Services | DB `Service` rows + hardcoded money pages under `/services/*` |
| FAQ | Admin FAQ builders; public FAQ accordion; FAQPage schema when FAQs exist |
| SEO metadata | `generateMetadata`, canonical/hreflang helpers, OpenGraph/Twitter |
| SEO score | Admin SEO score panel (`src/lib/seo-score.ts`) |
| Rich text | Quill (`react-quill-new`), figure/figcaption, sanitize allowlist |
| Image upload | `/api/admin/upload-image`, WebP via sharp, `/api/images/[...path]` |
| Sitemap | `src/app/sitemap.ts` + `/api/sitemap-index` rewrite |
| Robots | `src/app/robots.ts` |
| Structured data | Organization/WebSite globally; article/product/FAQ where applicable |
| Localization | `th` / `en` / `ja` / `zh` routing + dictionaries |
| Analytics | PageView / OutboundClick + admin analytics dashboard |
| Contact | Public form → ContactSubmission + Resend/LINE notify hooks |
| Legacy redirects | `src/lib/legacy-redirects.ts` via `src/proxy.ts` |
| Security basics | Admin API auth via proxy, HTML sanitize, upload validation, CSP headers |

## Boot without shop demo

```text
migrations + admin:create + SITE_CONFIG fallbacks
```

is enough. `npm run shop:seed` is optional QA demo only — do not run for a clean client base.

## Documented debts carried into a copy

1. Package name still `free-nextadmin-nextjs`
2. `CompanyInfo.smtp*` columns unused by Resend path
3. `Post.category` is a string match to `BlogCategory.name` (no FK)
4. No Service admin CRUD; money pages are hardcoded files
5. Portfolio/Service have no draft/publish flag
6. `/[lang]/workflow` remains HTTP 200 + `noindex` (redirect deferred)
7. Quill table toolbar still deferred
8. `qa/` / `seo/` audit trees are untracked local documentation, not product runtime
9. Brand defaults in `src/lib/site.ts` still say ThaiBusinessMate until edited after copy
10. Root `[lang]/loading.tsx` was removed so `notFound()` can emit real HTTP 404 under Next.js 16 streaming (intentional)

## Dynamic missing-record behavior (verified)

| Route type | Missing / unpublished | HTTP |
| --- | --- | --- |
| Product | missing or DRAFT | 404 |
| Blog | missing or unpublished | 404 |
| Portfolio | missing slug | 404 |
| Service catch-all | unknown slug | 404 |
| Shop category | missing/unpublished | 404 |
| Legacy dotted portfolio | `*.com` slugs | 404 (proxy) |

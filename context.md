# ThaiBusinessMate — Project Context

> Professional context for humans and AI agents working on this repository.  
> **Do not refactor or restructure the system unless explicitly requested.** The current architecture is intentional and production-stable.

---

## 1. Overview

**ThaiBusinessMate (ไทยบิสซิเนสเมท)** is a multi-locale company website + protected admin CMS + ecommerce shop for a software / web / SEO agency based in **Khon Kaen, Thailand**.

Primary public goals:

- Local SEO / AEO / GEO for services such as custom software, websites, and online marketing in Khon Kaen
- Showcase portfolio, services, blog, workflow, and contact conversion
- Serve locales: Thai (`th`), English (`en`), Japanese (`ja`), Chinese (`zh`) under locale-prefixed routes
- Ecommerce: catalog, cart, wishlist, checkout (Stripe + bank transfer), receipts / notifications

Admin goals:

- CRUD for Services, Portfolio, Blogs (incl. categories), Contact submissions
- Company profile / branding data
- Shop: products, categories, orders, coupons, payment settings
- Admin account settings and employee management
- In-app ops guide: `/admins/content/guide`

Production domain default: `https://thaibusinessmate.com`

---

## 2. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js **16** (App Router) — Turbopack production build |
| UI | React **19**, TypeScript, Tailwind CSS 3 |
| Auth | NextAuth v4 (Credentials + bcrypt) for admins; HMAC cookie session for shop customers |
| ORM / DB | Prisma **6** + **MySQL** |
| Validation | Zod |
| Email | **Resend** (`src/server/mail.ts`) |
| Payments | **Stripe** Checkout + bank transfer (manual admin confirm) |
| Notify | Resend receipts; optional **LINE** Messaging API for paid alerts |
| Images | `sharp` → WebP; served via `/api/images/[...path]` |
| Charts / admin UI | ApexCharts, Recharts, Headless UI, SweetAlert2, Toastify |
| PDF / print | Receipts as **HTML** (email + admin print route); `@react-pdf/renderer` / jspdf also in deps for other uses |

Build-time CSS toolchain (`tailwindcss`, `postcss`, `autoprefixer`) and TypeScript/`@types/*` live in **`dependencies`** so Hostinger production installs (`omit=dev`) can still `next build`.

Package name in `package.json` may still reflect an older template (`free-nextadmin-nextjs`). Treat that as legacy naming — do not “fix” it unless asked.

---

## 3. Architecture

```
src/app/[lang]/*          Public marketing + shop pages (locale-aware)
src/app/admins/*          Protected admin dashboard
src/app/auth/*            Sign-in / reset-password
src/app/api/auth/*        NextAuth route handler
src/app/api/images/*      Secure image file serving
src/app/api/stripe/*      Stripe webhook
src/app/api/admin/orders/*/receipt  Admin HTML receipt
src/features/cms/*        Content domain (blog, portfolio, services, contacts)
src/features/shop/*       Ecommerce domain (cart, checkout, orders, coupons)
src/features/company/*    Company info domain
src/features/account/*    Admin account / password flows
src/features/employees/*  Employee CRUD
src/server/*              Shared infra: prisma, auth, uploads, mail
src/components/site/*     Public site chrome (header, footer, forms, etc.)
src/components/shop/*     Cart / PDP / mini-cart UI
src/components/Layouts/*  Admin layout pieces
src/dictionaries/*        th / en / ja / zh copy
src/lib/site.ts           Brand, SEO defaults, absolute URL helpers
src/lib/legacy-redirects.ts WordPress / legacy URL → 301 / 410
src/lib/canonical-host.ts   www / web.* / retired subdomain redirects
src/lib/canonical-query.ts  Strip junk query params on static pages
src/lib/core-pages.ts       Core service + portfolio category paths
src/proxy.ts              Locale routing + auth gate + SEO redirects
scripts/production-build-check.sh  Hostinger-like omit=dev build simulation
```

### Data flow (canonical)

**Public reads**

```
Page → features/*/services → features/*/repositories → Prisma
         ↘ fallback data when DB empty/unavailable (CMS)
```

**Admin writes**

```
Form → Server Action ("use server")
     → requireAdminSession()
     → Zod validation
     → repository / prisma
     → saveImageUpload() when needed
     → revalidatePath / updateTag
```

**Shop checkout (high level)**

```
Cart cookie → createCheckoutSessionAction
  → BANK: AWAITING_TRANSFER + signed bank URL + awaiting-payment email
  → STRIPE: PENDING + Stripe Checkout; cancel → CANCELLED; pay → markOrderPaid
  → On PAID: decrement stock (safe), burn coupon, clear cart, receipt email + optional LINE
```

Preserve this layering. Do not invent a new data-access style for existing domains.

---

## 4. Routes Map

### Public (`src/app/[lang]/...`) — locales: `th` | `en` | `ja` | `zh`

| Path | Purpose |
|------|---------|
| `/[lang]` | Home |
| `/[lang]/about` | About |
| `/[lang]/services` | Services list |
| `/[lang]/services/[slug]` | Service detail |
| `/[lang]/portfolio` | Portfolio hub |
| `/[lang]/portfolio/[slug]` | Portfolio detail |
| `/[lang]/portfolio/custom-software` | Category landing |
| `/[lang]/portfolio/company-website` | Category landing |
| `/[lang]/portfolio/monthly-marketing` | Category landing |
| `/[lang]/blog` | Blog list |
| `/[lang]/blog/[slug]` | Blog detail |
| `/[lang]/workflow` | Workflow / process |
| `/[lang]/contact` | Contact |
| `/[lang]/shop` | Shop catalog |
| `/[lang]/shop/category/[slug]` | Category |
| `/[lang]/product/[slug]` | Product detail (PDP) — `force-dynamic` |
| `/[lang]/cart` | Cart |
| `/[lang]/wishlist` | Wishlist |
| `/[lang]/checkout` | Checkout |
| `/[lang]/checkout/bank` | Bank transfer instructions (`?order=&t=` HMAC) |
| `/[lang]/checkout/success` | Stripe success |
| `/[lang]/checkout/cancel` | Stripe cancel → cancel PENDING order |
| `/[lang]/account/*` | Customer account / orders |
| `/[lang]/how-to-payment` | Payment how-to |
| `/[lang]/terms` / `privacy` / `refund-policy` | Legal |

Default locale: **`th`**. Paths without a locale are redirected (308) to `/th...` via `src/proxy.ts`.

### Auth

| Path | Purpose |
|------|---------|
| `/auth/sign-in` | Admin login |
| `/auth/reset-password` | Password reset |

### Admin (`/admins`)

| Path | Purpose |
|------|---------|
| `/admins` | Dashboard |
| `/admins/content/blogs` | Blog list / CRUD |
| `/admins/content/blogs/categories` | Blog categories |
| `/admins/content/portfolio` | Portfolio CRUD |
| `/admins/content/contacts` | Contact submissions |
| `/admins/content/shop/products` | Products |
| `/admins/content/shop/categories` | Product categories |
| `/admins/content/shop/orders` | Orders (status transitions enforced) |
| `/admins/content/shop/coupons` | Coupons |
| `/admins/content/shop/payment-settings` | Bank / PromptPay / QR |
| `/admins/content/guide` | In-app shop + security guide |
| `/admins/company` | Company info |
| `/admins/employees` | Employees |
| `/admins/pages/settings` | Account settings |

### API

| Path | Purpose |
|------|---------|
| `/api/auth/[...nextauth]` | NextAuth |
| `/api/images/[...path]` | Read uploaded images from `UPLOAD_DIR` |
| `/api/stripe/webhook` | `checkout.session.completed` → `markOrderPaid` |
| `/api/admin/orders/[id]/receipt` | Admin HTML receipt (auth) |

Also: `src/app/sitemap.ts`, `src/app/robots.ts` (rewrites allow `/:lang/sitemap.xml` and `/:lang/robots.txt`).

---

## 5. Domain Models (Prisma)

Defined in `prisma/schema.prisma` (MySQL). There is **no** checked-in `prisma/migrations` folder today — environments typically sync via `prisma db push` (or historical push). Prefer introducing real migrations before relying on `migrate deploy` alone.

### CMS / company

| Model | Role |
|-------|------|
| `AdminUser` | Local admin accounts (`roleId`, bcrypt `passwordHash`) |
| `Post` | Blog posts (slug, SEO fields, `faqJson`, `targetArea`) |
| `Portfolio` | Projects (slug, album JSON, featured, SEO/FAQ) |
| `Service` | Services (slug, icon/image, sortOrder, SEO/FAQ) |
| `ContactSubmission` | Inbound leads (`status` default `PENDING`) |
| `CompanyInfo` | Singleton company/branding record (`id = 1`) |
| `BlogCategory` | Blog categories |
| `PasswordResetToken` | Reset tokens with expiry |

### Shop

| Model | Role |
|-------|------|
| `Product` / `ProductTranslation` / `ProductVariant` / `ProductVariantPrice` | Catalog + per-locale prices |
| `ProductCategory` / links / translations | Categories |
| `Cart` / `CartItem` | Guest cart (`shop_cart_id` cookie) |
| `Wishlist` / `WishlistItem` | Wishlist cookie |
| `Order` / `OrderItem` | Checkout orders |
| `Customer` | Shop customers |
| `ShopCoupon` | Coupons (`usedCount` increments **on PAID only**) |
| `ShopPaymentSettings` | Bank transfer details (singleton) |

SMTP columns on `CompanyInfo` are **deprecated**. Runtime mail uses Resend env vars only.

`PaymentNotification` may exist in schema without an active slip-upload UI — bank confirmation is **manual admin → PAID**.

---

## 6. Auth & Security

### Auth source of truth

- Config: `src/server/auth-options.ts`
- Gate / locale / redirects: `src/proxy.ts` (**not** `middleware.ts`)
- Helpers:
  - `requireAdminSession()` — `role_id` **1 or 2**
  - `requireSuperAdminSession()` — `role_id` **1** only
- Shop customer cookie: `src/features/shop/customer-session.ts` (HMAC with `NEXTAUTH_SECRET`)
- Bank order page token: `src/features/shop/order-access-token.ts` (HMAC of `orderNumber`)

### Proxy behavior (critical)

1. SEO: `/area/KhonKaen` → homepage (301); `www.` host → apex (301)
2. Logged-in admin (`role_id` 1|2): **cannot browse public site**; forced to `/admins`
3. Unauthenticated `/admins/*` → `/auth/sign-in?callbackUrl=...`
4. Missing locale prefix → redirect to `/th...` (308)
5. Security headers set on responses (frame deny, nosniff, referrer; HSTS in production)

### Agent rule

**Never create `src/middleware.ts`.** Next.js in this project uses `src/proxy.ts` for request interception. Duplicating middleware will break routing/auth.

All mutating admin server actions must call `requireAdminSession()` (or super-admin helper when appropriate) before writes.

### Shop hardening (2026-07)

| Rule | Detail |
|------|--------|
| Order status transitions | `src/features/shop/order-status.ts` — e.g. `AWAITING_TRANSFER` → `PAID` → `FULFILLED` only |
| Coupon burn | On `markOrderPaid` / `markOrderPaidById`, not at checkout create |
| Stock | Decrement with `stock >= qty`, then MySQL `GREATEST(0, …)` clamp if raced |
| Bank URL | `/checkout/bank?order=…&t=<hmac>` required or `notFound()` |
| Stripe cancel | `/checkout/cancel?session_id=…` cancels `PENDING` order |
| Cart mutations | Update/remove items must belong to cookie `shop_cart_id` |
| Product PDP | `force-dynamic`; do **not** call `cookies()` in the RSC for wishlist — sync client-side |
| Resend in production | Missing `RESEND_API_KEY` → `success: false` + error log (not silent “ok”) |

---

## 7. CMS & Content

### Feature layout

```
src/features/cms/
  actions/          content.actions.ts, contact.actions.ts
  repositories/     content.repository.ts
  services/          content.service.ts   (React cache() for reads)
  data/              fallback.ts, portfolio-categories.ts
  validation.ts      Zod schemas
  types.ts
  action-states.ts
  utils/slug.ts
```

### Patterns to copy

- Validate with Zod (`validation.ts`) before persist
- Image folders passed to `saveImageUpload(file, folder)` e.g. `"blog"`, `"shop"`, portfolio/services equivalents
- On image replace: delete old file via `deleteImageFile`
- Revalidate related public + admin paths after mutations
- Portfolio may use `updateTag("portfolio")` in addition to `revalidatePath`

### Fallback content

`src/features/cms/data/fallback.ts` supplies seed-like services/portfolio/posts when DB data is unavailable. Home page may also pad blog cards with local fallbacks so the UI always shows a minimum set. Do not remove fallbacks casually.

### Portfolio categories

Static category metadata lives in `src/features/cms/data/portfolio-categories.ts` (ids: `custom-software`, `company-website`, `monthly-marketing`). Category landing pages under `/[lang]/portfolio/...` use this file.

---

## 8. Shop / Checkout

Source of truth: `src/features/shop/**`

| Piece | Location |
|-------|----------|
| Cart / checkout actions | `actions/cart.actions.ts` |
| Admin shop actions | `actions/admin.actions.ts` |
| Repository | `repositories/shop.repository.ts` |
| Status matrix | `order-status.ts` |
| Bank access token | `order-access-token.ts` |
| Stripe helper | `stripe.ts` |
| Paid notify | `order-notify.ts` |
| Receipt HTML | `receipt-template.ts` |
| Wishlist actions | `actions/wishlist.actions.ts` |
| Admin guide UI | `src/app/admins/content/guide/page.tsx` |

### Status flow

```
PENDING ──► CANCELLED | PAID
AWAITING_TRANSFER ──► PAID | CANCELLED
PAID ──► FULFILLED
FULFILLED / CANCELLED ──► (tracking only / terminal)
```

Admin UI only offers allowed next statuses. Setting `PAID` runs stock + coupon + receipts via `markOrderPaidById`.

### Cookies

| Cookie | Purpose |
|--------|---------|
| `shop_cart_id` | Cart |
| `shop_wishlist_id` | Wishlist |
| `shop_customer` | Signed customer session |
| `NEXT_LOCALE` | Locale preference |

---

## 9. i18n

| Piece | Location |
|-------|----------|
| Loader | `src/app/dictionaries.ts` → `getDictionary` |
| Copy | `src/dictionaries/{th,en,ja,zh}.json` |
| Routing | `src/proxy.ts` + `src/lib/locales.ts` (`LOCALES`) |
| Layout | `src/app/[lang]/layout.tsx` |
| Prices | `ProductVariantPrice` per locale → currency (`thb` / `usd` / `jpy` / `cny`) |

When adding public UI text: update **all** locale dictionaries in use (`th`, `en`, `ja`, `zh`).

---

## 10. Uploads & Media

Source of truth: `src/server/uploads.ts` + path helper `src/lib/upload-path.ts`

| Rule | Detail |
|------|--------|
| Allowed types | JPEG, PNG, WEBP |
| Max size | 5 MB (server actions / proxy body also raised to **20mb** for multi-image admin uploads) |
| Storage format | Always converted to **WebP** (quality ~80) |
| Disk location | `UPLOAD_DIR` env (resolved from cwd), else `../images` outside project |
| Public URL | `/api/images/{folder}/{uuid}.webp` |
| Serving | `src/app/api/images/[...path]/route.ts` |
| Turbopack | Prefer `/* turbopackIgnore: true */` around `process.cwd()` in upload path helper to avoid NFT over-tracing |

Do **not** write uploads into `public/` for new production flows. Do not bypass `saveImageUpload` / `deleteImageFile`.

`next.config.mjs` `images.remotePatterns` includes production host, R2, and related CDNs — extend there only when adding a new remote image host. Local `/api/images/...` in galleries often uses `unoptimized` to avoid optimizer failures on Hostinger.

---

## 11. Email

Source of truth: `src/server/mail.ts`

- Provider: **Resend**
- Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`, `SHOP_ADMIN_EMAIL`
- Local / no key: development mock logs (`success: true`)
- **Production** without key: error log + `success: false` (do not treat as sent)

Do not reintroduce SMTP sending from `CompanyInfo` fields.

---

## 12. SEO / AEO / GEO — Agent Rules (Public Site)

This site is a **marketing + local discovery product**. Every public change can affect Google Search Console, AI answer engines, and map/geo surfaces. Treat SEO/AEO/GEO as **non-optional** when editing routes, copy, CMS content, links, or metadata.

### 12.1 Source-of-truth files

| Concern | File(s) |
|---------|---------|
| Brand / absolute URLs | `src/lib/site.ts` |
| Locale routing + **all redirects** | `src/proxy.ts` (**never** add `middleware.ts`) |
| Legacy WordPress URL → new URL (301) / gone (410) | `src/lib/legacy-redirects.ts` |
| `www` / `web.*` / retired subdomains → apex | `src/lib/canonical-host.ts` + `server.js` |
| Strip junk query strings (`?q=`, etc.) on static pages | `src/lib/canonical-query.ts` |
| Core service + portfolio category paths | `src/lib/core-pages.ts` |
| hreflang / canonical helpers | `src/lib/seo.ts` |
| Sitemap | `src/app/sitemap.ts` |
| robots.txt | `src/app/robots.ts` |
| AI crawler hints | `public/llms.txt` |
| Global Organization + WebSite JSON-LD | `src/app/[lang]/layout.tsx` |
| Page-level JSON-LD | detail/list pages (`safeJsonLd`) |

### 12.2 URL & redirect rules (SEO)

- **One canonical host:** `https://thaibusinessmate.com` (apex, no `www`). Redirect logic lives in `proxy.ts` / `server.js`.
- **Locale prefix required** for public pages: `/th/...`, `/en/...`, etc. Paths without locale get **301** to default or geo-resolved locale (not 308).
- **Never break legacy redirects.** Old WordPress URLs (root slugs, `/portfolios/*`, `/our-service`, `/contact-us`, `web.*` paths) must keep **301 → canonical page** or **410 Gone** for dead assets (`/wp-content/*`, `/elementor-hf/*`, `/_next/*` on retired subdomains).
- When GSC shows a old URL, add an explicit mapping in `legacy-redirects.ts` or `canonical-host.ts` — do not rely on locale-prefix alone.
- **Retired subdomains** (`app-*`, etc.): pages → `/th`; static assets → **410**.
- **`web.thaibusinessmate.com`**: map pricing/blog paths in `WEB_SUBDOMAIN_PATHS`. If Cloudflare redirects before origin, fix DNS/Cloudflare **and** keep app rules in sync.

### 12.3 Metadata & indexing rules

- Every public page needs `generateMetadata` with **`canonical`**, sensible **`title` / `description`**, and **`robots`**.
- **Filtered / paginated list URLs** (blog `?q=`, `?category=`, `?page>1`, portfolio `?page>1`): `robots: { index: false, follow: true }` + canonical pointing at clean list URL.
- **Static pages must not accept arbitrary query strings.** Allowed params are defined in `canonical-query.ts`; others get **301** strip in `proxy.ts`.
- **CMS body pages** (blog/portfolio/service detail from DB): use `cmsContentAlternates()` — Thai is canonical + `x-default`; do not claim fake translations for single-language CMS rows.
- **Multilingual static pages** (services list, shop, about): use `localeAlternates()` for full `th/en/ja/zh` hreflang.
- **Core service slugs** (`custom-software`, `company-website`, `monthly-marketing`): must stay in `generateStaticParams`, sitemap `staticPaths`, and `CORE_SERVICE_SLUGS`.

### 12.4 Internal linking (discovery / “Discovered – not indexed”)

Google must **crawl** URLs from strong internal links — sitemap alone is not enough.

- Link core money pages from **homepage**, **footer**, **header**, and **hub pages** (`/services`, `/portfolio`).
- Use helpers in `src/lib/core-pages.ts` for consistent paths — do not invent new slug patterns.
- Portfolio category pages (`/portfolio/custom-software`, etc.) must stay linked from portfolio list nav + header dropdown.
- Footer service links go to **detail pages**, not only `/services`.
- After adding a new public URL, add it to **`sitemap.ts`**, **`public/llms.txt`** (if strategic), and at least one **internal link** from a high-traffic page.

### 12.5 Structured data (AEO + local GEO)

- **AEO:** Keep FAQ blocks + `FAQPage` JSON-LD on service/portfolio/home pages where FAQs exist. Write answers as **complete sentences** suitable for AI extraction (Q&A shape).
- **GEO / local:** Preserve `Organization`, `ProfessionalService` / `LocalBusiness`, geo meta (`geo.region`, `geo.placename`, coordinates), and Khon Kaen / ขอนแก่น copy in metadata + schema. Use `SITE_CONFIG.geo` and `TARGET_AREA_*` env defaults — do not genericize location.
- **WebSite graph** in `layout.tsx`: do not add `SearchAction` / `?q={search_term_string}` unless the site implements that search URL (it currently does not).
- Use `safeJsonLd()` for all JSON-LD injection.
- **`ItemList`** on hub pages should list real URLs (`ensureAbsoluteUrl`) for services/portfolio categories.

### 12.6 Sitemap & robots

- `sitemap.ts`: include all locale variants for static routes; CMS items as Thai canonical + `x-default` unless shop/product (full locales).
- Priority **0.9** for core `/services/{slug}` and `/portfolio/{category}` landing pages.
- `robots.ts` disallow: `/admins/`, `/api/`, `/auth/`, `/_next/`, `/wp-content/`, `/wp-admin/`, `/wp-includes/`, `/elementor-hf/`.
- `next.config.mjs`: `X-Robots-Tag: noindex` on `/_next/static/*` (fonts/chunks are not pages).

### 12.7 When adding or changing CMS content

1. Set **`slug`**, **`metaTitle`**, **`metaDescription`**, and **`targetArea`** when relevant.
2. Revalidate paths (see §18) so sitemap/metadata refresh.
3. If slug changes, add **301** in `legacy-redirects.ts` from old slug.
4. Ensure new detail page is reachable from a **list page** and appears in **dynamic sitemap** loop.
5. Update **`llms.txt`** only for major new sections (do not spam on every blog post).

### 12.8 GSC status quick reference

| GSC status | Meaning | Agent action |
|------------|---------|--------------|
| **Not found (404)** | Broken URL | Add 301 in `legacy-redirects.ts` / `canonical-host.ts` or 410 if permanently dead |
| **Page with redirect** | Expected for `/` → `/th`, `www` → apex | Ensure **single-hop 301**; avoid redirect chains |
| **Alternate page with proper canonical tag** | Parameterized URL; canonical OK | Strip query via `canonical-query.ts` + `noindex` fallback |
| **Crawled – currently not indexed** | Google saw URL, chose not to index yet | Improve internal links + content quality; request indexing after deploy |
| **Discovered – currently not indexed** | In sitemap/links but not crawled | Add homepage/footer links; check robots/canonical blockers |

Operational note: after deploy, team can **Request indexing** in GSC for priority URLs (see `reports/gsc-instructions.md` — update domain to `thaibusinessmate.com`).

Keep local-business targeting (Khon Kaen / ขอนแก่น) consistent with existing copy and `TARGET_AREA_*` env defaults.

---

## 13. Environment Variables

Document **names only** — never commit real secrets.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection (Prisma) |
| `NODE_ENV` | `production` on Hostinger |
| `PORT` / `HOSTNAME` | Host binding (`start` uses `$PORT`, `0.0.0.0`) |
| `NEXTAUTH_URL` | App base URL for NextAuth |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Session/JWT + HMAC for customer cookie & bank order token |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (Stripe redirects, absolute emails/images) |
| `NEXT_PUBLIC_BRAND_NAME` | Brand display override |
| `NEXT_PUBLIC_COMPANY_NAME_TH` / `_EN` | Legal/display names |
| `NEXT_PUBLIC_TELEPHONE` / `NEXT_PUBLIC_EMAIL` | Contact defaults |
| `NEXT_PUBLIC_TAX_ID` | Tax ID |
| `NEXT_PUBLIC_GEO_*` | Geo meta (region, placename, lat/long) |
| `NEXT_PUBLIC_TARGET_AREA_TH` / `_EN` | Local SEO area labels |
| `NEXT_PUBLIC_API` | Optional external API base (token refresh path still present in auth) |
| `UPLOAD_DIR` | Absolute/relative upload root for images (outside deploy tree on Hostinger) |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` / `RESEND_FROM_NAME` | From identity |
| `SHOP_ADMIN_EMAIL` | Admin copy of order emails |
| `STRIPE_SECRET_KEY` | Stripe server key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Documented; hosted Checkout may not need it in current flow |
| `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_ADMIN_TARGET_ID` | Optional paid-order LINE push |

Deploy notes: see `คู่มือ/deploy.txt` and `คู่มือ/upload-images-hosing.txt`. Do not duplicate full deploy runbooks here.

---

## 14. Scripts & Ops

```bash
npm run dev                 # Next.js development server
npm run build               # NODE_ENV=production prisma generate && next build --webpack
npm run build:production    # Hostinger-like: npm ci --omit=dev → build → restore npm ci
npm run start               # next start -H 0.0.0.0 -p ${PORT:-3000}
npm run lint                # next lint
npm run prisma:generate     # Prisma Client
npm run prisma:push         # db push (dev/schema sync — prefer migrations for careful prod workflows)
npm run admin:create        # scripts/create-admin-user.mjs
```

Other scripts: `scripts/dump_db.mjs`, `scripts/update_db_info.mjs`, `scripts/seed-shop-demo.mjs`, `scripts/production-build-check.sh`.

Custom Node entry for some hosts: `server.js` (binds `0.0.0.0` + `PORT`; see deploy guide). Prefer `npm start` over ad-hoc `server.js` unless the host requires the custom entry.

`.npmrc` may contain `legacy-peer-deps=true` for Hostinger peer resolution.

---

## 15. Source of Truth Map

| Concern | File(s) |
|---------|---------|
| Brand / SEO defaults | `src/lib/site.ts` |
| Legacy URL redirects | `src/lib/legacy-redirects.ts` |
| Canonical host / subdomain redirects | `src/lib/canonical-host.ts`, `server.js` |
| Query-string canonicalization | `src/lib/canonical-query.ts` |
| Core service/portfolio paths | `src/lib/core-pages.ts` |
| SEO hreflang helpers | `src/lib/seo.ts` |
| Sitemap / robots / llms | `src/app/sitemap.ts`, `src/app/robots.ts`, `public/llms.txt` |
| Request gate / i18n redirect | `src/proxy.ts` |
| Auth options & session guards | `src/server/auth-options.ts` |
| Prisma client | `src/server/prisma.ts` |
| Schema | `prisma/schema.prisma` |
| Uploads | `src/server/uploads.ts`, `src/lib/upload-path.ts` |
| Mail | `src/server/mail.ts` |
| CMS reads | `src/features/cms/services/content.service.ts` |
| CMS writes | `src/features/cms/actions/*.ts` |
| CMS DB access | `src/features/cms/repositories/content.repository.ts` |
| Shop | `src/features/shop/**` |
| Company | `src/features/company/*` |
| Account / reset | `src/features/account/*` |
| Employees | `src/features/employees/*` |
| Dictionaries | `src/dictionaries/*.json` |
| Admin ops guide | `src/app/admins/content/guide/page.tsx` |
| Next config / CSP / image hosts | `next.config.mjs` |

---

## 16. Agent Working Rules

### Do

- Prefer **minimal, localized diffs** that match existing patterns
- Extend CMS via: types → Zod → repository → service (if read) → server action → UI
- Extend shop via: `features/shop` actions → repository → Zod in `validation.ts`
- Call `requireAdminSession()` on admin mutations
- Revalidate the same path families already used in sibling actions
- Update all locale dictionaries when adding user-facing strings
- Keep public pages under `src/app/[lang]/...`
- Use `saveImageUpload` / `deleteImageFile` for media
- Preserve SEO redirects and locale behavior in `proxy.ts` (legacy + host + query rules)
- When changing public routes or removing pages, update **`legacy-redirects.ts`** (301/410) — never leave old URLs 404
- When adding static public pages, update **`sitemap.ts`**, **`generateMetadata`**, and **internal links** (see §12)
- Keep **`public/llms.txt`** in sync when adding major navigational sections
- Maintain **FAQ + JSON-LD** on pages where AEO answers exist; keep **geo/local schema** on home and service pages
- Use **`core-pages.ts`** slugs for core service/portfolio links — do not hardcode divergent paths
- Keep shop order status transitions in `order-status.ts` (do not let admin skip `PAID`)

### Don’t

- Do **not** create `middleware.ts` (routing/redirects = `src/proxy.ts` only)
- Do **not** remove or weaken legacy redirects without explicit request
- Do **not** add `SearchAction` / sitelinks search markup pointing at non-existent search URLs
- Do **not** index URL variants with junk query params — use `canonical-query.ts` + `noindex`
- Do **not** link footer/header services only to `/services` when a dedicated detail page exists
- Do **not** restructure folders (`features`, `server`, `app`) “for cleanliness”
- Do **not** replace Resend with SMTP
- Do **not** store new uploads only under `public/uploads` for production
- Do **not** remove CMS fallbacks without an explicit request
- Do **not** commit `.env` or secrets
- Do **not** rename package/branding leftovers unless asked
- Do **not** bypass auth checks on server actions
- Do **not** invent a second CMS/shop stack
- Do **not** burn coupons or decrement stock before status `PAID`
- Do **not** remove HMAC `t=` from bank checkout URLs
- Do **not** call `cookies()` in statically intended RSC product pages (use client wishlist sync)

### Safe vs unsafe zones

| Zone | Guidance |
|------|----------|
| Safer | `src/app/[lang]/**`, `src/components/site/**`, dictionary JSON, feature UI under existing admin pages |
| Careful | `src/features/**/actions`, repositories, validation, Prisma schema, shop checkout |
| High risk | `src/proxy.ts`, `src/lib/legacy-redirects.ts`, `src/lib/canonical-host.ts`, `src/lib/canonical-query.ts`, `src/server/auth-options.ts`, `src/server/uploads.ts`, `next.config.mjs`, Stripe webhook, auth API routes |

---

## 17. Change Playbooks

### A. Add a public page

1. Create `src/app/[lang]/<route>/page.tsx` (and metadata)
2. Add nav/links in existing site header/footer components if needed
3. Add copy to `th.json` + `en.json` (+ `ja.json` / `zh.json`)
4. Confirm locale routing still works

### B. Add or extend a CMS field

1. Update `prisma/schema.prisma`
2. Push/migrate DB as appropriate for the environment
3. Update `features/cms/types.ts` + `validation.ts`
4. Update repository save/list/get mapping
5. Update server action FormData parsing
6. Update admin form UI
7. Update public render + `generateMetadata` if SEO-related
8. Revalidate paths

### C. Change UI copy only

- Public: dictionaries and/or page-level content
- Brand defaults: prefer `src/lib/site.ts` / company admin data over hardcoding new constants in many files
- If copy affects SEO titles/descriptions, update `generateMetadata` and dictionary meta fields — not body text alone

### D. Admin-only mutation

1. `"use server"` action in the correct `features/*/actions*`
2. `await requireAdminSession()`
3. Zod validate
4. Persist
5. `revalidatePath` / `updateTag`

### E. Image upload change

- Adjust only `src/server/uploads.ts` (and image API route if path rules change)
- Keep returned URL shape `/api/images/...` unless migrating storage by explicit request

### F. Shop order / payment change

1. Prefer `shop.repository` paid helpers (`markOrderPaid*`) for stock + coupon + notify
2. Update `order-status.ts` if adding statuses
3. Keep webhook + success page idempotent on already `PAID` / `FULFILLED`
4. Update `/admins/content/guide` if admin-facing process changes

### G. SEO / AEO / GEO change (redirect, metadata, discovery)

1. Identify URL type: new page, slug change, legacy WordPress URL, subdomain, or query-param noise
2. Update redirect maps (`legacy-redirects.ts`, `canonical-host.ts`) before or with route changes
3. Set `generateMetadata`: canonical, hreflang, robots, OG/Twitter
4. Add/update JSON-LD (`FAQPage`, `ItemList`, `BreadcrumbList`) where applicable
5. Add **internal links** from homepage, footer, header, or hub page
6. Update `sitemap.ts` (+ `llms.txt` if major section)
7. Verify with `curl -I` (301 chain), view-source (canonical, robots), and `/sitemap.xml`
8. After production deploy: optional GSC **Request indexing** for priority URLs

---

## 18. Cache / Revalidate Cheat Sheet

Mirror existing action behavior when editing related entities:

| After changing | Typical revalidation |
|----------------|----------------------|
| Blog post / category | `/blog`, `/admins/content/blogs`, categories admin path |
| Portfolio | `updateTag("portfolio")`, `/[lang]/portfolio` layout, admin portfolio path |
| Service | `/services`, `/`, `/[lang]` layout, admin services path |
| Contact status | `/admins/content/contacts` |
| Company info | Follow `features/company/actions.ts` (keep existing paths) |
| Cart / checkout | `/{lang}/cart`, `/{lang}/shop`, `/{lang}/checkout` |
| Orders | `/admins/content/shop/orders`, customer account order paths |

When unsure, copy the revalidate block from the nearest sibling action in the same file.

---

## 19. Known Legacy / Debt (do not “drive-by fix”)

- `README.md` still describes a generic “Start Web” template in places; this `context.md` is the accurate agent-facing source
- `package.json` `name` may not match the brand
- `CompanyInfo` SMTP fields exist but are unused
- Auth still contains optional external `NEXT_PUBLIC_API` refresh helpers; local admin auth is Prisma + bcrypt
- Some public pages call `contentRepository` directly; others use `content.service` — both exist; prefer **service** for new public reads, but do not mass-migrate old pages unsolicited
- No Prisma migration history in repo — Hostinger must sync schema carefully (`db push` or introduce migrations)
- Deploy doc may mention `output: "standalone"`; `next.config.mjs` may not enable it — follow live Hostinger Node start command
- In-memory rate limits are per-process (weak under multi-instance)

---

## 20. Verify Checklist (after changes)

- [ ] Targeted page(s) render for locales in use when public
- [ ] Admin still blocked when logged out; public still blocked when admin logged in
- [ ] Mutations fail closed without session
- [ ] Images still load via `/api/images/...` after upload changes
- [ ] Shop: bank URL requires `t=`; coupon unused until PAID; cannot FULFILLED without PAID
- [ ] No new secrets in git
- [ ] `npm run build` (and ideally `npm run build:production`) when touching deps / Hostinger-sensitive paths
- [ ] Did not add `middleware.ts` or reshape architecture
- [ ] Public SEO: canonical + robots correct; legacy URLs still redirect; new URLs in sitemap + internally linked (§12)
- [ ] AEO/GEO: FAQ/schema/geo meta preserved when touching home, services, or layout JSON-LD

---

## 21. Related Docs

| Doc | Use |
|-----|-----|
| `context.md` §12 | **SEO / AEO / GEO agent rules** (redirects, metadata, internal links, schema) |
| `README.md` | Quick local setup (may lag brand naming) |
| `reports/gsc-instructions.md` | GSC request-indexing workflow for `thaibusinessmate.com` |
| `คู่มือ/deploy.txt` | Hostinger / VPS deploy |
| `คู่มือ/upload-images-hosing.txt` | Production image storage notes |
| `/admins/content/guide` | In-app shop ops + security guide for admins |
| `public/llms.txt` | AI crawler navigation hints (AEO) |
| `reports/*` | Other GSC / SEO reports (operational) |

---

*Last aligned with repository structure: 2026-07-23 (SEO/AEO/GEO redirects, canonical host, internal linking, agent rules §12). Update this file when architecture or agent rules change — not for routine content edits.*

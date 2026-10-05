# ThaiBusinessMate SEO / AEO / GEO-GEN Full Audit

**Scope:** `/th` public site  
**Production:** https://thaibusinessmate.com/th (READ ONLY)  
**Local DB:** `db_tbm_local` @ `127.0.0.1` (clone of production; source of truth for content records)  
**Audit date:** 2026-09-20  

Search Volume: N/A — external keyword dataset required

GEO-GEN in this report = Generative Engine Optimization  
LOCAL = Geographic / Local SEO for ขอนแก่น

---

## 1. Executive Summary

The `/th` site already has a strong commercial architecture: three money pages, six marketing solution pages, blog, portfolio, and LocalBusiness schema. The main SEO problem was not missing pages. It was **keyword ownership**. Homepage, About, layout fallback titles, and several portfolio/blog H1s competed for the same commercial clusters as `/th/services/company-website`, `/th/services/custom-software`, and `/th/services/seo`.

CMS already stored FAQ JSON and HTML content, but the admin FAQ builder was disconnected from blog/portfolio forms, there was no SEO score, blog category chips ignored URL state, and article CSS did not cover tables/captions/focus.

Stage B implemented locally:

- FAQ builder with add / edit / remove / reorder
- Deterministic SEO Score (100 points, no keyword density)
- TextEditor image upload with URL storage, alt, caption, optional width/height
- Article renderer styles for hierarchy, tables, figures, code, focus
- `/blog` category active state from `searchParams.category`
- Homepage/About titles refocused away from money-page clusters
- Fake auto-generated portfolio scores removed

---

## 2. Environment Verification

```text
Environment: LOCAL DEVELOPMENT
Host: MacBook-Air-khxng-nattawut.local
Database Host: 127.0.0.1
Database Name: db_tbm_local
Database Type: MySQL
Framework: Next.js App Router
Next.js Version: 16.2.9
React Version: 19.1.0
Node Version: v22.14.0
ORM: Prisma 6.19.0
Production URL: https://thaibusinessmate.com
Local URL: http://localhost:3000
Current Git Branch: main
```

Active `DATABASE_URL` points at `127.0.0.1:3306/db_tbm_local`. Production MySQL is commented out in `.env`. No production writes were made.

---

## 3. Database Verification

Real Prisma models that create public content:

| Model | Public URL pattern | Status field | Content format |
| --- | --- | --- | --- |
| `Post` + `PostTranslation` | `/th/blog/[slug]` | `published` | **HTML** (Quill) |
| `Portfolio` + `PortfolioTranslation` | `/th/blog` no; `/th/portfolio/[slug]` | none (all listed) | **HTML** |
| `Service` | `/th/services/[slug]` (3 rows; landings are hardcoded) | none | **HTML** |
| `BlogCategory` | filter via `/th/blog?category=NAME` | n/a | name/slug |
| `Product` + translations | `/th/product/[slug]` | `status=PUBLISHED` | HTML description |
| `ProductCategory` | `/th/shop/category/[slug]` | `published` | name |
| `CompanyInfo` | identity on every page | n/a | plain fields |

No separate Page / Landing Page / Case Study models. Portfolio rows act as case studies. FAQ is `faqJson` TEXT JSON `[{question,answer}]` on Post, Portfolio, Service, ProductTranslation.

Counts from local DB:

- Posts: 12 published / 0 drafts
- Post translations: 8
- Portfolios: 7 (0 translations)
- Services: 3 (`custom-software`, `company-website`, `monthly-marketing`)
- Blog categories: 5
- Products: 1 published (`spider-man-backpack`)
- Product categories: 4 published

Company record: ไทยบิสซิเนสเมท, เมืองขอนแก่น, 085-003-2649

---

## 4. URL Inventory

Application public `/th` routes come from `src/app/[lang]/...`. Dynamic URLs come from DB slugs. Sitemap is `src/app/sitemap.ts` exposed as `/sitemap/th.xml`.

### Coverage of `/th` HTML pages

```text
Application Routes: 60
Database URLs: 27
Sitemap URLs: 47
Crawler URLs: 76
Canonical Targets: 47
Internal Link URLs: /th HTML pages all crawled

Unique /th HTML URLs: 76
Audited: 76
Skipped: 0 /th HTML pages

Coverage: 100% of discovered /th HTML URLs
```

Non-HTML / non-`/th` URLs (assets, `/en` `/ja` `/zh`, fonts, `/api/images`) were excluded from the `/th` master set. They are not Thai indexable pages.

`/th/workflow` exists as a route and redirects in source to `/th#system-comparison`. Production crawl returned 200 with empty H1 (deploy may lag local redirect). Correct behavior: do not sitemap it.

---

## 5. Crawl Coverage

Internal crawl started from application routes + sitemap + DB URLs, then followed `/th` links to depth 3.

Discovered extra `/th` URLs:

- Blog filters `/th/blog?category=...` and `?page=2` (already `noindex,follow`)
- Shop filters `/th/shop?category=...` (`noindex,follow`) while canonical category URLs `/th/shop/category/[slug]` are indexable
- Soft-missing portfolio slugs such as `/th/portfolio/aptaglabel.com` (200 + noindex, no H1) — leftover internal links / legacy slugs

---

## 6. Indexability

From production GET of 76 `/th` URLs:

- HTTP 200: 76
- 301/302/308 chains: 0 in this crawl
- 404/410/5xx: 0
- noindex utility: account, cart, checkout, wishlist
- noindex filters: blog/shop query URLs
- noindex missing portfolio slugs: 6 domain-like slugs
- Indexable content set ≈ sitemap 47 + homepage

Issues:

- Missing portfolio slugs are **soft 404** (200 + noindex + “ไม่พบผลงาน”) instead of HTTP 404
- `/th/checkout/cancel` and `/th/checkout/success` had empty robots meta in crawl
- `/th/workflow` had empty robots meta

---

## 7. Technical SEO

- Canonicals on indexable marketing pages are absolute `https://thaibusinessmate.com/th/...`
- Blog/CMS detail pages use Thai canonical even from other locales (`cmsContentAlternates`)
- TH/EN marketing pages use `thaiEnglishAlternates`; JA/ZH are not claimed except shop/legal
- Title template previously appended `| ThaiBusinessMate` on titles that already included the brand → duplicate brand. Local layout template now uses `%s`
- `robots.txt` allows `/`, disallows `/admins/`, `/api/`, `/auth/`, leftover WordPress paths
- Sitemap index: `/sitemap.xml` → `/sitemap/{th,en,ja,zh}.xml`

---

## 8. Metadata

### Homepage (`/th`)
- Before: title targeted `รับทำเว็บไซต์ เขียนโปรแกรม และการตลาดออนไลน์ ขอนแก่น`
- H1 already brand/positioning: `คู่คิดทางธุรกิจ เพื่อผลลัพธ์ที่เหนือกว่า ในยุคดิจิทัล`
- After (local dictionaries): brand + broad category + ขอนแก่น, not the three money keywords

### Money pages (keep as owners)

| URL | Title / H1 intent |
| --- | --- |
| `/th/services/company-website` | รับทำเว็บไซต์ ขอนแก่น |
| `/th/services/custom-software` | รับเขียนโปรแกรม ขอนแก่น |
| `/th/services/monthly-marketing` | รับทำการตลาดออนไลน์ ขอนแก่น |
| `/th/services/seo` | รับทำ SEO ขอนแก่น |
| `/th/services/local-seo` | รับทำ Local SEO ขอนแก่น |
| `/th/services/social-media` | รับดูแลเพจ ขอนแก่น |
| `/th/services/online-ads` | รับยิงแอด ขอนแก่น |
| `/th/services/video-content` | รับตัดต่อคลิป ขอนแก่น |
| `/th/services/content-marketing` | รับทำคอนเทนต์ ขอนแก่น |

### Other metadata issues

- Shop product title `asdasdas` on `/th/product/spider-man-backpack`
- Several blog/portfolio titles already unique; H1 sometimes more commercial than title
- Utility pages inherited truncated default title `...ออกแบ`

---

## 9. Keyword Research

Seeds validated against on-page language and service architecture. No Search Console export was available in the repo.

Search Volume: N/A — external keyword dataset required

Primary commercial clusters for ขอนแก่น:

1. รับทำเว็บไซต์ ขอนแก่น / บริษัทรับทำเว็บไซต์ ขอนแก่น
2. รับเขียนโปรแกรม ขอนแก่น / พัฒนาระบบ ขอนแก่น / CRM ERP
3. รับทำการตลาดออนไลน์ ขอนแก่น
4. รับทำ SEO ขอนแก่น
5. รับทำ Local SEO ขอนแก่น / Google Maps
6. รับดูแลเพจ / รับยิงแอด / รับทำคอนเทนต์ / รับตัดต่อคลิป ขอนแก่น

Informational:

- SEO AEO GEO คืออะไร
- โครงสร้างเว็บไซต์
- ตัวอย่างเว็บไซต์วัด / ทนาย / ทัวร์ / เกม
- ทำไมโปรแกรมช้า

Do not treat current on-page keywords as final demand.

---

## 10. Search Intent

| Keyword | Intent | Best owner |
| --- | --- | --- |
| ThaiBusinessMate / บริษัทซอฟต์แวร์ ขอนแก่น | Navigational + broad | `/th` |
| รับทำเว็บไซต์ ขอนแก่น | Local Transactional | `/th/services/company-website` |
| รับเขียนโปรแกรม ขอนแก่น | Local Transactional | `/th/services/custom-software` |
| รับทำการตลาดออนไลน์ ขอนแก่น | Local Transactional | `/th/services/monthly-marketing` |
| รับทำ SEO ขอนแก่น | Local Transactional | `/th/services/seo` |
| Local SEO ขอนแก่น | Local Transactional | `/th/services/local-seo` |
| SEO AEO GEO คืออะไร | Informational | `/th/blog/seo-aeo-geo-monthly-service` |
| ตัวอย่างเว็บไซต์วัด | Informational | `/th/blog/whatisneededtocreateatemplewebsite` |
| ผลงานทำเว็บ | Commercial Investigation | `/th/portfolio/company-website` |

---

## 11. Keyword Ownership

See `seo/master-keyword-map.csv`.

Rule applied:

> ONE PRIMARY COMMERCIAL KEYWORD CLUSTER → ONE OWNER MONEY PAGE

Homepage role: Brand + broad digital/software category + ขอนแก่น.  
Specific commercial intent stays on service URLs.

---

## 12. Cannibalization

See `seo/cannibalization-report.md`.

Highest severity before the dictionary fix:

- Homepage title vs website/software/marketing money pages
- About H1 vs the same money pages
- Portfolio SEO case studies vs `/th/services/seo`
- Two overlapping SEO/AEO/GEO blogs
- Two overlapping home-builder SEO blogs

---

## 13. Services Architecture

Hardcoded landings (also 3 DB rows with the same slugs):

```text
/th/services
├── company-website     Money: รับทำเว็บไซต์ ขอนแก่น
├── custom-software     Money: รับเขียนโปรแกรม ขอนแก่น
├── monthly-marketing   Money: รับทำการตลาดออนไลน์ ขอนแก่น
├── seo
├── local-seo
├── social-media
├── online-ads
├── video-content
└── content-marketing
```

Child marketing pages are valid if they keep specific intents and the parent stays the umbrella retainer offer. Overlap is the parent title listing every child channel.

No extra DB services beyond those three slugs.

---

## 14. Blog Architecture

Filter URL: `/th/blog?category={category.name}` kept (no structural change).  
Filtered views are `noindex,follow` — correct.

Active state bug: “ทั้งหมด” was always styled active. Source of truth is `searchParams.category`. Fixed to a single URL-driven state, with `aria-current="page"`.

Blog actions (no deletes):

| Slug | Action |
| --- | --- |
| seo-aeo-geo-monthly-service | KEEP definition |
| stop-losing-customers-seo-aeo-geo | UPDATE / REFOCUS |
| google-ranking-home-construction | KEEP |
| seo-advantages-for-home-builders | UPDATE supporting |
| thatdonotadoptthesoftware | KEEP |
| why-software-gets-slow-and-how-to-fix | KEEP |
| website-structure-issues-and-solutions | KEEP |
| lawyer-website-guide | KEEP, link to website money page |
| whatisneededtocreateatemplewebsite | KEEP |
| how-to-design-tour-website | KEEP |
| game-website-design-guide | KEEP |
| whatisthepointofhavingawebsiteif | UPDATE, link to website/software owners |

---

## 15. Content Clusters

Actual clusters from current URLs:

1. Website Development
2. Custom Software / systems
3. Monthly digital marketing
4. SEO / AEO / GEO-GEN / Local SEO
5. Industry website examples (วัด, ทนาย, ทัวร์, เกม)
6. Brand / About / Contact
7. Shop (demo quality — do not expand)

---

## 16. Internal Linking

Target:

```text
Homepage → Service Hub → Money Page → Case Study → Supporting Blog
Blog → Money Page
Portfolio → matching Service
Service → Portfolio + supporting Blog
```

Gaps:

- Blogs often explain a service commercially without a clear money-page CTA/link in the extracted HTML
- Portfolio SEO items use money-page H1s instead of “กรณีศึกษา”
- Legacy `/th/portfolio/{domain}` links 200-noindex

See `seo/internal-link-map.csv` for recommended blog→service and portfolio→service links.

---

## 17. AEO

Strengths:

- FAQ JSON on most blogs
- FAQPage schema only when `faqs.length > 0` on blog/portfolio/product
- Question-style titles on several articles
- FAQ accordion now uses `<details>` so answers stay in HTML

Gaps:

- Admin could not edit blog/portfolio FAQ (builder existed but was unused)
- Some service landings use hardcoded FAQs (visible + schema) — acceptable if they match on-page copy
- Product FAQ schema exists on a demo product

---

## 18. GEO-GEN

Entity clarity is decent: Organization, LocalBusiness, Khon Kaen coordinates, service area Isan.

Citation-friendly passages exist on service landings. Weaknesses:

- Dates on blogs are present (`createdAt`)
- Portfolio case studies sometimes read like service ads, which confuses entity/role
- Homepage previously stuffed three commercial entities into one title

---

## 19. Local SEO

Primary geography: ขอนแก่น. Evidence in `CompanyInfo` and `SITE_CONFIG`.

Do not generate extra city landings. Some blog `targetArea` values list กรุงเทพ/นนทบุรี because of a home-builder example — that is article context, not a new market expansion.

NAP appears in schema. Google Maps URL is stored on company.

---

## 20. Structured Data

Common graph: Organization, WebSite, PostalAddress, GeoCoordinates.

Per type:

- Services: Service + BreadcrumbList + often FAQPage
- Blog posts: BlogPosting + FAQPage when FAQs exist
- Portfolio: CreativeWork + FAQPage
- Contact: LocalBusiness + ContactPage + FAQPage
- Product: Product + Offer + FAQPage

Issues:

- Global Organization JSON-LD on every page (including noindex utilities)
- Missing portfolio pages still emit Organization/WebSite
- No fake Review/AggregateRating schema found in crawl types
- Product `asdasdas` title would emit weak Product name if indexed

---

## 21. FAQ System

Architecture kept: JSON field `faqJson`. No new table.

Admin: reusable `FaqBuilder` on blog, portfolio, product.  
Frontend: visible accordion from the same JSON.  
Schema: FAQPage pushed only when visible FAQs exist.

---

## 22. CMS SEO Score

Rule-based, deterministic, sums to 100:

| Group | Max |
| --- | ---: |
| Metadata | 20 |
| Content | 30 |
| Keyword / Intent | 20 |
| Internal Links | 10 |
| Images | 10 |
| FAQ / AEO | 10 |

Does not score keyword density or raw word-count stuffing.

---

## 23. TextEditor Image Upload

Editor: `react-quill-new` (kept).  
Upload: `/api/admin/upload-image` (admin session, role 1).  
Storage: `/api/images/blog/{uuid}.webp` via `saveImageUpload` (MIME, magic bytes, 5MB, sharp, no base64).  
New: alt prompt, caption → `<figure><img alt><figcaption>`, width/height when sharp provides them, paste/drop upload.

---

## 24. Frontend Article UX/UI

`CmsHtml` + `.rich-text-content` now covers headings, lists, links+focus, images, figure/figcaption, tables with horizontal scroll, code/pre. Content remains SSR + sanitized allowlist.

---

## 25. Blog Category Active State

Source of truth: `searchParams.category` on the server page.  
All = no category param.  
Refresh and back/forward follow the URL.  
`aria-current="page"` on the active chip.  
URL structure unchanged: `/blog?category=...`

---

## 26. Canonical

Indexable `/th` URLs generally self-canonical over HTTPS apex host.  
Filtered blog/shop query URLs canonical back to the hub (good) and are noindex.

---

## 27. Hreflang

Locales in code: `th`, `en`, `ja`, `zh`.  
Marketing/CMS bodies are TH/EN; hreflang for those pages is th/en/x-default.  
Shop/legal include all four locales.  
CMS article canonical prefers Thai.

---

## 28. Robots

Production `robots.txt` matches `src/app/robots.ts`. AI bots listed. Sitemap pointers are locale files, not localhost.

---

## 29. Sitemap

`/sitemap.xml` is an index of locale sitemaps.  
Thai sitemap matches DB posts/portfolios/services/shop URLs plus static landings.  
Not included (correct): account, cart, checkout, wishlist, `/workflow`, noindex filters.  
Shop demo URLs **are** included — quality risk.

---

## 30. SSR / Crawlability

Titles, H1, JSON-LD, and article HTML are present in raw HTTP responses (production crawl). FAQ answers are in HTML via `<details>`.

---

## 31. Image SEO

- Many CMS images use `/api/images/...` WebP
- Cover images generally have alt from title
- Missing alt counts appeared on blog hub decorative images, contact, some product images
- Editor can now set alt/caption going forward

---

## 32. E-E-A-T

Present: About, Contact, phone, address, portfolio, privacy, terms, refund.  
Weak: named authors (Team only), demo shop product, unverifiable “200+ ธุรกิจ” / “PageSpeed 100%” claims in copy.  
No fabricated address/reviews were added.

---

## 33. Content Duplication

- Home vs money pages: title overlap (addressed in dictionaries)
- Service vs service: parent monthly-marketing vs children
- Blog vs blog: two SEO/AEO/GEO articles; two home-builder SEO articles
- Portfolio vs service: SEO case studies vs `/th/services/seo`
- Shop vs brand: off-topic backpack product

---

## 34. Keyword Gap

See `seo/content-gap.md`. Prefer expanding owners over new URLs.

---

## 35. Final Site Architecture

```text
/th
├── about
├── contact
├── services
│   ├── company-website
│   ├── custom-software
│   ├── monthly-marketing
│   ├── seo
│   ├── local-seo
│   ├── social-media
│   ├── online-ads
│   ├── video-content
│   └── content-marketing
├── portfolio
│   ├── company-website
│   ├── custom-software
│   ├── monthly-marketing
│   └── [7 case-study slugs]
├── blog
│   └── [12 article slugs]
├── shop
│   └── category/[4 slugs]
├── product/spider-man-backpack
├── privacy
├── terms
├── refund-policy
└── how-to-payment
```

---

## 36. Regression Test

```text
TYPECHECK: npx tsc --noEmit — pass
BUILD: npm run build — pass
LINT: npm run lint (`next lint`) fails in Next.js 16 because the CLI treats `lint` as a project directory. ESLint config-next is installed; TypeScript check was used instead.
```

Local verification:

- Homepage title is brand + broad category, H1 unchanged
- `/th/blog` “ทั้งหมด” has `aria-current="page"`
- `/th/blog?category=SEO+%2F+AI+Search` activates only that chip, robots `noindex, follow`, articles filtered
- Article `/th/blog/seo-aeo-geo-monthly-service` SSR includes H1, H2, `.rich-text-content`, 3 FAQ `<details>`, FAQPage JSON-LD, canonical HTTPS
- Existing slugs unchanged
- Production was not written or deployed

Existing blog image files under `UPLOAD_DIR` may 404 locally if the image disk was not cloned; that is environment, not a URL change.

---

========================================
THAIBUSINESSMATE FINAL AUDIT
========================================

Unique /th URLs: 76 HTML pages in MASTER_URL_SET
Audited URLs: 76
Coverage: 100% of discovered /th HTML pages

Indexable: 50 (query/noindex excluded from this count)
Noindex: utility + filtered blog/shop + missing portfolio slugs
Redirect: `/th/workflow` intended 307 to homepage hash (source); production crawl still 200
404: 0 in crawl (soft 404s exist as 200+noindex)
5xx: 0

Primary Keyword Owners: 9 money/solution pages
Cannibalization Groups: 5 documented
Orphan Pages: 3 utility (`/checkout/success`, `/checkout/cancel`, `/workflow`)
Broken Internal Links: 6 legacy `/th/portfolio/{domain}` soft 404s
Canonical Issues: filtered URLs canonical to hub (OK)
Schema Issues: global Organization on noindex utilities; demo Product
Metadata Issues: demo product title `asdasdas`; some CMS metaTitles omit brand (sitename still in OG)
Content Gaps: CRM/ERP supporting blog optional; do not create city landings

SEO: architecture mapped, homepage/About refocused locally
AEO: FAQ builder wired; visible FAQ + FAQPage from same JSON
GEO-GEN: entity/service definitions exist; case studies still need H1 refocus in CMS
LOCAL SEO: ขอนแก่น NAP + LocalBusiness present

CMS FAQ: implemented (add/edit/remove/reorder)
SEO SCORE: implemented, 100-point rule-based
TEXTEDITOR IMAGE UPLOAD: existed; alt/caption/figure/paste/drop added
ARTICLE UX/UI: CmsHtml + expanded typography
BLOG CATEGORY ACTIVE STATE: URL searchParams source of truth

DATABASE VERIFIED: db_tbm_local
ROUTES VERIFIED: src/app/[lang]
SITEMAP VERIFIED: /sitemap/th.xml (47 loc)
INTERNAL CRAWL VERIFIED: 76 /th HTML URLs

BUILD: pass
TYPECHECK: pass
LINT: next lint CLI incompatible here; tsc pass

========================================

---

## 37. Priority Fix Plan

| Priority | Issue | URLs | SEO Impact | Effort | Recommended Action |
| --- | --- | ---: | --- | --- | --- |
| P0 CRITICAL | Homepage/About competing money keywords | `/th`, `/th/about` | High | Low | REFOCUS titles (done locally) |
| P0 CRITICAL | Money-page ownership | 3 service URLs | High | n/a | KEEP OWNERS |
| P1 HIGH | Portfolio SEO H1s act like money pages | 4 portfolio URLs | High | Medium | REFOCUS in CMS (local DB content not rewritten) |
| P1 HIGH | Soft 404 portfolio slugs | 6 URLs | Medium | Low | Return HTTP 404; metadata noindex added |
| P1 HIGH | Blog category active state | `/th/blog` | UX/SEO UX | Low | Done |
| P1 HIGH | Admin FAQ disconnected | blog/portfolio CMS | AEO | Low | Done |
| P2 MEDIUM | SEO score missing | CMS | Workflow | Low | Done |
| P2 MEDIUM | Article typography/tables/captions | blog/portfolio/service HTML | UX | Low | Done |
| P2 MEDIUM | Brand duplication in title template | many | Medium | Low | Done |
| P2 MEDIUM | Demo product in sitemap | `/th/product/spider-man-backpack` | Medium | Low | NOINDEX or replace catalog |
| P3 LOW | Unverifiable PageSpeed 100% / 200+ claims | several landings | Trust | Medium | Remove or evidence later |
| P3 LOW | Blog category slug `ตัวอย่างเว็บไซต์` | taxonomy | Low | Low | Keep; optional later slug normalize without changing filter URL |

---

## Claims flagged (audit only unless noted)

- “PageSpeed 100%”
- “200+ ธุรกิจ”
- Auto-generated portfolio metric tiles (removed locally; they were not real measurements)
- “รับประกันอันดับ” appears in an SEO service FAQ as a denial, which is acceptable if visible

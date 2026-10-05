# FINAL COPY-REPO GATE

Date: 2026-09-21  
Verified against local only. Production not modified. Not committed. Not deployed.

```text
============================================
THAIBUSINESSMATE COPY-REPO GATE
============================================

PRODUCTION MODIFIED: NO
COMMITTED: NO
DEPLOYED: NO

PRISMA MODELS: 30
FRESH DB MIGRATION: PASS (db_tbm_structure_test → 31 tables incl. _prisma_migrations)
EXISTING DB: PASS (db_tbm_local up to date; Post 12 / Portfolio 7 / Service 3 / AdminUser 1)

TEST/DEMO DATA: CLEAN (no [TEST]/[QA]/asdasdas/spider-man/aaaa leftovers)
DEAD PACKAGES: cleaned in prior round; no further removals this gate
DEAD CODE: prior cleanup + removed [lang]/loading.tsx (required for real 404)
SOFT 404: FIXED
  - Root cause: Next.js 16 streaming via [lang]/loading.tsx + Suspense/useSearchParams
    committed HTTP 200 before notFound()
  - Fix: remove [lang]/loading.tsx; AnalyticsTracker reads search from window;
    keep force-dynamic + notFound() on DB detail routes; proxy 404 for dotted portfolio

DYNAMIC MISSING RECORD → 404: PASS
  Product / Blog / Portfolio / Service catch-all / Shop category → HTTP 404
PRODUCT DELETE CACHE INVALIDATION: PASS
  Create PUBLISHED → 200
  Unpublish DRAFT → 404 (live DB read; force-dynamic)
  Delete row → 404
  Admin deleteProductAction still revalidatePath(/product/[slug]) + /shop

BUILD: PASS (Next.js 16.3.3)
TYPECHECK: PASS

SEO OWNER REGRESSION: PASS (all 10 money paths unchanged titles/H1/canonical)
CANONICAL: production host on owners (https://thaibusinessmate.com/...)
ROBOTS: index,follow on service money pages; home uses default metadata
SITEMAP: still generated; published-only products/posts

COPY BOOTSTRAP:
  npm install
  cp .env.example .env  # set DATABASE_URL + secrets
  npx prisma migrate deploy
  npm run admin:create -- <user> <password>
  npm run build
ENV EXAMPLE: updated (optional brand overrides + ADMIN_NOTIFY_EMAIL documented; no secrets)
ADMIN CREATE: npm run admin:create present

DOCUMENTED DEBT: see STRUCTURAL_BASE_MANIFEST.md (non-blocking)

FINAL STATUS:
STRUCTURE CLEAN WITH DOCUMENTED NON-BLOCKING DEBT
============================================
```

## Cause analysis (product soft-404)

| Layer | Finding |
| --- | --- |
| `generateStaticParams` | Was present; removed from force-dynamic detail routes |
| `revalidate` / ISR | Detail routes use `dynamic = "force-dynamic"` (not ISR) |
| `unstable_cache` | Only shop categories tag; not product-by-slug |
| Root cause | `src/app/[lang]/loading.tsx` started streaming → HTTP 200 locked before `notFound()` |

## /th URL delta vs prior 76

```text
Original HTML-200 count (prior QA): 76
Removed intentionally:
  - 6 dotted legacy portfolio URLs → real HTTP 404
  - 1 demo product row removed (spider-man-backpack) → now real HTTP 404
Added: 0
Current valid indexable money/CMS set: unchanged owners + published blog/portfolio
404: missing DB slugs + 6 dotted portfolios + deleted demo product
Redirect: legacy WordPress map unchanged
Noindex: /workflow, account/cart/checkout utilities unchanged
```

## Evidence scripts

- `cleanup-audit/create-test-product-delete-404.mjs` (local gate; self-cleaning)
- Production runtime used for verification: `PORT=3010 npm run start` after `npm run build`

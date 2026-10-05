# System Architecture

**Stack (actual):** Next.js (App Router) · React · TypeScript · Prisma · MySQL · NextAuth · Zod · Tailwind

---

## High-level diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                     Clients (Browser)                        │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│ Public Frontend           │   │ Admin (/admins, /auth)      │
│ src/app/[lang]/*          │   │ CMS · Shop · Settings       │
│ Marketing · Blog · Shop   │   │ NextAuth session            │
└─────────────┬─────────────┘   └──────────────┬──────────────┘
              │                                │
              │         Server Actions / API    │
              ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│ Features layer                                               │
│ company · cms · shop · account · employees · analytics       │
│ Validation (Zod) · Services · Repositories                   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌──────────────────┐    ┌─────────────────┐    ┌──────────────┐
│ Prisma Client    │───▶│ MySQL           │    │ Media files  │
│ schema.prisma    │    │ CompanyInfo etc │    │ upload/serve │
└──────────────────┘    └─────────────────┘    └──────────────┘
```

---

## Frontend

- Locale-prefixed App Router tree: `src/app/[lang]/...`
- Site chrome: header/footer/components under `src/components/site`
- Public capabilities: marketing, services, blog, portfolio, shop, account, legal
- Dynamic detail routes use `notFound()` for missing/unpublished content

## Admin

- Routes under `src/app/admins/...`
- Auth pages under `src/app/auth/...`
- Mutations primarily via Server Actions in `src/features/*/actions*`
- Selected REST routes under `src/app/api/admin/...`

## Server Actions / API

| Kind | Examples |
| --- | --- |
| Server Actions | `updateCompanyInfoAction`, CMS `content.actions`, shop admin/customer actions |
| Auth API | `/api/auth/[...nextauth]` |
| Upload | `/api/admin/upload-image` |
| Images | `/api/images/[...path]` |
| Analytics | `/api/analytics/track`, `/api/admin/analytics` |
| Shop helpers | cart-preview, wishlist-count |
| Payments | `/api/stripe/webhook` |
| Sitemap helper | `/api/sitemap-index` |

## Authentication

- **Admin:** NextAuth credentials against `AdminUser`
- **Customer:** shop account session/token flows (`Customer`, reset tokens)
- Protected admin mutations require authenticated session (baseline verified)

## Media

- Authenticated upload → stored paths
- Public/served via images API and/or `public/` static assets
- Company logo may be path or absolute URL (`CompanyInfo.logoUrl`)

## Caching

- `getCompanyConfig()` cached with tag `COMPANY_CONFIG_TAG` (`company-config`), revalidate window as coded
- Admin company save: `updateTag` + `revalidatePath("/", "layout")`
- CMS/shop actions call `revalidatePath` / `updateTag` for affected surfaces
- Raw DB edits without invalidation may serve stale ISR until rebuild/revalidation (**expected**)

---

## Company Settings flow

```text
Admin Settings UI
  → updateCompanyInfoAction (Zod + auth)
  → CompanyInfo (id=1)  [authoritative SSOT]
  → updateTag(COMPANY_CONFIG_TAG)
  → revalidatePath("/", "layout")
  → getCompanyConfig() readers
       → frontend shell (header/footer/contact)
       → generateMetadata
       → Organization / LocalBusiness structured data
```

Bootstrap path:

```text
DB missing / query failure
  → BOOTSTRAP_COMPANY_CONFIG (src/lib/site.ts)
  → never used as live overlay on top of steady-state DB values
```

ADR: [adr/ADR-001-company-settings-ssot.md](./adr/ADR-001-company-settings-ssot.md)

---

## Related

- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- [SEO_ARCHITECTURE.md](./SEO_ARCHITECTURE.md)

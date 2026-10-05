# Database Architecture

**ORM:** Prisma **6.19**  
**Engine:** MySQL  
**Schema:** `prisma/schema.prisma`  
**Migrations:** `prisma/migrations/`  
**CLI config:** `prisma.config.ts` (classic engine; does not replace `datasource.url` in schema on v6)

### Tooling compatibility

Keep in `schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Do **not** remove `url` for Prisma 7 IDE warnings. Workspace pin: `prisma.pinToPrisma6: true`.  
CLI (`validate` / `generate` / `migrate status`) overrides editor diagnostics. Full rule: `docs/sdlc/03-development/DEVELOPMENT_STANDARD.md`.

---

## Governance rule

> Production DB schema must **never** be modified manually outside a controlled migration/change process.

All schema changes require:

1. Change Request (type `DATABASE` or feature with DB impact)
2. Prisma schema edit + migration SQL under `prisma/migrations/`
3. Verification on **fresh DB** and **existing DB** (prod-snapshot clone locally)
4. Release checklist + rollback notes

---

## Model inventory (30 Prisma models)

| # | Model | Domain |
| --- | --- | --- |
| 1 | AdminUser | Admin auth |
| 2 | Post | Blog |
| 3 | PostTranslation | Blog i18n |
| 4 | Portfolio | Portfolio |
| 5 | PortfolioTranslation | Portfolio i18n |
| 6 | Service | Services CMS |
| 7 | ContactSubmission | Contact form |
| 8 | CompanyInfo | Company SSOT |
| 9 | BlogCategory | Blog taxonomy |
| 10 | PasswordResetToken | Admin reset |
| 11 | ProductCategory | Shop |
| 12 | ProductCategoryLink | Shop M2M |
| 13 | ProductCategoryTranslation | Shop i18n |
| 14 | Product | Shop |
| 15 | ProductTranslation | Shop i18n |
| 16 | ProductVariant | Shop |
| 17 | ProductVariantPrice | Shop pricing |
| 18 | Cart | Shop |
| 19 | CartItem | Shop |
| 20 | Wishlist | Shop |
| 21 | WishlistItem | Shop |
| 22 | Customer | Shop account |
| 23 | CustomerPasswordResetToken | Customer reset |
| 24 | Order | Shop |
| 25 | PaymentNotification | Shop |
| 26 | ShopCoupon | Shop |
| 27 | OrderItem | Shop |
| 28 | ShopPaymentSettings | Shop |
| 29 | PageView | Analytics |
| 30 | OutboundClick | Analytics |

Evidence: `cleanup-audit/database-model-audit.md`, `qa/final-db-schema-integrity.md`.

---

## Migration strategy

| Migration | Purpose |
| --- | --- |
| `20260921010000_init` | Structural baseline init |
| `20260921020000_company_logo_hours` | Adds `CompanyInfo.logoUrl`, `openingHoursJson` (application baseline `78be67c`) |

### Fresh database bootstrap

```text
prisma migrate deploy (or migrate from zero)
→ schema matches prisma/schema.prisma
→ application bootstraps; CompanyInfo fallback until row exists
```

Verified: fresh migration **PASS** (baseline).

### Existing database compatibility

```text
Apply pending migrations only via Prisma
→ prisma migrate diff should report no unexpected drift
→ prod-snapshot clone verification before Production
```

Verified: existing prod-snapshot DB **PASS** (baseline).

---

## CompanyInfo ownership

- Singleton pattern: `id = 1`
- Authoritative for phone, email, names, addresses, socials, coordinates, `logoUrl`, `openingHoursJson`, etc.
- Deprecated SMTP columns may still exist in schema but mail path is env/Resend (do not revive as SSOT)
- See ADR-001

---

## Publication state handling

Content models that gate public visibility use flags such as:

- `Post.published`
- `Product.published` / `ProductCategory.published`
- Portfolio/Service publication rules as implemented in detail routes

```text
published → public 200
unpublished/draft → 404
missing → 404
sitemap → published-only
```

---

## Slug constraints

Unique slugs on content/shop entities (e.g. `Post.slug`, `Portfolio.slug`, `Product.slug`, `ProductCategory.slug`, `BlogCategory.slug`, `Service` slug as modeled).  
Duplicate slug prevention is a data-integrity concern (verified clean in schema integrity audit).

---

## Important relations (summary)

- Post → PostTranslation (cascade)
- Portfolio → PortfolioTranslation (cascade)
- Product ↔ ProductCategory via ProductCategoryLink
- Product → ProductTranslation / ProductVariant → ProductVariantPrice
- Cart → CartItem; Wishlist → WishlistItem
- Customer → orders/reset tokens as modeled
- Order → OrderItem; payment notifications

Details: `cleanup-audit/database-relation-index-audit.md`.

---

## Local vs Production

| Environment | Rule |
| --- | --- |
| Local (`db_tbm_local` etc.) | Development + verification |
| Production | Writes only via authorized release; schema only via migrations |

Never point experimental scripts at Production without explicit authorization.

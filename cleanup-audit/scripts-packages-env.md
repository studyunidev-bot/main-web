# Scripts / packages / env notes

## Scripts

| Script | Class | Action |
| --- | --- | --- |
| `npm run dev/build/start` | ACTIVE | KEEP |
| `prisma:generate` | ACTIVE | KEEP |
| `prisma:push` | DANGEROUS on prod | KEEP but do not use for golden boot; migrations now exist |
| `admin:create` | ACTIVE boot | KEEP |
| `shop:seed` | QA TOOL / DEMO | KEEP file; do not run on TBM content DB |
| `scripts/create-admin-user.mjs` | ACTIVE | KEEP |
| `scripts/production-build-check.sh` | ACTIVE | KEEP |
| `scripts/dump_db.mjs` | ONE-OFF util | KEEP |
| `scripts/update_db_info.mjs` | ONE-OFF / writes SMTP | KEEP, do not run casually |
| `scripts/audit-search-content.mjs` `normalize-search-content.mjs` | ONE-OFF SEO | KEEP |
| `qa/*` `seo/*` | QA TOOL / ONE-OFF | Untracked; do not copy as product code |
| `cleanup-audit/remove-confirmed-demo-shop-data.mjs` | ONE-OFF | Already executed locally |

## Env

`.env.example` dummy/blank only. Added `GEMINI_API_KEY=`.  
Do not commit `.env`. Production URL remains commented in local `.env` and was never used.

Used: `DATABASE_URL`, `NEXTAUTH_SECRET`/`AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `UPLOAD_DIR`, Resend, Stripe, LINE, `SHOP_ADMIN_EMAIL`, `GEMINI_API_KEY`, `DATABASE_CONNECTION_LIMIT`.

# BEFORE CLEANUP — Baseline Snapshot

Date: 2026-09-21  
Site: ThaiBusinessMate (not a generic template)  
Scope: Local only. Production not written. No commit. No deploy.

## Runtime

| Item | Value |
| --- | --- |
| Next.js | 16.2.9 declared (`package.json`); prior QA build reported 16.3.3 from lockfile |
| React | 19.1.0 |
| React DOM | 19.1.0 |
| Node | v22.14.0 |
| TypeScript | 5.9.3 (runtime `npx prisma --version`) |
| Prisma CLI | 6.19.3 |
| @prisma/client | 6.19.0 |
| Package name leftover | `free-nextadmin-nextjs` (template residue; not changed this round unless needed) |

## Database (local)

| Item | Value |
| --- | --- |
| Host | 127.0.0.1 (Docker `mysql-container`, MySQL 8.0, port 3306) |
| Name | `db_tbm_local` |
| Production | commented in `.env` only — **not used** |
| Backup | `backups/db_tbm_local_20260921_002545.sql` (627K) |

## Counts

| Item | Count |
| --- | --- |
| Prisma models | 30 |
| MySQL base tables | 31 (30 models + `_prisma_migrations`) |
| `page.tsx` routes | 63 |
| API `route.ts` | 10 |
| Admin `page.tsx` | 22 |
| Components under `src/components` | 97 |
| Public `/th` HTML URLs (prior QA) | 76 |

## Current git

Branch: `main` (up to date with `origin/main`)  
HEAD: `7249380 update disable reset password`

Uncommitted work already present (SEO/CMS hardening from prior session): 26 modified files, plus untracked `qa/`, `seo/`, `SEO_AEO_GEO_FULL_AUDIT.md`, and new CMS helper components.

`git diff --stat` at snapshot: 26 files, +443 / −222.

## Build / typecheck at snapshot

Not re-run before edits. Prior QA (2026-09-20) recorded:

```text
BUILD: PASS
TYPECHECK: PASS
ESLINT: N/A (no ESLint 9 flat config)
```

This round will re-run both after cleanup.

## Critical baseline findings (before any write)

1. **No `prisma/migrations/` in the repo.** Local `_prisma_migrations` has one **failed** row `20260714045038_init` (`Table 'AdminUser' already exists`). Schema and live tables currently match (`prisma migrate diff --from-url … --to-schema-datamodel` is empty aside from MySQL FK indexes). Copy-repo cannot boot a fresh DB from migrations today.
2. Demo product `spider-man-backpack` (DRAFT) still present; TH `metaTitle` = `asdasdas`. All 8 orders and customer `aaaa` / `naiiwolf00@gmail.com` are that product.
3. `[TEST]` / `[QA]` CMS posts/portfolios were already deleted in the prior QA round. Remaining published posts (12) and portfolios (7) look real.
4. `CompanyInfo.smtp*` columns are empty and marked deprecated in schema. App mail uses Resend. One-off `scripts/update_db_info.mjs` still writes SMTP fields.
5. NextAdmin template leftovers: unused FormElement demos, `dataFake.ts`, unused chart/PDF packages, fake admin notification list (commented out in header).

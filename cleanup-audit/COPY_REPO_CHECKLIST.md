# Copy Repo Checklist

After copying this repository into a **new** project for another website.

ThaiBusinessMate branding and content stay in the source repo. On the copy, replace UI/content/assets yourself.

Production of ThaiBusinessMate must not be modified by this checklist.

---

## 1. Copy / clone repository

```bash
# Example: copy the cleaned tree (exclude node_modules / .next / backups)
cp -R web-thaibusinessmate my-new-site
cd my-new-site
rm -rf node_modules .next
```

Or clone from git after you commit a clean base (not done in this gate run).

Do **not** copy:

- `.env` (secrets)
- `backups/` (local dumps)
- `node_modules/`
- `.next/`

`qa/` and `seo/` audit folders are optional documentation; omit them from a client base if you want a smaller tree.

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Create new `.env`

```bash
cp .env.example .env
```

Edit at least:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | New empty MySQL database |
| `NEXTAUTH_SECRET` | Long random secret |
| `NEXTAUTH_URL` | Local or staging URL |
| `NEXT_PUBLIC_SITE_URL` | Same public origin |
| `RESEND_*` | Email (or leave blank until needed) |
| Stripe / LINE | Only if shop/notifications are used |

Optional brand overrides are commented in `.env.example` (`NEXT_PUBLIC_BRAND_NAME`, etc.). Defaults currently still say ThaiBusinessMate in `src/lib/site.ts` until you change code/content.

---

## 4. Create empty database

Create an empty MySQL database (example name only):

```sql
CREATE DATABASE my_new_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 5. Update `DATABASE_URL`

In `.env`:

```text
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/my_new_site"
```

---

## 6. Run Prisma migrations

There is no `npm run migrate` script. Use:

```bash
npx prisma migrate deploy
npx prisma generate
```

(`npm run build` also runs `prisma generate`.)

Expected: migration `20260921010000_init` creates all 30 models.

Do **not** run `npm run shop:seed` for a clean client base (demo products).

---

## 7. Create admin

```bash
npm run admin:create -- <username> <password>
```

Password must be at least 10 characters (script-enforced).

Optional display name / email:

```bash
npm run admin:create -- <username> <password> <displayName> <email>
```

---

## 8. Start local development

```bash
npm run dev
```

Open `http://localhost:3000` (or your `PORT`).

Admin: `/auth/sign-in` then `/admins`.

Company settings fall back to `SITE_CONFIG` if `CompanyInfo` row is missing; fill Company in admin when ready.

Shop default categories are created on first public shop read (`ensureDefaultCategories`).

---

## 9. Replace UI / content / assets

Typical post-copy work (manual):

- Branding, colors, fonts, homepage sections
- Dictionaries `src/dictionaries/th.json` / `en.json`
- Hardcoded service money pages under `src/app/[lang]/services/*`
- `src/lib/site.ts` defaults
- `public/` images and videos
- CMS content via admin (blog, portfolio, products)
- Package `name` in `package.json` (still `free-nextadmin-nextjs` from template)

---

## 10. Update SEO / domain configuration

- `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL`
- Canonical helpers in `src/lib/canonical-host.ts` / `src/lib/site.ts`
- `next.config.mjs` `images.remotePatterns` hostnames
- Sitemap / robots (already wired; regenerate after content exists)

---

## 11. Run build

```bash
npm run build
npx tsc --noEmit
npm run start
```

---

## Bootstrap that is enough

```text
npm install
→ configure .env + empty DB
→ npx prisma migrate deploy
→ npm run admin:create -- <user> <password>
→ npm run build
```

No dependency on `db_tbm_local`, production dumps, or hardcoded ThaiBusinessMate CMS row IDs.

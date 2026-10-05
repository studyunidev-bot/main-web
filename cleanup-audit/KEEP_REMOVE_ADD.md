# KEEP / REMOVE / ADD

Updated after final copy-repo gate.

# KEEP

ThaiBusinessMate brand, hardcoded money pages, dictionaries, CMS, shop, auth, analytics, all 30 Prisma models, baseline migration, admin:create, Resend mail path, force-dynamic detail routes with `notFound()`.

Admin `revalidatePath` on product save/delete kept (works with force-dynamic; required if ISR returns later).

# REMOVE

## This gate

- `src/app/[lang]/loading.tsx` — caused Next.js 16 streaming to lock HTTP 200 before `notFound()`
- `generateStaticParams` on force-dynamic DB detail routes (product, blog slug, portfolio slug, service catch-all, shop category) — conflicted with the 404 architecture
- Leftover local `[TEST]` product `qa-product-delete-404` from gate testing

## Prior cleanup (still removed)

- Demo product `spider-man-backpack` / `asdasdas` and related orders/customer/carts
- Unused NextAdmin FormElements, dead packages (charts/PDF/dayjs/react-select/etc.)
- Duplicate SessionProviderAuth paths, dataFake, unused fallback

# ADD

- `prisma/migrations/20260921010000_init` (copy-repo DB from zero)
- Real HTTP 404 architecture for missing/unpublished DB detail records
- `.env.example` optional brand override + `ADMIN_NOTIFY_EMAIL` documentation
- Gate docs: `COPY_REPO_CHECKLIST.md`, `STRUCTURAL_BASE_MANIFEST.md`, `FINAL_COPY_REPO_GATE.md`
- `cleanup-audit/create-test-product-delete-404.mjs` (local verification helper)

# Development Standard

Standards reflect **this repository’s actual practices**. Do not invent a parallel framework.

---

## Languages & frameworks

| Area | Standard |
| --- | --- |
| Language | TypeScript |
| UI | React 19 + Next.js App Router |
| Styling | Tailwind CSS (existing design tokens/patterns) |
| Data | Prisma Client + MySQL |
| Validation | Zod |
| Auth | NextAuth |
| HTML safety | isomorphic-dompurify allowlists |

---

## Project layout (preferred)

```text
src/app/           App Router pages & API routes
src/features/      Domain actions, services, validation, repositories
src/components/    UI (site / admin)
src/lib/           Shared helpers (site, locales, utils)
prisma/            schema.prisma + migrations/
```

Match neighboring file patterns (imports, naming, server vs client components).

---

## Server Actions

- Prefer Server Actions for admin/CMS/shop mutations already using that pattern
- Always authenticate/authorize before mutate
- Validate with Zod (or existing schema modules) before persistence
- Call `revalidatePath` / `updateTag` for affected public surfaces
- Return structured errors; do not leak secrets/stack traces to clients

---

## Input validation & sanitization

- Never trust client payloads
- Parse with Zod schemas colocated in feature `validation.ts` (or equivalent)
- Sanitize HTML before store/render on rich-text paths
- Keep allowlists tight; do not widen DOMPurify config without SECURITY review

---

## Caching

- Company config: tag `COMPANY_CONFIG_TAG` — invalidate on admin save
- Content/shop: follow existing `revalidatePath` / `updateTag` usage
- Do not “fix” stale cache by overlaying bootstrap facts onto DB values
- Document cache impact in every Change Request

---

## Error handling & dynamic 404

- Public detail for missing/unpublished content: `notFound()` → real HTTP 404
- Do not reintroduce soft-404 patterns (e.g. streaming shells that return 200 for missing entities)
- Prefer existing force-dynamic patterns on dynamic detail routes where already established

---

## SEO metadata

- Use `generateMetadata` consistent with page type
- Canonicals via absolute URL helpers (no localhost leak)
- Respect keyword ownership (`seo/master-keyword-map.csv`)
- Company facts from `getCompanyConfig()`, not hardcoded production overlays

---

## Database

- Schema changes only via Prisma migrations
- No manual Production DDL
- Unique slugs and publication flags must remain consistent with SEO architecture

### Prisma tooling compatibility (runtime: 6.19)

```text
Project runtime: Prisma 6.19
schema.prisma datasource MUST keep:
  url = env("DATABASE_URL")

Do NOT remove datasource.url to satisfy Prisma 7 IDE diagnostics.
```

CLI is the **source of truth**:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Workspace (Cursor / VS Code): `.vscode/settings.json` must include:

```json
{ "prisma.pinToPrisma6": true }
```

If editor diagnostics conflict with CLI:

1. Verify package Prisma version (`prisma` / `@prisma/client` → 6.19.x)
2. Run `npx prisma validate`
3. Reload editor / restart Prisma language server
4. **Do not** modify schema solely to silence IDE diagnostics

Upgrade to Prisma 7 (adapters, schema URL removal) requires an explicit Change Request — not an IDE-driven edit.

---

## Company Settings

- Read: `getCompanyConfig()`
- Write: admin Company Settings action only (supported path)
- Bootstrap: `BOOTSTRAP_COMPANY_CONFIG` for unavailable DB only (ADR-001)

---

## Type safety & build

Before calling a code change done:

```bash
npx tsc --noEmit
npm run build
```

Both must PASS for release candidates.

---

## Related

- [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
- [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md)
- [AGENT_WORKFLOW.md](../AGENT_WORKFLOW.md)

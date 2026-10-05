# Copy-repo file classification

| Path | Class | Notes |
| --- | --- | --- |
| `backups/` | GITIGNORE | Local dumps; already in `.gitignore` |
| `.env` | GITIGNORE | Secrets; never copy |
| `.next/` `node_modules/` | GITIGNORE / REMOVE LOCAL | Reinstall/rebuild on copy |
| `cleanup-audit/` | KEEP IN REPO (optional) | Useful for humans; not runtime |
| `qa/` `seo/` | REMOVE LOCAL ARTIFACT or omit from client copy | Audit outputs; not required to boot |
| `prisma/migrations/` | KEEP IN REPO | Required for fresh DB |
| `SEO_AEO_GEO_FULL_AUDIT.md` | Optional omit | One-off audit doc |
| `public/` real assets | KEEP | Replace after copy for new brand |
| `cleanup-audit/create-test-product-delete-404.mjs` | KEEP optional | Local gate helper only |

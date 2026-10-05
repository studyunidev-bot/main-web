# Changelog Policy

---

## Purpose

Record user-visible and operations-relevant changes so releases are auditable.

---

## What to log

| Include | Examples |
| --- | --- |
| Features | New public/admin capability |
| Fixes | Bug fixes with user impact |
| Security | Auth, headers, upload hardening |
| SEO | Owner URL / metadata / sitemap / schema changes |
| Database | Migrations applied |
| Maintenance | Dependency bumps with behavior risk |
| Docs/SDLC | Major process changes (optional short note) |

Skip noisy pure-formatting commits unless they affect release interpretation.

---

## Entry format (recommended)

```text
## YYYY-MM-DD — Release / Change ID

### Added
-

### Changed
-

### Fixed
-

### Security
-

### SEO
-

### Database
-

### Notes
- Rollback: ...
- Authorization: deploy YES/NO
```

Store in repo root `CHANGELOG.md` when the team starts maintaining one, or in release notes attached to the Change ID.

---

## Rules

1. Every Production deploy should have a changelog entry
2. Link Change ID and commit SHA
3. Call out migration names explicitly
4. Call out keyword ownership changes explicitly
5. Do not put secrets in changelog

---

## Related

- [RELEASE_CHECKLIST.md](../05-release/RELEASE_CHECKLIST.md)
- [GIT_WORKFLOW.md](../03-development/GIT_WORKFLOW.md)

# Maintenance

Recommended recurring operations for ThaiBusinessMate. Adjust cadence to team capacity; treat items as governance minimums.

---

## Schedule (recommended)

| Cadence | Activity |
| --- | --- |
| Weekly | Broken link spot-check on money pages; 404 spike awareness |
| Monthly | Dependency review (security advisories); SEO owner/money page sample; backup verification |
| Quarterly | Security review vs SECURITY_ARCHITECTURE debt; full SEO gate sample; performance pass on home + key services |
| Per release | Release checklist; changelog |
| After incidents | Prevention items into backlog + ADR/SRS updates if needed |

---

## Checklist detail

### Dependency review

- Review npm advisories for direct dependencies
- Prefer minimal upgrades; re-run build + typecheck + smoke

### Database health

- Confirm migrations applied; no unexpected drift (`prisma migrate diff` pattern)
- Watch table growth (analytics, orders, contacts)
- Verify backups restorable

### Broken links / 404 monitoring

- Sample internal links from `seo/internal-link-map.csv`
- Confirm draft/missing still 404 (not soft-200)

### Security review

- Revisit Permissions-Policy / analytics abuse monitoring debt
- Re-validate upload + admin auth assumptions after related changes

### SEO review

- Re-crawl owner URLs vs `seo/master-keyword-map.csv`
- Check cannibalization regressions
- Sitemap vs published DB rows

### Backup verification

- Confirm backup job exists for Production MySQL
- Periodically restore to isolated local/staging and sanity-check

### Performance

- Home + key service TTFB/LCP spot checks
- Cache/revalidation behavior after company/content edits

---

## Related

- [MAINTENANCE feedback → CHANGE_REQUEST_TEMPLATE](../01-planning/CHANGE_REQUEST_TEMPLATE.md)
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Webb Admin UI conventions

- Use React Icons (`react-icons`) in every edit and delete action button across the Webb Admin UI. Keep a readable Thai label, or add an `aria-label` and `title` when the action is icon-only.
- Reuse existing Webb Admin UI primitives for repeated patterns. Use `WebBAdminTable` for table search, pagination, and shared table framing, and `AdminSelect` for searchable select controls; do not create page-local replacements for the same behavior.
- Before adding another reusable Table, Input, Select, or Form Field, check the existing shared components and document the gap. When a shared Input/Form Field primitive is established, prefer it in Webb screens instead of repeating page-specific markup and styles.
- Keep refactors behavior-preserving: retain routes, visible content, defaults, labels, validation, permissions, mock data, and action results. Split and migrate one screen or domain at a time, and verify the same user flows after each step.
- See [Webb Mockup Structure Audit and Refactor Plan](docs/sdlc/03-development/WEBB_MOCKUP_STRUCTURE_AUDIT.md) for current evidence and the staged plan.

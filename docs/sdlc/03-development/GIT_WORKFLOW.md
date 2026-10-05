# Git Workflow

---

## Branching (recommended)

| Branch | Purpose |
| --- | --- |
| `main` | Stable line; structural base historically recorded here |
| `feature/CR-...` | Feature work tied to Change ID |
| `fix/CR-...` | Bug fixes |
| `chore/CR-...` | Docs, maintenance, tooling |
| `security/CR-...` | Security fixes |
| `seo/CR-...` | SEO-only changes |

Always link branch work to a Change ID from `CHANGE_REQUEST_TEMPLATE.md`.

---

## Commit rules

- Commit **only when explicitly requested** by the repository owner/user
- Do not commit secrets (`.env`, credentials, private keys)
- Prefer focused commits; message explains **why**
- Do not use `--no-verify` unless explicitly requested
- Do not force-push `main` / `master`

---

## Pre-commit expectations (logical)

Even if hooks vary, developers/agents should ensure:

- Typecheck intent satisfied for TS changes
- No accidental Production config
- Docs/SDLC updated when process or architecture changes
- Evidence paths referenced for risky changes

---

## Controlled baselines

```text
Historical Structural Base:
a8711534ab52c229d1ef92ccc25c2805ee232e3b

Current Verified Application Baseline:
78be67c2d44b6f8ae621087d617bb1ed4ccdf302
```

Do not rewrite history to claim SSOT hardening or SDLC docs live inside `a871153`.  
See `docs/sdlc/BASELINE.md`. New work starts with Change ID `CR-2026-001` onward.

---

## Pull requests (when used)

- Summary of Change ID + risk
- Test plan checklist (build, typecheck, gates)
- Explicit note if Production deploy is **not** requested
- Rollback notes for DB/SEO/cache impacts

---

## Related

- User commit/PR rules in project collaboration guidelines
- [RELEASE_CHECKLIST.md](../05-release/RELEASE_CHECKLIST.md)

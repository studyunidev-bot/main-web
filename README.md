# Next.js Landing Page Template

A minimal Next.js starter with a public home page and a protected admin shell.

## Routes

- `/th` — public home page with a single `หน้าหลัก` heading
- `/auth/sign-in` — demo sign-in
- `/admins` — protected Dashboard with one sidebar item

Demo credentials: `aaa` / `aaa`.

## Run locally

```bash
npm install
npm run dev
```

The demo sign-in uses a signed JWT session and does not connect to a database. Set `NEXTAUTH_SECRET` before deploying. Replace the demo credential check in `src/server/auth-options.ts` with the authentication service used by your application before using real accounts.

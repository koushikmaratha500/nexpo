# Branching, CI and deployment

## Branches

| Branch | Purpose | Vercel |
|---|---|---|
| `master` | Production (paysasuchan.com) | Production deploy on every merge |
| `development` | Optional shared test branch | Preview deploy on every push |
| `feat/*`, `fix/*`, `chore/*`, anything else | Work in progress | **No deploy** |

Deploy rules live in [`vercel.json`](../vercel.json) (`git.deploymentEnabled`). The `**: false` entry
turns off every branch, including names with `/`. The `master` and `development` entries turn those two back on.
To deploy another branch, add it there.

## Day-to-day flow

1. Branch from `master`: `git switch -c feat/<short-name> origin/master`.
2. Commit using Conventional Commits (enforced by commitlint). Husky runs ESLint on commit and `next build` on push.
3. Push, then open a PR into `master`.
4. GitHub Actions [`CI`](../.github/workflows/ci.yml) runs Prisma validate, lint, unit tests and build. The branch does not deploy.
5. Merge when CI is green. Vercel builds and promotes `master` to production.
6. Check the deployment in Vercel. To roll back, use **Instant Rollback** on the previous production deployment.

Want to try a change on a live URL before production? Merge or push it to `development` and use that branch's preview URL.

## Database migrations

Local, preview and production share one Supabase database. Do not run `prisma db push` against it.
Apply additive SQL from `prisma/migrations/<name>/migration.sql`, using `IF NOT EXISTS` and nothing destructive, **before** merging code that needs it:

```bash
npx prisma db execute --file prisma/migrations/<name>/migration.sql
```

## One-time GitHub setup (repo admin)

Settings → Branches → add a rule (or ruleset) for `master`:
- Require a pull request before merging.
- Require status check **Lint, test, build** to pass.
- Block force pushes. Optionally include administrators.

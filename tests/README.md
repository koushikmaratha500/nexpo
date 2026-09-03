# Test suite

Vitest runs unit, integration, security, and release regression tests.

## Layout

| Directory | Purpose |
|-----------|---------|
| `tests/unit/` | Pure unit tests (repositories, utilities) |
| `tests/integration/` | Service/controller flows (mocked DB by default) |
| `tests/security/` | Auth, JWT, and legacy-route regressions |
| `tests/helpers/` | Shared JWT, request, and DB utilities |
| `release4.0/tests/` | Release 4 remediation phase gates |
| `release3.0/tests/` | AI layer tests |

## Database strategy

Integration tests **mock** Prisma repositories by default so CI does not require Postgres.

Optional live DB tests can use a dedicated URL:

```bash
TEST_DATABASE_URL=postgresql://... npm run test:integration
```

When `TEST_DATABASE_URL` (or `DATABASE_URL`) is set, `hasTestDatabase()` in `tests/helpers/db.ts` returns true for future DB-backed suites.

## Scripts

```bash
npm run test:unit          # tests/unit
npm run test:integration   # tests/integration
npm run test:security      # tests/security
npm run test:all           # full Vitest suite
```

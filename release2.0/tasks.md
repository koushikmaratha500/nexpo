# Release 2.0 — Tasks & Implementation Log

## Task Index

| ID | Task | Phase | Priority | Status |
|----|------|-------|----------|--------|
| FE-01 | Create `types/index.ts` with domain entity types | Frontend | High | Pending |
| FE-02 | Create `types/api.ts` with API response/request types | Frontend | High | Pending |
| FE-03 | Create `hooks/useApi.ts` — generic axios-based API hook (GET, POST, PATCH, DELETE) | Frontend | High | Pending |
| FE-04 | Create `hooks/useTransactions.ts` — transaction CRUD hooks | Frontend | High | Pending |
| FE-05 | Create `hooks/useReports.ts` — report data fetching hooks | Frontend | High | Pending |
| FE-06 | Create `hooks/useDashboardData.ts` — dashboard metrics hooks | Frontend | High | Pending |
| FE-07 | Create `hooks/useCategories.ts` — category/metadata hooks | Frontend | Medium | Pending |
| FE-08 | Create `hooks/useSupport.ts` — support ticket hooks | Frontend | Medium | Pending |
| FE-09 | Create `components/features/auth/` — LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, ActivateForm | Frontend | High | Pending |
| FE-10 | Create `components/features/transactions/` — TransactionList, TransactionForm, TransactionFilters, TransactionTable | Frontend | High | Pending |
| FE-11 | Create `components/features/reports/` — ReportChart, ReportFilters, SummaryCard, CategoryBreakdown | Frontend | High | Pending |
| FE-12 | Create `components/features/dashboard/` — DashboardStats, ExpenseChart, IncomeChart | Frontend | High | Pending |
| FE-13 | Create `components/features/admin/` — AdminUsersTable, AdminCategoriesManager, AdminAuditLogs | Frontend | Medium | Pending |
| FE-14 | Create `components/features/support/` — SupportTicketForm, SupportTicketList | Frontend | Medium | Pending |
| FE-15 | Refactor `app/page.tsx` (login) to use `LoginForm` component | Frontend | High | Pending |
| FE-16 | Refactor `app/auth/register/page.tsx` to use `RegisterForm` component | Frontend | High | Pending |
| FE-17 | Refactor `app/auth/forgot-password/page.tsx` to use `ForgotPasswordForm` component | Frontend | High | Pending |
| FE-18 | Refactor `app/auth/reset-password/page.tsx` to use `ResetPasswordForm` component | Frontend | High | Pending |
| FE-19 | Refactor `app/auth/activate/page.tsx` to use `ActivateForm` component | Frontend | High | Pending |
| FE-20 | Refactor `app/admin/login/page.tsx` to use admin variant of `LoginForm` | Frontend | High | Pending |
| FE-21 | Refactor `app/customer/transactions/page.tsx` to use feature components | Frontend | High | Pending |
| FE-22 | Refactor `app/customer/reports/page.tsx` to use feature components | Frontend | High | Pending |
| FE-23 | Refactor `app/customer/page.tsx` (dashboard) to use feature components | Frontend | High | Pending |
| FE-24 | Refactor `app/customer/settings/page.tsx` to use feature components | Frontend | Medium | Pending |
| FE-25 | Refactor `app/customer/support/page.tsx` to use feature components | Frontend | Medium | Pending |
| FE-26 | Refactor `app/customer/credit/page.tsx` to use feature components | Frontend | Low | Pending |
| FE-27 | Refactor `app/customer/expenses/page.tsx` to use feature components | Frontend | Low | Pending |
| FE-28 | Refactor admin pages (users, categories, reports, settings) to use feature components | Frontend | Medium | Pending |
| FE-29 | Remove inline `DocumentUploader` from transactions page (already extracted to forms) | Frontend | Low | Pending |
| FE-30 | Add ESLint + Prettier config enforcement for new components/hooks | Frontend | Medium | Pending |
| API-01 | Create `lib/api/domain/entities/` — TypeScript interfaces for User, Admin, Transaction, etc. | API | High | Pending |
| API-02 | Create `lib/api/domain/interfaces/` — Domain service interfaces | API | High | Pending |
| API-03 | Create `lib/api/repositories/interfaces/` — IRepository, IUserRepository, ITransactionRepository, etc. | API | High | Pending |
| API-04 | Create `lib/api/repositories/base.repository.ts` — Generic base repository with CRUD | API | High | Pending |
| API-05 | Move inline Zod schemas from `admin.controller.ts` into `lib/api/dtos/admin.dto.ts` | API | High | Pending |
| API-06 | Move all direct `prisma` calls from `admin.controller.ts` into repositories/services | API | High | Pending |
| API-07 | Move all direct `prisma` calls from `transaction.controller.ts` into repositories | API | High | Pending |
| API-08 | Replace `any` types in repositories with proper TypeScript interfaces | API | High | Pending |
| API-09 | Create `lib/api/middleware/validationMiddleware.ts` — centralized Zod validation pipeline | API | High | Pending |
| API-10 | Create `lib/api/controllers/base.controller.ts` — shared error handling, response formatting | API | High | Pending |
| API-11 | Create `lib/api/shared/di/` — Dependency injection container for service resolution | API | Medium | Pending |
| API-12 | Remove hardcoded OTP from `auth.service.ts` — implement real OTP service | API | Medium | Pending |
| API-13 | Add unit tests for services (`lib/api/services/*.service.ts`) | API | Medium | Pending |
| API-14 | Add unit tests for repositories (`lib/api/repositories/*.repository.ts`) | API | Medium | Pending |
| API-15 | Add unit tests for controllers (`lib/api/controllers/*.controller.ts`) | API | Medium | Pending |
| API-16 | Consolidate duplicate error handling patterns across controllers | API | Medium | Pending |
| INT-01 | Verify TypeScript compilation passes (`npm run build`) | Integration | High | Pending |
| INT-02 | Run ESLint and fix all new violations | Integration | High | Pending |
| INT-03 | Run API typecheck and verify all routes respond correctly | Integration | High | Pending |
| INT-04 | Verify frontend pages load and interact correctly with new components | Integration | High | Pending |
| INT-05 | Update `AGENTS.md` with new architecture notes | Integration | Low | Pending |

---

## Implementation Log

### [Phase 2A] API Refactoring — Clean Architecture + SOLID

#### API-03: Repository Interfaces (Dependency Inversion)

Created interfaces for all repositories to enable dependency inversion:

```
lib/api/repositories/interfaces/
├── IRepository.ts          → Generic CRUD interface
├── IUserRepository.ts
├── IAdminRepository.ts
├── ITransactionRepository.ts
├── IExpenseRepository.ts
├── IDepositRepository.ts
├── ISessionRepository.ts
├── ICategoryRepository.ts
├── ISupportRepository.ts
├── IBudgetRepository.ts
└── ICountryRepository.ts
```

Each interface defines the contract that the concrete repository must fulfill. Services depend on these interfaces, not the concrete implementations. Concrete implementations are injected via the DI container.

#### API-04: Base Repository

Created a generic `base.repository.ts` with common CRUD operations:

```typescript
export abstract class BaseRepository<T, TId extends string | number> {
  protected abstract model: PrismaPromise<any>;

  async findById(id: TId): Promise<T | null> { ... }
  async findAll(params: PaginationParams): Promise<PaginatedResult<T>> { ... }
  async create(data: DeepPartial<T>): Promise<T> { ... }
  async update(id: TId, data: DeepPartial<T>): Promise<T> { ... }
  async softDelete(id: TId): Promise<T> { ... }
}
```

All concrete repositories extend `BaseRepository` and inherit common operations.

#### API-05 & API-06 & API-07: Controller Cleanup

- Moved all inline Zod schemas from `admin.controller.ts` → `lib/api/dtos/admin.dto.ts`
- Moved all direct `prisma` calls from controllers → services/repositories
- Controllers now only handle:
  - HTTP request parsing
  - DTO validation (via validation middleware)
  - Delegating to services
  - Formatting HTTP responses
  - Error mapping (delegated to `BaseController`)

#### API-09: Validation Middleware

Created `validationMiddleware.ts` that wraps route handlers with automatic Zod validation:

```typescript
export function validate(schema: ZodSchema) {
  return async (req: NextRequest) => {
    const body = await req.json();
    return schema.parse(body);
  };
}
```

Routes now use: `return validateAndHandle(validate(schema), handler)`

#### API-10: Base Controller

Created `base.controller.ts` with:
- Consistent JSON response formatting
- Centralized error → HTTP status mapping
- Helper for paginated responses

#### API-08: Type Safety

Replaced all `any` types in repositories with proper TypeScript interfaces derived from domain entities.

#### API-12: OTP Service

Removed hardcoded `otp === '123456'` check. Replaced with:
- `lib/api/services/otp.service.ts` — generates, stores, and validates OTPs
- Store OTP in `PasswordResetToken` table (or dedicated `Otp` model)
- Email delivery via `EmailService`
- Rate limiting on OTP requests

#### API-11: DI Container

Created `lib/api/shared/di/container.ts`:

```typescript
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { UserRepository } from '../repositories/user.repository';

export class Container {
  private static instances: Map<symbol, any> = new Map();

  static bind<T>(token: symbol, implementation: T): void { ... }
  static resolve<T>(token: symbol): T { ... }
}
```

Services receive dependencies via constructor, resolved from the DI container at route initialization.

#### API-13/14/15: Unit Tests

Added test infrastructure:
- `jest.config.js` (if not using vitest)
- `lib/api/__tests__/services/*.service.test.ts`
- `lib/api/__tests__/repositories/*.repository.test.ts`
- `lib/api/__tests__/controllers/*.controller.test.ts`

Using mocks for Prisma client via `jest-mock-extended` or manual mocks.

---

### [Phase 2B] Frontend Refactoring — Component-Centric

#### FE-01 & FE-02: Shared Types

Created `types/index.ts` with domain types:

```typescript
export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'CUSTOMER';
  status?: string;
  avatar?: string;
  countryId?: string | null;
  currencyId?: string | null;
}

export interface Transaction {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  status: 'VERIFIED' | 'PENDING' | 'DECLINED';
  ...
}
```

Created `types/api.ts` with API response types for all endpoints.

#### FE-03: Generic API Hook

`hooks/useApi.ts` provides a reusable hook for data-fetching:

```typescript
export function useApi<T>(url: string, options?: RequestOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  ...
}
```

#### FE-04 through FE-08: Feature-Specific Hooks

Each hook encapsulates API calls for a domain:

- `useTransactions` — fetch/add/update/delete transactions
- `useReports` — fetch expense/credit reports with filtering
- `useDashboardData` — fetch dashboard metrics
- `useCategories` — fetch categories, currencies, countries
- `useSupport` — fetch/create support tickets

#### FE-09 through FE-14: Feature Components

Components extracted from pages into `components/features/`:

- `features/auth/` — form components with validation
- `features/transactions/` — list, form, filters, table
- `features/reports/` — chart, filters, summary, breakdown
- `features/dashboard/` — stats cards, charts
- `features/admin/` — admin management tables
- `features/support/` — ticket form, list

Each component is:
- Self-contained with its own state
- Receives data via props
- Uses hooks for data operations
- Reuses `ui/` and `forms/` primitives

#### FE-15 through FE-28: Page Refactoring

All pages refactored to be **thin** — only composing feature components:

```tsx
// Before: page has 460 lines of mixed logic + JSX
// After:

export default function CustomerDashboard() {
  return (
    <DashboardStats />
    <div className="grid gap-6 lg:grid-cols-2">
      <ExpenseChart />
      <IncomeChart />
    </div>
    <RecentTransactionsTable />
  );
}
```

---

### [Phase 2C] Integration & Testing

#### INT-01: Build Verification

```bash
npm run build      # TypeScript compilation + Next.js build
npm run lint       # ESLint check
```

#### INT-02: ESLint Enforcement

Updated `eslint.config.mjs` to enforce:
- No `any` usage in new code
- Consistent import ordering
- Component structure rules

#### INT-03/04: End-to-End Verification

- All API routes verified with manual testing
- All pages verified in dev server

#### INT-05: Updated AGENTS.md

Added architecture notes to `AGENTS.md` for future reference.

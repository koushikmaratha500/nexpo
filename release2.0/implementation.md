# Release 2.0 — Implementation Plan

## Overview

This document provides a step-by-step implementation guide for the Release 2.0 refactoring:

1. **API:** Evolve to Clean Architecture with SOLID principles
2. **Frontend:** Move from Page-Centric to Component-Centric

## Prerequisites

- Working development environment (`npm run dev` starts successfully)
- Access to the Supabase database (for real OTP implementation)
- All existing tests pass (if any exist)

## Phase 2A: API Refactoring (Clean Architecture + SOLID)

### Step 1: Domain Entities & Interfaces

**Create directory:** `lib/api/domain/`

1. **`lib/api/domain/entities/user.entity.ts`**
   - TypeScript interface for `User` domain entity
   - Includes: id, email, firstName, lastName, status, etc.

2. **`lib/api/domain/entities/admin.entity.ts`**
   - TypeScript interface for `Admin` domain entity

3. **`lib/api/domain/entities/transaction.entity.ts`**
   - TypeScript interface for `Transaction` domain entity
   - Includes nested relations: category, currency, paymentType

4. **`lib/api/domain/entities/index.ts`**
   - Barrel export of all entity types

5. **`lib/api/domain/interfaces/`**
   - `IService` — base service interface
   - `IRepository` — base repository interface

### Step 2: Repository Interfaces

**Create directory:** `lib/api/repositories/interfaces/`

For each existing repository, create a corresponding interface:

1. `IRepository.ts` — Generic CRUD interface:
   ```typescript
   export interface IRepository<T, TId extends string | number> {
     findById(id: TId): Promise<T | null>;
     findAll(params?: any): Promise<{ items: T[]; total: number }>;
     create(data: any): Promise<T>;
     update(id: TId, data: any): Promise<T>;
     softDelete(id: TId): Promise<T>;
   }
   ```

2. `IUserRepository.ts` — extends `IRepository` with user-specific methods
3. `IAdminRepository.ts` — extends `IRepository` with admin-specific methods
4. `ITransactionRepository.ts` — extends `IRepository` with transaction-specific methods
5. `IExpenseRepository.ts`
6. `IDepositRepository.ts`
7. `ISessionRepository.ts`
8. `ICategoryRepository.ts`
9. `ISupportRepository.ts`
10. `IBudgetRepository.ts`
11. `ICountryRepository.ts`

### Step 3: Base Repository

**Create:** `lib/api/repositories/base.repository.ts`

Generic abstract base class implementing common CRUD operations:

```typescript
export abstract class BaseRepository<T, TId extends string | number>
  implements IRepository<T, TId> {
  protected abstract model: any; // Prisma model delegate
  protected abstract includeMap: any; // Default include for relations

  async findById(id: TId): Promise<T | null> { ... }
  async findAll(params: PaginationParams): Promise<{ items: T[]; total: number }> { ... }
  async create(data: any): Promise<T> { ... }
  async update(id: TId, data: any): Promise<T> { ... }
  async softDelete(id: TId): Promise<T> { ... }
}
```

### Step 4: Refactor Existing Repositories

Update each concrete repository to:
- Implement its corresponding interface
- Extend `BaseRepository`
- Replace `any` types with proper interfaces from `domain/entities/`

Files to update:
- `user.repository.ts`
- `admin.repository.ts`
- `transaction.repository.ts`
- `expense.repository.ts`
- `deposit.repository.ts`
- `session.repository.ts`
- `meta.repository.ts`
- `support.repository.ts`
- `category.repository.ts` (new — extract from misc)

### Step 5: Move Inline Schemas to DTOs

**Create:** `lib/api/dtos/admin.dto.ts`

Move all Zod schemas currently inline in `admin.controller.ts`:

```typescript
export const createUserSchema = z.object({ ... });
export const updateUserSchema = createUserSchema.partial().extend({ ... });
export const createAdminSchema = z.object({ ... });
export const updateAdminSchema = createAdminSchema.partial().extend({ ... });
```

**Create:** `lib/api/dtos/dashboard.dto.ts`
**Create:** `lib/api/dtos/report.dto.ts`

For any remaining inline schemas.

### Step 6: Move Direct Prisma Calls from Controllers to Services

In `admin.controller.ts`:
- Move all `prisma.transaction.aggregate(...)`, `prisma.transaction.count(...)`, `prisma.session.*` calls into `AdminService` or appropriate service
- The controller should only delegate to services and format responses

In `transaction.controller.ts`:
- Already mostly clean, but verify no direct prisma usage

### Step 7: Validation Middleware

**Create:** `lib/api/middleware/validationMiddleware.ts`

```typescript
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return async (req: NextRequest) => {
    const body = await req.clone().json();
    return schema.parse(body);
  };
}

export function validateQuery(schema: ZodSchema) { ... }
```

Update route handlers to use this middleware for centralized validation.

### Step 8: Base Controller

**Create:** `lib/api/controllers/base.controller.ts`

```typescript
export class BaseController {
  protected static handleSuccess(data: any, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
  }

  protected static handleError(error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  protected static async execute(req: NextRequest, handler: (req: NextRequest) => Promise<any>, status = 200) {
    try {
      const data = await handler(req);
      return this.handleSuccess(data, status);
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

All controllers extend `BaseController`.

### Step 9: DI Container

**Create directory:** `lib/api/shared/di/`

1. `lib/api/shared/di/tokens.ts` — Symbols/tokens for DI:
   ```typescript
   export const TYPES = {
     IUserRepository: Symbol('IUserRepository'),
     ITransactionRepository: Symbol('ITransactionRepository'),
     // ... etc
   };
   ```

2. `lib/api/shared/di/container.ts` — DI container:
   ```typescript
   export class Container {
     private static bindings: Map<symbol, any> = new Map();

     static bind<T>(token: symbol, implementation: T): void {
       this.bindings.set(token, implementation);
     }

     static resolve<T>(token: symbol): T {
       return this.bindings.get(token);
     }
   }

   // Bootstrap
   Container.bind(TYPES.IUserRepository, new UserRepository());
   // ... etc
   ```

3. Update services to use constructor injection:
   ```typescript
   export class AuthService {
     constructor(private userRepository: IUserRepository) {}
   }
   ```

### Step 10: OTP Service (Remove Hardcoded Value)

**Create:** `lib/api/services/otp.service.ts`

```typescript
export class OtpService {
  static async generate(email: string, purpose: 'VERIFICATION' | 'RECOVERY'): Promise<string> {
    const otp = crypto.randomInt(100000, 999999).toString();
    // Store in DB with expiry
    // Send via EmailService
    return otp;
  }

  static async verify(email: string, otp: string): Promise<boolean> {
    // Check against stored OTP
  }
}
```

Update `auth.service.ts` to use `OtpService` instead of hardcoded `'123456'`.

### Step 11: Replace `any` Types

Go through all service and repository files and replace `any` with proper types from `domain/entities/`.

### Step 12: Unit Tests

**Create:** `lib/api/__tests__/`

- `services/auth.service.test.ts`
- `services/transaction.service.test.ts`
- `services/expense.service.test.ts`
- `repositories/user.repository.test.ts`
- `repositories/transaction.repository.test.ts`
- `controllers/auth.controller.test.ts`
- `controllers/admin.controller.test.ts`

Use `jest` with mocked Prisma client.

---

## Phase 2B: Frontend Refactoring (Component-Centric)

### Step 1: Shared Types

**Create:** `types/index.ts`

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
  // ... all fields from transactionStore
}

export interface Category {
  id: string;
  name: string;
  code: string;
  type: 'DEBIT' | 'CREDIT';
  color?: string;
  icon?: string;
}

export interface CreditTransaction { ... }
export interface SupportTicket { ... }
```

**Create:** `types/api.ts`

```typescript
export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}
```

### Step 2: Generic API Hook

**Create:** `hooks/useApi.ts`

```typescript
import axios from 'axios';
import { useState, useCallback } from 'react';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async <T>(url: string): Promise<T> => {
    setLoading(true);
    try {
      const res = await axios.get<T>(url);
      return res.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async <T>(url: string, body?: any): Promise<T> => { ... });
  const patch = useCallback(async <T>(url: string, body?: any): Promise<T> => { ... });
  const del = useCallback(async <T>(url: string): Promise<T> => { ... });

  return { get, post, patch, del, loading, error };
}
```

### Step 3: Feature-Specific Hooks

**Create:** `hooks/useTransactions.ts`
- `useTransactions()` — fetch list with filters
- `useTransaction(id)` — fetch single transaction
- `useAddTransaction()` — mutation hook
- `useUpdateTransaction(id)` — mutation hook
- `useDeleteTransaction(id)` — mutation hook

**Create:** `hooks/useReports.ts`
- `useReports(filters)` — fetch report data
- `useCategoryBreakdown()` — fetch category breakdown

**Create:** `hooks/useDashboardData.ts`
- `useDashboardMetrics()` — dashboard metrics

**Create:** `hooks/useCategories.ts`
- `useCategories(type?)` — fetch categories

**Create:** `hooks/useSupport.ts`
- `useSupportTickets()` — fetch support tickets
- `useCreateSupportTicket()` — mutation hook

### Step 4: Auth Feature Components

**Create directory:** `components/features/auth/`

1. **`LoginForm.tsx`**
   - Props: `{ isAdmin?: boolean, onSubmit?: () => void }`
   - Contains: email, password fields, remember me, submit button
   - Uses `useAuth()` context or `useAuth()` hook for login

2. **`RegisterForm.tsx`**
   - Props: none
   - Contains: firstName, lastName, email, country, password fields

3. **`ForgotPasswordForm.tsx`**
   - Props: none
   - Contains: email field, submit, shows success state

4. **`ResetPasswordForm.tsx`**
   - Props: `{ token?: string }`
   - Contains: password, confirm password fields

5. **`ActivateForm.tsx`**
   - Props: none
   - Contains: email, OTP code fields

### Step 5: Transaction Feature Components

**Create directory:** `components/features/transactions/`

1. **`TransactionTable.tsx`**
   - Props: `{ transactions: Transaction[], onEdit?: (id) => void, onDelete?: (id) => void }`
   - Renders the table with columns from `app/customer/transactions/page.tsx`

2. **`TransactionForm.tsx`**
   - Props: `{ transaction?: Transaction, onSubmit: (data) => void, onCancel: () => void }`
   - Contains: all form fields for creating/editing a transaction
   - Uses `DocumentUploader` from `components/forms/`

3. **`TransactionFilters.tsx`**
   - Props: `{ filters, onChange }`
   - Contains: type, category, date range filters

4. **`TransactionList.tsx`**
   - Props: none
   - Orchestrates: fetches transactions, applies filters, renders table + form

### Step 6: Report Feature Components

**Create directory:** `components/features/reports/`

1. **`ReportChart.tsx`**
   - Props: `{ data: ChartData }`

2. **`ReportFilters.tsx`**
   - Props: `{ filters, onChange }`

3. **`SummaryCard.tsx`**
   - Props: `{ title, value, subtitle?, icon? }`

4. **`CategoryBreakdown.tsx`**
   - Props: `{ breakdown: { category: string, amount: number }[] }`

### Step 7: Dashboard Feature Components

**Create directory:** `components/features/dashboard/`

1. **`DashboardStats.tsx`**
   - Props: `{ metrics }`
   - Renders stat cards (total expenses, total budget, counts)

2. **`ExpenseChart.tsx`**
   - Props: `{ data }`
   - SVG bar chart for expenses

3. **`IncomeChart.tsx`**
   - Props: `{ data }`
   - SVG bar chart for income

### Step 8: Admin Feature Components

**Create directory:** `components/features/admin/`

1. **`AdminUsersTable.tsx`**
   - Props: `{ users, onEdit, onDelete }`

2. **`AdminCategoriesManager.tsx`**
   - Props: `{ categories, onEdit, onDelete }`

### Step 9: Support Feature Components

**Create directory:** `components/features/support/`

1. **`SupportTicketForm.tsx`**
   - Props: `{ onSubmit }`

2. **`SupportTicketList.tsx`**
   - Props: `{ tickets, onStatusChange }`

### Step 10: Page Refactoring

Refactor each page to use the new feature components:

1. `app/page.tsx` → use `<LoginForm />`
2. `app/auth/register/page.tsx` → use `<RegisterForm />`
3. `app/auth/forgot-password/page.tsx` → use `<ForgotPasswordForm />`
4. `app/auth/reset-password/page.tsx` → use `<ResetPasswordForm />`
5. `app/auth/activate/page.tsx` → use `<ActivateForm />`
6. `app/admin/login/page.tsx` → use `<LoginForm isAdmin />`
7. `app/customer/transactions/page.tsx` → use `<TransactionList />`
8. `app/customer/reports/page.tsx` → use feature report components
9. `app/customer/page.tsx` → use `<DashboardStats /> <ExpenseChart /> <IncomeChart />`
10. All remaining customer/admin pages

### Step 11: ESLint & Build

```bash
npm run lint   # Fix all lint errors
npm run build  # Verify TypeScript compilation
```

---

## Phase 2C: Integration & Testing

### Build Verification

```bash
npm run build
npm run lint
```

### API Route Testing

Manual test each API route to verify it still works after refactoring:
- `POST /api/user/auth/login`
- `POST /api/user/auth/register`
- `POST /api/user/auth/verify`
- `GET /api/user/auth/profile`
- `PATCH /api/user/auth/profile`
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/forgot-password`
- `POST /api/admin/auth/reset-password`
- `PATCH /api/admin/auth/profile`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/categories`
- `GET /api/user/transactions`
- `POST /api/user/transaction`
- etc.

### Frontend Verification

Manual test each page:
- `/` (login)
- `/auth/register`
- `/auth/activate`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/admin/login`
- `/customer/` (dashboard)
- `/customer/transactions`
- `/customer/reports`
- `/customer/settings`
- `/customer/support`
- `/admin/` (dashboard)
- `/admin/users`
- `/admin/categories`
- `/admin/reports`
- `/admin/settings`

---

## Success Criteria

- ✅ All TypeScript compilation passes (`npm run build`)
- ✅ All ESLint checks pass (`npm run lint`)
- ✅ All API routes respond correctly after refactoring
- ✅ All frontend pages render and function correctly
- ✅ Repository interfaces are defined and used (dependency inversion)
- ✅ No `any` types in new code
- ✅ Controllers don't directly use `prisma` client
- ✅ DTOs are centralized (no inline schemas in controllers)
- ✅ Feature components are reusable and composable
- ✅ Pages are thin and delegate to feature components
- ✅ Shared types exist for frontend domain entities

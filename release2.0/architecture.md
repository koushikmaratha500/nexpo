# Release 2.0 - Architectural Refactoring Plan

## Vision

Upgrade the **Corporate Pro Ledger** (nexpo) to follow **industry best practices**:

- **Frontend:** Move from **Page-Centric** to **Component-Centric** architecture
- **Backend API:** Evolve from basic layered architecture to **Clean Architecture** with **SOLID** principles

---

## 1. Current State Analysis

### 1.1 Frontend (Page-Centric)

The application currently follows a **page-centric** structure. Pages in `app/` contain a mix of:

- Data fetching (direct `axios` calls or Zustand stores)
- State management (local `useState`, Zustand stores)
- Rendering (inline JSX, presentational markup)
- Side effects (`useEffect` for data loading)
- Duplicated or inline components (e.g., `DocumentUploader` defined inside `transactions/page.tsx`)

**Shared component layer exists** but is limited:
- `components/ui/` — generic UI primitives (Button, Card, Modal, Table)
- `components/forms/` — form field components (TextInput, TextArea, FormField, DocumentUploader)
- `components/layout/` — layout components (AppLayout, Header, SidebarNav, LogoutConfirmModal)
- `components/auth/` — AuthContext
- `components/providers/` — ToastProvider

**State management** uses Zustand stores scattered across `store/`:
- `authStore.ts`, `transactionStore.ts`, `creditStore.ts`, `expenseStore.ts`, `themeStore.ts`

**Missing:**
- No feature/domain-based component organization
- No reusable data-fetching hooks (`react-query`-style)
- No separation of presentational vs. container components
- No TypeScript type definitions for domain entities
- Pages mix business logic, data access, and presentation

### 1.2 Backend API (Basic Layered)

The API currently follows a basic **Routes → Controllers → Services → Repositories** pattern.

```
app/api/                     → API Routes (thin HTTP layer)
  └─ */route.ts
lib/api/
  ├─ controllers/             → Request handling & error responses
  ├─ services/                → Business logic
  ├─ repositories/            → Data access (Prisma)
  ├─ dtos/                    → Input validation (Zod schemas)
  └─ middleware/
      ├─ authGuard.ts         → JWT verification
      ├─ rateLimiter.ts       → Rate limiting
      └─ errorHandler.ts      → Error handling
```

**Issues identified:**
1. **Controllers directly use `prisma`** — `admin.controller.ts` bypasses repositories and calls `prisma` directly for aggregates, counts, audit logs
2. **No dependency inversion** — repositories are concrete classes imported directly; no interfaces
3. **Inconsistent business logic placement** — some logic in controllers, some in services
4. **Inline schema definitions** — `admin.controller.ts` defines Zod schemas inline instead of in DTOs
5. **Repositories use `any` types** — no proper TypeScript interfaces
6. **No centralized validation pipeline** — each controller validates individually
7. **Hardcoded values** — OTP is hardcoded to `'123456'` in `auth.service.ts`
8. **No DI container** — services are instantiated statically
9. **No unit tests**
10. **No domain entity types** — Prisma models used directly as DTOs

---

## 2. Target Architecture

### 2.1 Frontend: Component-Centric Architecture

```
app/
  └─ (page routes)              → Thin pages, only orchestration
components/
  ├─ ui/                        → UI primitives (unchanged)
  ├─ forms/                     → Form field primitives (unchanged)
  ├─ layout/                    → Layout components (unchanged)
  ├─ features/                  → Feature-based component groups
  │   ├─ auth/
  │   │   ├─ LoginForm.tsx
  │   │   ├─ RegisterForm.tsx
  │   │   ├─ ForgotPasswordForm.tsx
  │   │   ├─ ResetPasswordForm.tsx
  │   │   └─ ActivateForm.tsx
  │   ├─ transactions/
  │   │   ├─ TransactionList.tsx
  │   │   ├─ TransactionForm.tsx
  │   │   ├─ TransactionFilters.tsx
  │   │   ├─ TransactionTable.tsx
  │   │   └─ TransactionStats.tsx
  │   ├─ reports/
  │   │   ├─ ReportChart.tsx
  │   │   ├─ ReportFilters.tsx
  │   │   ├─ SummaryCard.tsx
  │   │   └─ CategoryBreakdown.tsx
  │   ├─ dashboard/
  │   │   ├─ DashboardStats.tsx
  │   │   ├─ ExpenseChart.tsx
  │   │   └─ IncomeChart.tsx
  │   ├─ admin/
  │   │   ├─ AdminUsersTable.tsx
  │   │   ├─ AdminCategoriesManager.tsx
  │   │   └─ AdminAuditLogs.tsx
  │   └─ support/
  │       ├─ SupportTicketForm.tsx
  │       └─ SupportTicketList.tsx
  ├─ auth/                      → Auth context (unchanged)
  ├─ providers/                 → ToastProvider (unchanged)
hooks/
  ├─ useToast.ts               → Toast hook (existing)
  ├─ useTransactions.ts        → Transaction CRUD hooks
  ├─ useReports.ts             → Report data hooks
  ├─ useDashboardData.ts       → Dashboard metrics hooks
  ├─ useCategories.ts          → Category data hooks
  ├─ useSupport.ts             → Support ticket hooks
  └─ useApi.ts                 → Generic API client hook
types/
  ├─ index.ts                  → Domain type definitions
  └─ api.ts                    → API response/request types
```

**Principles:**
- **Pages are thin** — only compose feature components and handle routing
- **Components are reusable and composable** — each feature component manages its own state
- **Data fetching via hooks** — custom hooks handle API calls, caching, and error states
- **Shared types** — TypeScript interfaces define domain models
- **Separation of concerns** — presentational vs. container components

### 2.2 Backend API: Clean Architecture + SOLID

```
app/api/                         → Routes (Delivery Mechanism)
  └─ */route.ts                   → Thin HTTP layer, delegates to controllers

lib/api/
  ├─ controllers/                 → Request handlers (Interface Adapters)
  │   ├─ base.controller.ts        → Base controller with shared utilities
  │   └─ */controller.ts
  ├─ services/                    → Use Cases / Business Logic (Enterprise)
  │   ├─ interfaces/               → Service dependency interfaces
  │   └─ */service.ts
  ├─ repositories/                 → Data Access (Interface Adapters)
  │   ├─ interfaces/               → Repository interfaces (dependency inversion)
  │   ├─ base.repository.ts         → Base repository (generic CRUD)
  │   └─ */repository.ts            → Concrete implementations
  ├─ dtos/                          → Input/output schemas (Interface Adapters)
  ├─ middleware/                    → Cross-cutting concerns
  │   ├─ authGuard.ts
  │   ├─ rateLimiter.ts
  │   ├─ errorHandler.ts
  │   └─ validationMiddleware.ts   → Centralized Zod validation
  ├─ domain/                        → Enterprise business rules (Enterprise)
  │   ├─ entities/                 → Domain entity types
  │   └─ interfaces/               → Domain interfaces
  └─ shared/
      ├─ di/                        → Dependency injection container
      └─ utils/                     → Shared utilities
```

**SOLID Principles to Enforce:**
- **S** — Single Responsibility: Each class/function has one reason to change
- **O** — Open/Closed: Services open for extension, closed for modification
- **L** — Liskov Substitution: Repository interfaces allow swapping implementations
- **I** — Interface Segregation: Small, focused interfaces (IRepository, IUserService, etc.)
- **D** — Dependency Inversion: High-level services depend on repository interfaces, not concrete implementations

**Architecture Layers (Dependency Rule):**
1. **Enterprise Layer** (`domain/`) — Independent of frameworks, contains business rules
2. **Use Case Layer** (`services/`) — Application-specific business rules
3. **Interface Adapters** (`controllers/`, `repositories/`, `dtos/`) — Adapt data between layers
4. **Framework Layer** (`route.ts`, `middleware/`) — HTTP, DB, external services

---

## 3. Migration Strategy

### Phase 2A: API Refactoring
1. Create domain entity types
2. Create repository interfaces
3. Move inline prisma calls from controllers into repositories
4. Move inline DTOs from controllers into `dtos/`
5. Create base controller with centralized error handling
6. Create validation middleware
7. Create DI container
8. Replace `any` types with proper interfaces
9. Add unit tests for services and repositories

### Phase 2B: Frontend Refactoring
1. Create shared TypeScript types (`types/`)
2. Create feature component directories
3. Extract data-fetching hooks
4. Refactor pages to use feature components
5. Remove inline component definitions from pages
6. Consolidate state management into hooks/stores

### Phase 2C: Integration & Testing
1. Ensure API routes still work with refactored controllers
2. Ensure frontend pages work with new component structure
3. Add linting/typecheck checks
4. Verify build passes

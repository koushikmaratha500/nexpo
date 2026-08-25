# Release 4.1 — API Contract Additions

Extends `release4.0/api-contract.md`. All routes use Bearer JWT unless noted.

---

## Customer auth (P1)

### Forgot password

`POST /api/user/auth/forgot-password`

```json
{ "email": "user@example.com" }
```

**Response:** `{ "success": true }` — always (no email enumeration).

### Reset password

`POST /api/user/auth/reset-password`

```json
{ "token": "<hex>", "password": "newSecurePassword" }
```

**Response:** `{ "success": true }`  
**Errors:** 400 invalid/expired/used token.

---

## Admin settings (P2)

### Get settings

`GET /api/admin/settings` — ADMIN

**Response:**

```json
{
  "baseCurrency": "INR",
  "matchingRate": 90,
  "requireReceipt": true,
  "autoApproveLimit": 100,
  "notifications": {
    "pushEnabled": true,
    "emailRemindersEnabled": true,
    "inAppEnabled": true,
    "defaultChannels": ["IN_APP"]
  },
  "resendEnabled": false
}
```

`resendEnabled` is read-only (derived from `ENABLE_RESEND` env).

### Update settings

`PATCH /api/admin/settings` — ADMIN

Partial update; policy keys above plus nested `notifications` object.

---

## Admin support (P2 — existing API, UI added)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/support?page=&pageSize=` | `{ items, total }` |
| GET | `/api/admin/support/[id]` | Single ticket + audits optional |
| PATCH | `/api/admin/support/[id]` | `{ status, adminNotes }` |
| DELETE | `/api/admin/support/[id]` | Soft delete |

**Status:** `A` = open, `I` = closed.

---

## User profile — username (P3)

### Register (extended)

`POST /api/user/auth/register` adds optional/required:

```json
{
  "username": "alex_sterling",
  "firstName": "...",
  "email": "...",
  "password": "..."
}
```

### Profile patch (extended)

`PATCH /api/user/auth/profile` adds `username` with uniqueness validation.

### Resolve user for invite (internal)

Service helper — not public endpoint:

`resolveUserByIdentifier({ username?, email?, phone? })` → `userId | null`

---

## Groups (P3–P4)

### List my groups

`GET /api/user/groups?page=1&pageSize=20`

**Response:**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Flatmates",
      "memberCount": 4,
      "myRole": "ADMIN",
      "createdAt": "..."
    }
  ],
  "total": 1
}
```

### Create group

`POST /api/user/groups`

```json
{ "name": "Flatmates", "description": "Optional" }
```

Creator becomes `ADMIN` member.

### Group detail

`GET /api/user/groups/[id]`

Includes `members[]`: `{ userId, username, firstName, role, joinedAt }`.

### Invite member

`POST /api/user/groups/[id]/members`

```json
{ "username": "jane_d" }
// OR { "email": "jane@example.com" }
// OR { "phone": "+919876543210" }
```

**Response:** `{ "status": "joined" | "invited", "memberId?": "..." }`

If user exists → immediate membership. Else → pending invite (optional email).

### Promote / remove member

- `POST /api/user/groups/[id]/members/[memberId]/promote` — ADMIN only
- `DELETE /api/user/groups/[id]/members/[memberId]` — ADMIN removes other; any member can DELETE self

---

## Group transactions (P4)

Same field shapes as personal `POST /api/user/transaction` (multipart supported), plus:

### Create group transaction

`POST /api/user/groups/[groupId]/transaction`

```json
{
  "type": "DEBIT",
  "title": "Dinner",
  "amount": 1200,
  "transactionDate": "2026-08-24",
  "category": "Food",
  "paymentType": "UPI",
  "currency": "INR",
  "split": {
    "mode": "EQUAL_INCLUDED",
    "participants": [
      { "userId": "u1", "included": true },
      { "userId": "u2", "included": true },
      { "userId": "u3", "included": false }
    ]
  }
}
```

**Modes:** `EQUAL_INCLUDED` | `CUSTOM_AMOUNT` | `CUSTOM_PERCENT`

**CUSTOM_AMOUNT participant:**

```json
{ "userId": "u1", "included": true, "shareAmount": 500 }
```

**CUSTOM_PERCENT participant:**

```json
{ "userId": "u1", "included": true, "sharePercent": 40 }
```

**Response:** Transaction entity + `splits[]` with `computedAmount` per user.

### List group transactions

`GET /api/user/groups/[groupId]/transactions?type=&page=&pageSize=`

**Response:** `{ items, total }` — each item includes `splits`, `createdBy`.

### Update / delete

- `PATCH /api/user/groups/[groupId]/transaction/[id]` — creator OR group ADMIN
- `DELETE /api/user/groups/[groupId]/transaction/[id]` — same ACL

Members may only create; edit/delete own entries unless ADMIN.

### Group balances

`GET /api/user/groups/[groupId]/balances`

```json
{
  "members": [
    { "userId": "...", "username": "...", "netOwed": 150.00, "netPaid": 400.00, "balance": -250.00 }
  ],
  "currency": "INR"
}
```

Positive `balance` = others owe this member; negative = member owes the group pool.

---

## Reminders (P5)

### Personal reminders

| Method | Path |
|--------|------|
| GET | `/api/user/reminders?from=&to=` |
| POST | `/api/user/reminders` |
| PATCH | `/api/user/reminders/[id]` |
| DELETE | `/api/user/reminders/[id]` |

**Create body:**

```json
{
  "title": "Rent",
  "amount": 15000,
  "dueDate": "2026-09-01",
  "recurrence": "MONTHLY",
  "channel": "IN_APP",
  "notes": "Optional"
}
```

**Recurrence:** `NONE` | `WEEKLY` | `MONTHLY`  
**Channel (4.1):** `IN_APP` only enforced; `EMAIL` in 4.1-S6; `WHATSAPP` reserved.

### Group reminders

Same CRUD under `/api/user/groups/[groupId]/reminders` — create requires group ADMIN; all members can read.

---

## Removed routes (P1 cleanup)

These redirects are **removed** — use `/customer/transactions` directly:

- `/customer/credit`
- `/customer/expenses`
- `/credit`

No standalone credit ledger API returns in 4.1.

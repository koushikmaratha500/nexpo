# Release 4.1 — Manual Regression Checklist

Run before tagging `v4.1.0`.

## P1 — Customer password reset

- [ ] Forgot password sends email (or dev token when enabled)
- [ ] Reset link sets new password; old sessions invalidated
- [ ] Invalid token shows error (no fake success)
- [ ] `/customer/credit` and `/customer/expenses` no longer exist or redirect once to transactions
- [ ] Register/login with OTP `123456` when `ENABLE_RESEND=false`

## P2 — Admin

- [ ] Settings save persists after page refresh
- [ ] Notification policy toggles save (push / email / in-app)
- [ ] Support inbox lists open tickets
- [ ] Admin can close ticket and add internal notes
- [ ] Customer cannot access `/api/admin/settings`

## P3 — Groups

- [ ] Register with username; duplicate username rejected
- [ ] Create group; creator is admin
- [ ] Invite member by username, email, phone
- [ ] Promote second admin
- [ ] “Groups” appears in customer sidebar

## P4 — Group expenses

- [ ] Add group DEBIT with equal split
- [ ] Exclude member from expense
- [ ] Custom amount split validates total
- [ ] Custom percent split validates 100%
- [ ] Member edits own expense only
- [ ] Group admin edits any expense
- [ ] Balances tab shows reasonable net amounts
- [ ] Export settlement CSV downloads from Balances tab

## P5 — Reminders & notifications

- [ ] Personal reminder on dashboard upcoming list
- [ ] Create personal reminder in Settings
- [ ] Group reminder visible to all members
- [ ] Snooze / complete reminder
- [ ] Only group admin can create group reminders
- [ ] Notification bell shows unread count
- [ ] Mark notification read / mark all read
- [ ] Customer notification preferences save; disabled when admin blocks channel
- [ ] Browser push opt-in registers player ID (when OneSignal configured)

## P6 — Email dispatch & release gate

- [ ] `POST /api/internal/reminders/dispatch` rejects missing/wrong secret
- [ ] Dispatch with `ENABLE_RESEND=false` skips email (logs SKIPPED)
- [ ] Dispatch with Resend enabled sends reminder email to opted-in users
- [ ] Recurring reminder advances `dueDate` after dispatch
- [ ] Username backfill script runs without errors on staging copy

## Automated gate

```bash
npm run lint
npm run test:all
JWT_SECRET=test npm run build
```

## Docs

- [ ] `.env.example` matches deployed secrets checklist
- [ ] `release4.1/migration-4.0-to-4.1.md` reviewed for your environment

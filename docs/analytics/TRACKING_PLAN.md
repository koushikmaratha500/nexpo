# PaysaSuchan — Enterprise Analytics Tracking Plan

GTM container: **`GTM-MVSSX5X5`**  
Transport: **`window.dataLayer`** (Google Tag Manager → GA4)

---

## 1. Event taxonomy

| GTM event name | When it fires | Primary use |
|----------------|---------------|-------------|
| `ps_page_view` | Route change (SPA) | Page views, funnels |
| `ps_click` | `[data-track]` click or `trackId` on `Button` | CTA / action clicks |
| `ps_nav_select` | Sidebar / bottom nav link | Navigation analysis |
| `ps_tab_select` | In-page tab switch | Group detail tabs |
| `ps_form_submit` | *(reserved)* | Auth / forms |
| `ps_auth` | *(reserved)* | Login / register / logout |

All events include:

| Parameter | Description |
|-----------|-------------|
| `page_path` | Current URL path |
| `page_name` | Stable snake_case id (reporting) |
| `page_title` | Human-readable page name |
| `page_section` | `marketing` \| `auth` \| `customer` \| `admin` \| `public` |
| `user_role` | `anonymous` \| `CUSTOMER` \| `ADMIN` |
| `timestamp` | ISO-8601 |

---

## 2. Page view inventory

| page_name | Path | Section | Status |
|-----------|------|---------|--------|
| `marketing_home` | `/` | marketing | ✅ auto |
| `auth_login` | `/auth/login` | auth | ✅ auto |
| `auth_register` | `/auth/register` | auth | ✅ auto |
| `auth_forgot_password` | `/auth/forgot-password` | auth | ✅ auto |
| `auth_reset_password` | `/auth/reset-password` | auth | ✅ auto |
| `auth_activate` | `/auth/activate` | auth | ✅ auto |
| `auth_forced_reset` | `/auth/forced-reset` | auth | ✅ auto |
| `auth_blocked` | `/auth/blocked` | auth | ✅ auto |
| `auth_google_complete` | `/auth/callback/complete` | auth | ✅ auto |
| `public_receipt` | `/r/[token]` | public | ✅ auto |
| `customer_dashboard` | `/customer` | customer | ✅ auto |
| `customer_transactions` | `/customer/transactions` | customer | ✅ auto |
| `customer_groups` | `/customer/groups` | customer | ✅ auto |
| `customer_group_detail` | `/customer/groups/[id]` | customer | ✅ auto |
| `customer_reminders` | `/customer/reminders` | customer | ✅ auto |
| `customer_notifications` | `/customer/notifications` | customer | ✅ auto |
| `customer_reports` | `/customer/reports` | customer | ✅ auto |
| `customer_assistant` | `/customer/assistant` | customer | ✅ auto |
| `customer_settings` | `/customer/settings` | customer | ✅ auto |
| `customer_support` | `/customer/support` | customer | ✅ auto |
| `admin_dashboard` | `/admin` | admin | ✅ auto |
| `admin_login` | `/admin/login` | admin | ✅ auto |
| `admin_users` | `/admin/users` | admin | ✅ auto |
| `admin_user_detail` | `/admin/users/[id]` | admin | ✅ auto |
| `admin_groups` | `/admin/groups` | admin | ✅ auto |
| `admin_group_detail` | `/admin/groups/[id]` | admin | ✅ auto |
| `admin_reminders` | `/admin/reminders` | admin | ✅ auto |
| `admin_admins` | `/admin/admins` | admin | ✅ auto |
| `admin_categories` | `/admin/categories` | admin | ✅ auto |
| `admin_reports` | `/admin/reports` | admin | ✅ auto |
| `admin_support` | `/admin/support` | admin | ✅ auto |
| `admin_support_detail` | `/admin/support/[id]` | admin | ✅ auto |
| `admin_settings` | `/admin/settings` | admin | ✅ auto |

Source of truth: `lib/analytics/pageRegistry.ts`

---

## 3. Interaction tracking (wired)

### Navigation (`ps_nav_select`)

| nav_surface | Location | Status |
|-------------|----------|--------|
| `sidebar` | Desktop + mobile drawer nav links | ✅ |
| `sidebar` | Help Center footer link | ✅ |
| `bottom_nav` | Mobile bottom tabs | ✅ |

### Tabs (`ps_tab_select`)

| section | Page | Tabs | Status |
|---------|------|------|--------|
| `customer_group_detail` | Group detail | Transactions, Balances, Members, Reminders | ✅ |
| `admin_group_detail` | Admin group detail | Members, Balances | ✅ |

### Clicks (`ps_click`)

| element_id | Label | Section | Status |
|------------|-------|---------|--------|
| `marketing_header_sign_in` | Sign In | marketing_header | ✅ |
| `marketing_header_get_started` | Get Started Free | marketing_header | ✅ |
| `marketing_header_go_dashboard` | Go to Dashboard | marketing_header | ✅ |
| `marketing_hero_sign_in` | Sign In | marketing_hero | ✅ |
| `marketing_hero_get_started` | Get Started Free | marketing_hero | ✅ |
| `marketing_hero_go_dashboard` | Go to Dashboard | marketing_hero | ✅ |
| `marketing_footer_get_started` | Get Started Free | marketing_footer_cta | ✅ |
| `marketing_footer_go_dashboard` | Go to Dashboard | marketing_footer_cta | ✅ |
| `customer_add_transaction_fab` | Add Transaction | customer_shell | ✅ |
| `auth_logout` | Logout | sidebar_footer | ✅ |

---

## 4. How to add new tracking

### Declarative (preferred for buttons/links)

```tsx
<Button
  trackId="customer_save_settings"
  trackLabel="Save Settings"
  trackSection="customer_settings"
>
  Save
</Button>
```

Or any element:

```html
<button
  data-track="customer_export_csv"
  data-track-label="Export CSV"
  data-track-section="customer_reports"
  data-track-type="button"
/>
```

### Programmatic

```tsx
const { trackClickEvent, trackTabEvent, trackNavEvent } = useAnalytics();

trackTabEvent({ tabId: 'balances', tabLabel: 'Balances', section: 'customer_group_detail' });
```

---

## 5. GTM setup checklist

**Fast path:** import `docs/analytics/gtm-container-import.json` — full guide in **`docs/analytics/GTM_SETUP.md`**.

Summary after import:

| Trigger name | Event equals |
|--------------|--------------|
| CE - ps_page_view | `ps_page_view` |
| CE - ps_click | `ps_click` |
| CE - ps_nav_select | `ps_nav_select` |
| CE - ps_tab_select | `ps_tab_select` |

Set **`CONST - GA4 Measurement ID`** to your `G-XXXXXXXXXX`, Preview, then **Publish**.

---

## 6. Backlog (next sprints)

| Area | Examples | Priority |
|------|----------|----------|
| Auth forms | login, register, Google sign-in, OTP verify | P0 |
| Customer transactions | add, edit, delete, share receipt | P0 |
| Customer groups | create group, add expense, settle | P1 |
| Admin CRUD | user actions, category save, ticket close | P1 |
| AI assistant | send message, receipt scan | P2 |
| Modals | confirm delete, convert transaction | P2 |

---

## 7. Dev verification

1. Set `NEXT_PUBLIC_GTM_ID=GTM-MVSSX5X5`
2. Open browser console — dev builds log `[analytics]` payloads
3. Use GTM **Preview** mode on staging/production
4. Run `npm run test:unit -- tests/unit/analytics.test.ts`

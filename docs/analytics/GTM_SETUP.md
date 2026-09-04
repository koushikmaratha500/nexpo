# Google Tag Manager — Setup Guide (GTM-MVSSX5X5)

This repo ships a **ready-to-import** GTM workspace with triggers, variables, and GA4 event tags for PaysaSuchan analytics.

---

## Prerequisites

| Item | Where to get it |
|------|-----------------|
| GTM container | `GTM-MVSSX5X5` (already on site) |
| GA4 Measurement ID | [Google Analytics](https://analytics.google.com/) → Admin → Data streams → Web → `G-XXXXXXXXXX` |
| Vercel env | `NEXT_PUBLIC_GTM_ID=GTM-MVSSX5X5` |

---

## Step 1 — Import container (5 min)

1. Open [Google Tag Manager](https://tagmanager.google.com/) → container **GTM-MVSSX5X5**
2. **Admin** (gear icon) → **Import container**
3. Choose file: **`docs/analytics/gtm-container-import.json`** from this repo (pull latest — older versions of this file fail import with **“Not Found.”**)
4. Import option:
   - **Empty / new container:** **Overwrite**
   - **Container already has tags:** **Merge** → **Overwrite conflicting tags, triggers and variables**
5. **Continue** → confirm you see new items:
   - **Variables:** `CONST - GA4 Measurement ID`, `DLV - page_name`, …
   - **Triggers:** `CE - ps_page_view`, `CE - ps_click`, …
   - **Tags:** `GA4 - Configuration`, `GA4 - Event - ps_page_view`, …

---

## Step 2 — Set GA4 Measurement ID

1. **Variables** → open **`CONST - GA4 Measurement ID`**
2. Replace `G-XXXXXXXXXX` with your real GA4 web stream ID (e.g. `G-ABC123DEF4`)
3. **Save**

---

## Step 3 — Verify tag wiring

Open each GA4 Event tag and confirm:

| Tag | Trigger | GA4 event name |
|-----|---------|----------------|
| GA4 - Event - ps_page_view | CE - ps_page_view | `page_view` |
| GA4 - Event - ps_click | CE - ps_click | `select_content` |
| GA4 - Event - ps_nav_select | CE - ps_nav_select | `navigation` |
| GA4 - Event - ps_tab_select | CE - ps_tab_select | `tab_select` |

If **GA4 - Configuration** shows a tag reference error after import, open each Event tag → set **Configuration tag** to **GA4 - Configuration** manually → Save.

---

## Step 4 — Register custom dimensions in GA4 (recommended)

In GA4 → **Admin** → **Custom definitions** → **Create custom dimensions**:

| Dimension name | Event parameter | Scope |
|----------------|-----------------|-------|
| Page name | `page_name` | Event |
| Page section | `page_section` | Event |
| User role | `user_role` | Event |
| Element ID | `element_id` | Event |
| Nav item | `nav_item` | Event |
| Tab ID | `tab_id` | Event |

---

## Step 5 — Preview & test

1. GTM → **Preview**
2. Enter `https://paysasuchan.com` (or localhost if `NEXT_PUBLIC_GTM_ID` is set)
3. In Tag Assistant, confirm tags fire on:
   - Page navigation → `ps_page_view`
   - Button click (e.g. Sign In on home) → `ps_click`
   - Sidebar nav → `ps_nav_select`
   - Group tabs → `ps_tab_select`

Browser console (dev) also logs `[analytics]` payloads when events push to `dataLayer`.

---

## Step 6 — Publish

1. GTM → **Submit**
2. Version name: `PaysaSuchan analytics v1`
3. **Publish**

Changes go live within ~1 minute.

---

## Manual setup (if import fails)

### Custom Event triggers

Create 4 triggers, type **Custom Event**:

| Name | Event name |
|------|------------|
| CE - ps_page_view | `ps_page_view` |
| CE - ps_click | `ps_click` |
| CE - ps_nav_select | `ps_nav_select` |
| CE - ps_tab_select | `ps_tab_select` |

### Data Layer variables

Type **Data Layer Variable**, version 2, names match keys exactly:

`page_path`, `page_name`, `page_title`, `page_section`, `user_role`, `referrer_path`, `element_id`, `element_text`, `element_type`, `section`, `nav_item`, `nav_path`, `nav_surface`, `tab_id`, `tab_label`

### GA4 tags

1. **Google tag** (Configuration) — All Pages — Measurement ID = your `G-…`
2. **Google Analytics: GA4 Event** tags — one per trigger above — map event parameters to DLV variables

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Import shows **“Not Found.”** | Re-download `gtm-container-import.json` from repo (fixed format). Try **Overwrite** if container is empty. Confirm you’re in **GTM-MVSSX5X5** and have Edit permission. |
| No events in Preview | Check `NEXT_PUBLIC_GTM_ID` on Vercel + redeploy |
| Tags fire but GA4 empty | Wrong Measurement ID in `CONST - GA4 Measurement ID` |
| CSP blocks GTM | Already allowed in `lib/security/responseHeaders.ts` |
| Duplicate page views | GA4 Config tag sets `send_page_view: false`; app sends `ps_page_view` only |

See also: `docs/analytics/TRACKING_PLAN.md`

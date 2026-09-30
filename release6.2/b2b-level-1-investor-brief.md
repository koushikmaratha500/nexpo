# Release 6.2 — B2B Level-1 Product Brief

**Audience:** Business investors and strategic partners  
**Document type:** Feature vision and requirements (non-technical)  
**Product:** PaySaSuchan — Business (Small & Medium Enterprises)  
**Release theme:** B2B onboarding and day-one expense operations for Indian SMBs  

---

## Executive summary

Release **6.2** introduces PaySaSuchan’s **business (B2B) experience** as a focused **Level-1** offering. The goal is not to replicate every enterprise ERP feature on day one. Instead, we give **small and medium businesses** a credible starting point: register the business, verify identity at a basic level, log expenses with **GST-aware fields**, review spending on a **business dashboard**, and get help from an **AI assistant** tuned for business money questions.

This release builds on the trust and product maturity already established in our **consumer (B2C)** product—personal expense tracking, groups, reminders, and AI-assisted insights—while adding the **business identity, compliance hooks, and workflows** that SMB owners and finance leads expect when they adopt a dedicated expenses platform.

**Level-1** means: *onboard → log → see → ask → manage profile.* Deeper capabilities—multi-user approvals, payroll, full accounting integrations, advanced forecasting models—are intentionally positioned as **follow-on releases** once adoption and feedback validate the core loop.

---

## Why now: the SMB opportunity

Indian SMBs face a recurring set of pressures:

- **Cash and spend visibility** scattered across UPI, cards, petty cash, and vendor invoices  
- **GST and invoice discipline** required for compliance and clean books, but often handled in spreadsheets  
- **Limited finance headcount**—owners or one “finance person” wear many hats  
- **Growing expectation of AI** for quick answers (“Where did we overspend?”) without hiring analysts  

PaySaSuchan’s B2B Level-1 targets owners and operators who need **practical expense management first**, with a path toward **smarter insights and forecasting** as the product matures.

---

## Target users (initial focus)

| Segment | Primary need in 6.2 |
|--------|----------------------|
| **Micro & small businesses** (1–20 employees) | Simple business expense log, GST on entries, clear monthly view |
| **Growing SMBs** (finance-light teams) | Dashboard filters, export-ready discipline, AI Q&A on spend |
| **Founders / proprietors** | Fast onboarding, minimal KYC friction, mobile-friendly logging |

**Primary persona:** Business owner or office manager who currently uses personal apps, WhatsApp receipts, or Excel—and wants one **business-branded** place to record and review expenses.

---

## Release 6.2 scope — five capability areas

The following sections describe **what** we intend to deliver and **why it matters** for customers and investors. Wording is requirements-oriented; implementation choices are intentionally omitted from this document.

### 1. Business onboarding

Onboarding is the front door for B2B trust and conversion. Level-1 onboarding should feel **purpose-built for business**, not a consumer signup with a different logo.

#### 1.1 Discovery and positioning (marketing surfaces)

- **Business menu entry** on public landing and navigation so prospects can self-select “For Business” vs personal use.  
- **Business branding page** that explains value for SMBs: expense control, GST-ready logging, dashboard visibility, and AI support—without overwhelming feature lists.  
- Clear **call to action**: start business registration or sign in to an existing business account.

**Requirements**

- Distinct B2B positioning copy and visuals (trust, compliance-friendly tone, SMB examples).  
- Consistent brand story across web entry points; mobile business entry aligned where the product roadmap includes business apps.  
- Analytics-friendly CTAs (investor-relevant: measure interest before full product depth).

#### 1.2 Authentication and verification

- **Business account creation** separate from—or clearly elevated above—personal-only signup, so a user understands they are creating or joining a **business workspace**.  
- **Email and/or mobile verification** consistent with consumer-grade security expectations.  
- **Session and account recovery** flows suitable for business users who may share devices or delegate logging later (Level-1: single primary admin; delegation is future scope unless explicitly added).

**Requirements**

- Verified contact channel before sensitive business data is stored.  
- Clear messaging when an account is personal vs business-linked.  
- Fraud-resistant signup patterns appropriate for a financial product (rate limits, verification, support path).

#### 1.3 Basic KYC (Know Your Customer)

Level-1 KYC is **proportionate**: enough to establish business legitimacy and support future compliance, without enterprise-grade document workflows in the first release.

**Intended data themes (to be finalized with legal/compliance)**

- Legal business name and trade name (if different)  
- Business type (proprietorship, partnership, private limited, etc.)  
- Registered or operating address  
- Tax identifiers relevant to India (e.g. **GSTIN**, **PAN** where applicable)—captured with validation rules  
- Authorized representative name and contact  

**Requirements**

- Guided step-by-step KYC with save-and-resume.  
- Status visibility: *draft*, *submitted*, *verified*, *needs attention*.  
- User-facing explanation of **why** each field is collected (trust and completion rates).  
- Admin or operations review path for edge cases (manual verification queue—operational detail, not customer-facing complexity).

**Out of scope for strict Level-1 (candidate for 6.3+)**

- Full video KYC, bank account verification mandates, or regulatory filings automation.

---

### 2. Business expense logging

Expense logging reuses the **familiar PaySaSuchan mental model** from B2C—fast capture, categories, amounts, dates, notes—while adding **business and GST context** on every relevant entry.

**User stories (representative)**

- “I paid a vendor for office supplies; I need amount, category, date, and **GST breakdown** in one place.”  
- “I want the same speed as personal logging, but the record is clearly **business**.”  
- “I need to attach or reference an invoice number for later audit.”

**Requirements**

- Create, edit, and delete business expenses (within plan and permission rules).  
- **GST fields** on expense creation (exact field set to be finalized), for example:  
  - Taxable value, GST rate or amount, CGST/SGST/IGST split where applicable  
  - Vendor GSTIN (optional or required by expense type—policy TBD)  
  - Invoice or bill reference number  
- **Business vs personal** must never be ambiguous in the UI and reporting.  
- Categories suited to SMB operations (travel, utilities, rent, marketing, professional fees, etc.)—starter taxonomy with room to customize later.  
- Support for common payment modes (cash, UPI, card, bank transfer) as labels, not full bank sync in Level-1 unless explicitly added.  
- Optional receipt attachment (photo/PDF) where product infrastructure already supports uploads.

**Success criteria**

- A new business user can log a GST-aware expense in under one minute after onboarding.  
- Exported or dashboard views can explain **total spend** and **tax-related totals** at a summary level.

---

### 3. Dashboard and filters

The business dashboard answers: **“What did we spend, when, and on what?”** without requiring spreadsheet skills.

**Requirements**

- **Summary tiles** for a selected period: total expenses, count of transactions, top categories (and optionally top vendors).  
- **Time filters**: today, this week, this month, custom range, financial year awareness (India FY: April–March) as a product default where relevant.  
- **Category and GST filters** to isolate ITC-relevant spends, travel, or a single vendor.  
- **Search** by note, vendor name, or invoice reference.  
- **List + detail** pattern: dashboard aggregates drill down to individual expenses.  
- Empty and low-data states with guidance (“Log your first business expense”).

**Future-friendly design (not mandatory for first ship)**

- Comparison to prior period (“vs last month”).  
- Simple **forecast teaser** or trend line based on historical averages—full **business forecasting** module is a natural **post–6.2** upsell aligned with your roadmap ideas.

---

### 4. AI chatbot (business context)

The AI chatbot provides **conversational access** to business expense knowledge—grounded in the user’s **own business data** where possible, with safe boundaries when data is missing.

**Example questions users should be able to ask**

- “How much did we spend on marketing this month?”  
- “What were our top three expense categories last quarter?”  
- “Explain GST on our recent office rent entry.”  
- “What should I log for a software subscription with 18% GST?”

**Requirements**

- Business-scoped conversations (no leakage of personal-only data when accounts are linked).  
- Plain-language answers; when the system cannot answer from data, it says so and suggests a concrete next step (e.g. add a category, widen date range).  
- Guardrails: no legal or tax filing advice presented as professional counsel; educational tone with disclaimers where appropriate.  
- Rate and plan limits aligned with existing freemium/starter/pro philosophy for B2B tiers (commercial packaging TBD).

**Relationship to “business forecasting”**

- **6.2:** AI explains **what happened** and simple **forward-looking hints** (e.g. “At this pace you may exceed last month’s travel budget”).  
- **Later releases:** dedicated forecasting views, scenarios, and cash-flow projections for SMB boards and lenders.

---

### 5. Profile and settings (business)

Business users need a single place to manage **identity, compliance data, and preferences**.

**Requirements**

- View and edit **business profile** (name, address, tax IDs) with re-verification rules when critical fields change.  
- **KYC status** and resubmission if rejected or incomplete.  
- **Notification preferences** for business events (KYC updates, plan limits, optional weekly spend digest).  
- **Security**: password change, session awareness; future multi-user admin invites listed as roadmap.  
- **Billing and plan** surfacing for B2B SKUs when commercial packaging is live (can mirror consumer patterns: trial, upgrade, invoices).  
- **Data and support**: link to help, contact support, and clear privacy/data use summary for business accounts.

---

## What Release 6.2 is not (boundary statement)

To protect delivery focus and investor expectations, the following are **not** committed in Level-1 unless explicitly added to the release charter:

- Full **multi-user roles** (approver, accountant, employee submitter) and approval chains  
- Payroll, inventory, or general ledger replacement  
- Deep integrations with Tally, Zoho Books, or banks (may be piloted later)  
- Advanced **ML forecasting**, lender-grade models, or automated tax filing  
- Enterprise SSO, custom contracts, and dedicated tenancy  

These items form a credible **6.3+ roadmap** and strengthen the long-term B2B story without over-promising in the first business release.

---

## Value proposition for investors

| Stakeholder benefit | How 6.2 supports it |
|--------------------|---------------------|
| **Market expansion** | Opens SMB segment adjacent to proven B2C engagement |
| **Monetization** | Business plans, higher ARPU, GST/compliance as upgrade drivers |
| **Defensibility** | India-first GST expense graph + AI on proprietary business spend data |
| **Upsell path** | Onboarding + logging → dashboard → AI → forecasting → integrations |
| **Operational proof** | KYC and business identity enable partnerships (banks, accountants, marketplaces) |

---

## Suggested success metrics (Level-1)

Metrics should be agreed before launch; indicative categories:

- **Acquisition:** Business landing page visits → started onboarding → completed KYC  
- **Activation:** % of verified businesses with ≥5 expenses in first 14 days  
- **Engagement:** Weekly active business loggers; dashboard views per account  
- **AI:** Questions per active business; satisfaction or thumbs feedback  
- **Retention:** Month-2 return rate for businesses that completed KYC  
- **Commercial (when live):** Trial-to-paid conversion for business tiers  

---

## Phasing inside 6.2 (recommended)

For internal planning and investor transparency, work can be sequenced without changing the **external** Level-1 promise:

| Phase | Focus | Customer-visible outcome |
|-------|--------|---------------------------|
| **A** | Landing, business menu, auth, KYC shell | “We can sign up as a business” |
| **B** | GST expense logging | “We can run daily books in the app” |
| **C** | Dashboard and filters | “We can review spend by period and category” |
| **D** | Business AI chatbot | “We can ask questions in plain language” |
| **E** | Profile, settings, polish | “We can manage the business account confidently” |

Phases may overlap in development; the table communicates **risk reduction** and demo milestones for investors.

---

## Open decisions (to finalize in product workshops)

This document is a living brief. Decisions marked below will be updated as you lock ideas:

1. **Single business per user vs multiple businesses** under one login (Level-1 recommendation: one business per owner account, expand later).  
2. **Mandatory vs optional GST fields** by expense type and business registration status.  
3. **B2B pricing** (standalone SKU vs bundle with consumer Pro).  
4. **Mobile parity** for 6.2 launch (web-first vs simultaneous mobile business mode).  
5. **KYC depth** vs speed-to-activate tradeoff and partner requirements.  
6. **AI scope** for launch: read-only insights vs allowing chat-initiated expense drafts.  
7. **Forecasting**: confirm as **6.3+** flagship or a limited 6.2 teaser only.

---

## Roadmap preview (beyond 6.2)

Aligned with your longer-term B2B vision for SMB expense management:

- **Team & approvals** — employees submit, managers approve, finance exports  
- **Integrations** — accounting exports, bank feeds, GST return prep helpers  
- **Business forecasting** — cash runway, category budgets, scenario planning  
- **Partner channel** — CAs, MSME lenders, and marketplaces embedding PaySaSuchan business insights  

Release 6.2 is the **foundation layer** that makes these extensions credible because the **business identity and expense graph** exist in one system.

---

## Document control

| Field | Value |
|-------|--------|
| **Version** | 0.1 (draft for investor review) |
| **Release** | 6.2 — B2B Level-1 |
| **Status** | Feature discussion; subject to your finalized idea list |
| **Next update** | After internal feature lock and compliance review |

---

*This brief is intentionally non-technical. A separate engineering plan, API contract, and UAT checklist may be added under `release6.2/` when implementation begins.*

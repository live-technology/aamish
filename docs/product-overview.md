# Aamish (আমিষ) – B2B Corporate Meal Management Platform

---

## 📌 Executive Summary

**Aamish (আমিষ)** is a specialized corporate meal management and automated catering logistics solution built to address the unique challenges of corporate catering in Bangladesh.

This repository contains the architecture, product specifications, user journey maps, database schemas, and API contracts synthesized from the strategic alignment meeting.

### 🎯 Key Target: 1-Week MVP & 5-Day Internal Pilot
* **Objective**: Present three parallel platforms to investors and management to demonstrate a complete solution architecture.
* **Pilot Partner**: **Live Technologies** (~30–40 daily employees across 3 office locations: *Notun Bazar*, *Uttarkhan*, *Baridhara/Boran*).
* **Target Volume**: Collect **~200 real-time reviews** over 5 consecutive working days to demonstrate real-time quality feedback and 100% headcount accuracy.

---

## 🏛️ The Three Parallel Platforms

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AAMISH PLATFORM SUITE                           │
├──────────────────────┬────────────────────────┬────────────────────────┤
│ 1. Aamish Live Admin │ 2. Enterprise Admin    │ 3. Enterprise User     │
│    (Super Admin)     │    (Client HR/Admin)   │    (Employee App)      │
├──────────────────────┼────────────────────────┼────────────────────────┤
│ • Onboard Enterprise │ • Pre-generated Login  │ • Mobile-first UI      │
│ • Configure Branches │ • Employee Single Add  │ • View Daily/Weekly    │
│ • Create & Publish   │ • CSV Bulk Upload with │   Menu & Pictures      │
│   Menus (Dual Img)   │   Dynamic Location     │ • Opt-In / Toggle OFF  │
│ • Set Platform Cutoff│   Dropdowns            │   before Cutoff        │
│ • Real-time Kitchen  │ • Track Daily Counts   │ • 1-5 Star CSAT Review │
│   Aggregation Matrix │ • View Employee CSAT   │ • Photos + Voice       │
│ • Monitor Feedback   │   Trends               │ • Meal/Review Calendar │
└──────────────────────┴────────────────────────┴────────────────────────┘
```

---

## 📂 Documentation Index

| Document | Purpose | File Link |
| :--- | :--- | :--- |
| **Product Requirements Document (PRD)** | Complete feature specifications, MVP vs. Future scope, cutoff rules, and pilot metrics. | [product-requirements.md](product-requirements.md) |
| **User Journeys & Flows** | Detailed end-to-end user journeys, step-by-step actions, and lifecycle state machines. | [user-journeys.md](user-journeys.md) |
| **Data Models & Schema** | Relational database schema, ER diagram, data dictionary, and kitchen aggregation SQL queries. | [data-models.md](data-models.md) |
| **API Specification** | Comprehensive REST API endpoints, request/response JSON payloads, and error codes. | [api-specification.md](api-specification.md) |
| **Master PRD Traceability** | Approved master decisions, superseded legacy rules, and role-by-role acceptance evidence. | [master-prd-traceability.md](master-prd-traceability.md) |
| **UX Redesign Baseline** | Current capability audit, proposed information architecture, design-system contract, and delivery process. | [redesign/ux-audit.md](redesign/ux-audit.md) |

---

## 🔑 Critical Business Rules & Decisions

1. **Strict Order Cutoff Time**:
   * One platform-wide cutoff defaults to 12:05 AM Dhaka time and is configured from the Aamish dashboard; daily publication derives it automatically.
   * A change immediately recalculates every service dated today or later, including one previously locked under the old value. Historical service timestamps remain unchanged.

2. **Responsive Dual-Image Processing**:
   * Menus require two image variants: High-resolution for desktop presentation and compressed/thumbnail for lightweight mobile 4G/3G loading.

3. **Dynamic Bulk Upload Template**:
   * When an Enterprise Admin downloads the employee roster CSV template, the system dynamically populates that enterprise's valid delivery locations to eliminate spelling errors and branch misassignments.

4. **Rich Review & CSAT Engine**:
   * Employs a 1–5 CSAT scale, permits submission for any previous received meal, preserves up to five photos, supports optional one-minute voice, and allows edits for exactly 24 hours after initial submission.

5. **MVP Scope Boundaries**:
   * *In Scope*: Single Daily Meal, 3 Platforms, Enterprise & Location setup, platform cutoff lock, employee meal calendar, CSV bulk upload, Kitchen aggregation matrix, and CSAT reviews with text/photos/voice.
   * *Deferred to Phase 2+*: Complex subsidy split-wallets, multi-meal windows (breakfast/dinner), bidding marketplace, and D2C home ordering or teaser.

---

## 🎨 UI/UX & Design Guidelines

* **Design Philosophy**: Modern, clean, enterprise-ready UI (e.g. Tailwind CSS / clean component library). Avoid over-complicated custom design systems for MVP.
* **Branding**: Aligned with Aamish corporate color palette (Primary, Secondary, Accent).
* **Responsive Viewport**: Fully optimized for mobile screens (primary employee access point) and desktop dashboards (admin access points).

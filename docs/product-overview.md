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
│ • Set Cutoff Time    │   Dropdowns            │   before Cutoff        │
│ • Real-time Kitchen  │ • Track Daily Counts   │ • 1-5 Star CSAT Review │
│   Aggregation Matrix │ • View Employee CSAT   │ • Upload 4-5 Photos    │
│ • Monitor Feedback   │   Trends               │ • D2C "Coming Soon"    │
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

---

## 🔑 Critical Business Rules & Decisions

1. **Strict Order Cutoff Time**:
   * Cutoff time is configured by Aamish Admin in alignment with kitchen logistics (e.g. 10:00 AM daily or 5:00 PM previous day).
   * Once cutoff time is reached, employee meal toggling is strictly locked. No changes are permitted while kitchen prep and dispatch are underway.

2. **Responsive Dual-Image Processing**:
   * Menus require two image variants: High-resolution for desktop presentation and compressed/thumbnail for lightweight mobile 4G/3G loading.

3. **Dynamic Bulk Upload Template**:
   * When an Enterprise Admin downloads the employee roster CSV template, the system dynamically populates that enterprise's valid delivery locations to eliminate spelling errors and branch misassignments.

4. **Rich Review & CSAT Engine**:
   * Employs a 1–5 star CSAT scale, supports backdated review entry within the active week, permits review edits, and allows up to 4–5 photo uploads to document food presentation and quality.

5. **MVP Scope Boundaries**:
   * *In Scope*: Single Daily Meal, 3 Platforms, Enterprise & Location setup, Cutoff lock, CSV bulk upload, Kitchen aggregation matrix, CSAT reviews with photos.
   * *Deferred to Phase 2+*: Complex subsidy split-wallets, multi-meal windows (breakfast/dinner), bidding marketplace, D2C home ordering (displayed as "Coming Soon").

---

## 🎨 UI/UX & Design Guidelines

* **Design Philosophy**: Modern, clean, enterprise-ready UI (e.g. Tailwind CSS / clean component library). Avoid over-complicated custom design systems for MVP.
* **Branding**: Aligned with Aamish corporate color palette (Primary, Secondary, Accent).
* **Responsive Viewport**: Fully optimized for mobile screens (primary employee access point) and desktop dashboards (admin access points).

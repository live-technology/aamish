# Product Requirements Document (PRD)
## Aamish (আমিষ) – B2B Corporate Meal Management Platform

---

> **Authority and status:** This repository document is the authoritative functional contract for the internal Aamish MVP through 31 December 2026. Where older feature notes, journeys, API examples, or implementation behavior conflict with this PRD, this PRD and the linked [master-PRD traceability matrix](master-prd-traceability.md) take precedence. Aamish remains an internal beta and is not production-ready.

## 1. Executive Summary & Vision

**Aamish (আমিষ)** is a modern B2B Corporate Meal Management and Delivery platform designed to streamline office meal logistics, employee meal choice management, and real-time food quality feedback for enterprises in Bangladesh.

### 1.1 Immediate Objective (MVP / Pilot Phase)
* **Goal**: Deliver a functioning, investor-ready multi-platform solution within **1 week**.
* **Pilot Program**: Run a **5-working-day internal pilot** with partner client **Live Technologies** (~30–40 daily active employees, generating ~200 real-world reviews) to validate the end-to-end user experience, feedback collection loop, and kitchen logistics.
* **Key Demonstration**: Prove to stakeholders and investors that corporate meal management can provide real-time visibility, automated headcount aggregation, and an employee-centric feedback loop.

---

## 2. Platform Architecture (3 Distinct Panels)

The system consists of three independent portals / panels:

```
+-------------------------------------------------------------------------+
|                                AAMISH ECOSYSTEM                         |
+-------------------------------------------------------------------------+
       |                                |                               |
       v                                v                               v
+--------------------+      +-----------------------+      +--------------------+
| 1. Aamish Live     |      | 2. Enterprise Admin   |      | 3. Enterprise User |
|    Super Admin     |      |    Portal             |      |    (Employee App)  |
| (Platform & Ops)   |      | (HR / Admin at Client)|      | (Mobile / Web)     |
+--------------------+      +-----------------------+      +--------------------+
```

1. **Aamish Live Super Admin Portal**: Platform control panel used by Aamish Operations to onboard enterprises, configure locations, manage & publish daily menus, enforce cutoff times, view aggregated delivery headcounts, and analyze quality CSAT metrics.
2. **Enterprise Admin Portal**: Client-facing portal used by enterprise HR / Office Admins (e.g., Live Technologies Admin) to manage employee rosters (single & bulk CSV upload), assign office delivery branches, and monitor daily meal allocations and company-level reviews.
3. **Enterprise User (Employee) Portal**: Mobile-responsive web interface for employees to view historical, current, and planned meals, opt-in/opt-out before cutoff, and submit CSAT reviews with text, photos, or voice.

---

## 3. Scope of Work (MVP vs. Future Phases)

### 3.1 In-Scope for MVP (Phase 1)
* **Multi-Tenant Foundation**: Enterprise onboarding with multiple physical delivery locations (e.g., Live Technologies: *Notun Bazar*, *Uttarkhan*, *Baridhara/Boran*).
* **Enterprise Admin Accounts**: Multiple admin credentials per enterprise with pre-generated secure credentials.
* **Menu Repository & Publishing**: Menu creation with dual image optimization (desktop large + mobile compressed thumbnail), scheduled date-wise publishing.
* **Platform Cutoff Enforcement**: One Aamish-wide cutoff defaults to 12:05 AM Dhaka time and is configurable from the Aamish dashboard. Daily service publication derives its cutoff automatically.
* **Employee Management**: Single add and CSV/Excel bulk upload with dynamically generated delivery location dropdowns/options.
* **Employee Daily Choice**: Default meal allocation with single-click toggle off (skip meal) before cutoff.
* **Meal Calendar and Review Engine**: Historical, current, and planned meals are visible in one employee calendar. Any previous received meal can be reviewed without a submission expiry using a 1–5 score, text, up to five photos, and an optional voice recording of at most one minute. Reviews are editable for exactly 24 hours after initial submission and then become read-only.
* **Kitchen Aggregation Dashboard**: Tabular real-time matrix (Rows = Menus, Columns = Locations, Values = Quantities) for kitchen and delivery dispatch.

### 3.2 Explicitly Out-of-Scope for MVP (Deferred to Phase 2+)
* **Complex Subsidy & Wallet System**: Variable enterprise subsidies (e.g., 75 BDT company contribution + co-pay from employee wallet). MVP operates on single full-subsidy/fixed company-billed meals.
* **Bidding & Vendor Tender Marketplace**: No dynamic third-party kitchen bidding.
* **Multi-Meal Services**: Breakfast, late-night dinners, and 24-hour shift orders are deferred. The system will handle **Single Daily Meal** (Lunch/Scheduled shift meal).
* **Direct-to-Consumer (D2C) Home Delivery**: Personal meal ordering and a D2C teaser are not part of the MVP employee experience.
* **Automated Dispatch / Courier Tracking**: Real-time driver GPS tracking is deferred; delivery status will be recorded via status markers.
* **Self-Serve Password Resets / SSO**: Initial access uses pre-generated credentials managed by platform/enterprise admins.

---

## 4. Detailed Feature Requirements by Platform

---

### Platform 1: Aamish Live Admin (Super Admin)

#### 4.1 Enterprise Management
* **Create New Enterprise**:
  * Fields: Enterprise Name, Enterprise Code/Slug, Enterprise Logo, Point of Contact (POC) Name (e.g., Head of Procurement/Admin), POC Phone, POC Email, Billing Details.
  * Define Delivery Locations: Add one or more official delivery hubs/branches (e.g., `Notun Bazar Branch`, `Uttarkhan Branch`, `Baridhara Branch`).
* **Manage Enterprise Admins**:
  * Create Admin accounts under an enterprise.
  * Fields: Admin Name, Phone, Email, Pre-generated Username/Password, Assigned Location(s) (optional/all).

#### 4.2 Menu Management
* **Create & Edit Menu Item / Package**:
  * Fields: Menu Title (e.g., "Special Chicken Khichuri", "Bengali Polao Roast"), Description / Item List, Price (configured for future reporting/billing).
  * Media Management:
    * Desktop / Large Screen Image (High Resolution).
    * Mobile Compressed Image / Auto-generated thumbnail for fast mobile web loading.
  * Status: `Draft / Unpublished` vs. `Published`.
* **Menu Calendar & Publishing**:
  * Date Picker: Select date(s) for which the menu is active.
  * Publish Action: Make menu visible to employees for the scheduled dates.

#### 4.3 Logistics & Cutoff Management
* **Platform Cutoff Configuration**:
  * One platform-wide setting is managed by a Super Admin from the Aamish dashboard.
  * The default is `00:05` in `Asia/Dhaka` (12:05 AM on the service date).
  * Daily publishing does not ask for a cutoff; the service timestamp is derived from the service date and platform setting.
  * Changing the setting immediately recalculates every service dated today or later in Dhaka time, including a service whose prior cutoff passed. A later time can therefore reopen a current service and an earlier time can lock it immediately.
  * Services before the current Dhaka date retain their historical cutoff timestamp.

#### 4.4 Aggregated Kitchen & Dispatch Dashboard
* **Real-time Order Matrix (Read-Only)**:
  * Table format with:
    * **Rows**: Menu Items / Packages.
    * **Columns**: Enterprise Delivery Locations.
    * **Cells**: Total headcount / meal count.
  * Total Daily Summary per location for packaging, vehicle loading, and delivery handoff.

#### 4.5 Quality & CSAT Review Dashboard
* **Enterprise & Location Aggregates**:
  * Overall CSAT score (1.0 to 5.0).
  * Total review counts and participation rates (e.g., 38/40 employees reviewed).
  * Flagged low ratings (ratings $\le 3$ highlighted for ops follow-up).
  * Photo gallery view of food quality issues reported by users.

---

### Platform 2: Enterprise Admin Portal

#### 4.6 Authentication & Setup
* Secure login via pre-generated credentials.
* Enterprise profile view displaying configured delivery locations and POC details.

#### 4.7 Employee Roster Management
* **Single Employee Entry**:
  * Fields: Full Name, Employee ID (Unique within enterprise), Email, Delivery Location (dropdown restricted to enterprise's locations).
* **Bulk Upload (CSV / Excel)**:
  * **Dynamic Template Generator**: Enterprise admin downloads a pre-formatted template containing their specific locations in validation dropdowns.
  * **Parser & Validation**: Validates unique Employee ID, valid email, and exact location match with error highlighting for missing fields or misspellings.

#### 4.8 Enterprise Delivery & Feedback Overview
* **Daily Meal Summary**:
  * Breakdown of active meals per branch/location for today and upcoming published days.
* **Company Satisfaction Metric**:
  * Aggregated CSAT score and employee sentiment summary.

---

### Platform 3: Enterprise User (Employee Mobile/Web App)

#### 4.9 Employee Login & Dashboard
* Quick login via Employee ID / company email credentials.
* View a calendar containing historical meals and reviews, today's meal, and planned services with responsive food photography and meal descriptions.

#### 4.10 Meal Preference & Opt-Out (Toggle Off)
* Default Status: Every registered employee is assigned the scheduled daily meal by default.
* **Toggle Action**:
  * If employee does not want the meal (working remotely, on leave, fasting, outside food), employee switches toggle to `OFF` (Skip Meal).
  * If multiple published meals exist, select between Option A / Option B.
* **Cutoff Constraint**:
  * Toggle is active until `Cutoff Time`.
  * Visual countdown timer to Cutoff.
  * When Cutoff is reached, toggle is locked (`Locked for Preparation`).

#### 4.11 Daily Food Review & Quality Feedback
* **CSAT Rating**: 1 to 5 Stars / Smileys (1 = Poor, 5 = Excellent).
* **Backdated Review Submission**: Employees can review any previous opted-in/received meal; there is no submission expiry.
* **Review Editability**: A review can be updated for exactly 24 hours after its initial submission. Updating it does not restart or extend that deadline. Afterward it remains visible but read-only to the employee.
* **Photo Upload**: Attach up to five photos (e.g., plating quality, portion size, or a quality defect).
* **Voice Review**: Attach one optional voice recording with a maximum duration of one minute.
* **Feedback Comment Box**: Freeform notes on taste, portion size, hygiene, or packaging.
* **Review Integrity**: Employees cannot delete reviews. Authorized administrators can read text, photos, and voice only within their role and enterprise scope.

---

## 5. Non-Functional Requirements (NFR)

* **Performance & Mobile Optimization**:
  * Images must be optimized/compressed for mobile 4G/3G networks in Bangladesh.
  * Lightweight web UI with fast load time (< 1.5s on mobile).
* **Design System**:
  * Clean, modern, accessible design system (e.g., Tailwind CSS / modern component architecture).
  * Brand-aligned color palette (Aamish brand guidelines).
* **Security & Data Integrity**:
  * Strict multi-tenant isolation ensuring Enterprise A cannot view Enterprise B's employee or order data.
  * Sanitize bulk CSV/Excel uploads against injection and malformed characters.

---

## 6. Success Metrics for Pilot Phase

| Metric | Target | Measurement |
| :--- | :--- | :--- |
| **System Uptime & Stability** | 99.9% during pilot week | Server monitoring & error logs |
| **Pilot Participation** | $\ge 85\%$ active daily employees | Employee logins & review submissions |
| **Total Pilot Reviews** | $\ge 180 - 200$ reviews in 5 days | Database review count |
| **Headcount Accuracy** | 100% match with kitchen dispatch | Matrix report vs. actual food delivery |
| **Cutoff Compliance** | 0 late toggles accepted post-cutoff | Timestamp audit logs |

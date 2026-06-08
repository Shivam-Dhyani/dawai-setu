# DawaiSetu — Product Requirements Document (PRD)

**Document owner:** Shivam Dhyani
**Status:** Draft v1.0
**Date:** 07 June 2026
**Author role:** Business Analysis

---

## 1. Document Purpose

This PRD defines the complete functional and non-functional scope for **DawaiSetu**, a medicine supply-chain platform. It consolidates the original Doctor Portal feature document and the Pharmacy Portal timeline into a single, buildable specification, fills in gaps identified during analysis, and defines every cross-portal scenario, state machine, data entity, and API surface required for the current phase.

It is written to be the single source of truth for engineering, QA, and design.

---

## 2. Product Summary

DawaiSetu connects **hospitals** with **external pharmacies** to manage the medicine supply chain end-to-end — from a hospital pharmacist requesting stock, to an external pharmacy fulfilling it, to a doctor prescribing and dispensing that stock to patients, including near-expiry and expired stock management on both sides.

There are exactly **two portals**:

1. **Hospital Portal** — used by a hospital's internal staff. Two roles: **Doctor** (prescribes) and **Pharmacist** (dispenses, manages inventory, orders external stock).
2. **Pharmacy Portal** — used by external pharmacies that fulfill the hospital's stock requests and manage their own inventory.

There is **no admin portal** in scope.

---

## 3. Goals & Non-Goals

### 3.1 Goals
- Enable hospitals to request medicine stock from external pharmacies and receive it into a controlled inventory.
- Enforce a **ready-to-use gate** so only verified, received stock can be dispensed to patients.
- Enable external pharmacies to accept/reject orders and keep their inventory in sync automatically.
- Provide doctors a full patient-case (consultation + prescription) workflow tied to the hospital's live inventory.
- Surface near-expiry and expired stock on both portals with reorder paths.
- Compute and **display** all monetary figures (medicine cost, consultation fee, taxes, order totals, invoice figures) on screen.
- Use a flexible **role-based access control (RBAC)** model so permissions can be edited and new roles added later without re-architecting.

### 3.2 Non-Goals (explicitly out of scope this phase)
- **No payment gateway integration.** Money is computed and displayed only.
- **No PDF invoice generation.** Invoice figures are shown on screen; the "print" action renders an on-screen summary, not a generated PDF document.
- **No admin portal / admin UI.**
- No partial order fulfillment (an order is accepted whole or rejected).
- No logistics/shipment tracking beyond the accept → receive → ready-to-use states.

---

## 4. Personas & Roles

| Role | Portal | Responsibilities |
|---|---|---|
| **Doctor** | Hospital | Creates patient cases (consultation + prescription), manages default Rx, prescribes medicines from ready-to-use hospital inventory. |
| **Pharmacist** | Hospital | Requests stock from external pharmacies, receives goods and marks them ready to use, manages hospital inventory, handles near-expiry and expired stock. |
| **Pharmacy (operator)** | Pharmacy | Manages pharmacy inventory, receives and accepts/rejects hospital orders, handles its own near-expiry and expired stock. |

A single hospital may have many doctors and many pharmacists. The two roles share **one Hospital Portal codebase** but see **fixed, role-specific modules** (see §6).

---

## 5. System Architecture (High Level)

- **Hospital Portal** (web app) and **Pharmacy Portal** (web app) are separate frontends served by a **shared backend** and database.
- The backend exposes role-aware APIs. The same medicine master data, geography data (states/cities), and order pipeline are shared across both portals.
- The **order pipeline** is the integration point between the two portals: a hospital pharmacist's order appears in the corresponding pharmacy's "My Orders," and acceptance moves inventory across the boundary.

---

## 6. Role-Based Access Control (RBAC)

### 6.1 Behaviour this phase
- Exactly two roles in the Hospital Portal: **Doctor** and **Pharmacist**, each with **fixed module access** as defined below.
- A user selects their role **at onboarding** (registering as a Doctor or as a Pharmacist).
- The Pharmacy Portal has a single implicit role (**Pharmacy operator**).

### 6.2 Backend design requirement (forward-compatible)
Even though only two fixed roles ship now, permissions must be **data-driven, not hardcoded**:
- A `roles` table and a `permissions` (or `role_permissions`) mapping define which role can access which module/action.
- The backend must expose **role-management and permission-editing APIs** (create role, edit role permissions, assign role to user) so that permissions can be changed and **new roles added later** without code changes.
- These management APIs exist at the backend even though no admin UI consumes them this phase. They should be access-guarded for future use.

### 6.3 Module access matrix (Hospital Portal)

| Module | Doctor | Pharmacist |
|---|---|---|
| Auth (own account) | ✓ | ✓ |
| Profile | ✓ | ✓ |
| Dashboard | ✓ | ✓ |
| Patient Cases Management (prescribe) | ✓ | — |
| Manage Default Rx | ✓ | — |
| Request Medicine Stock (order from pharmacies) | — | ✓ |
| Track Medicine Inventory | — | ✓ |
| Goods Received / Mark Ready-to-Use | — | ✓ |
| Near-Expiry Medicine Stock | — | ✓ |
| Expired Medicine Stock | — | ✓ |

> Doctors can **view** what inventory is available to prescribe (read access needed for patient cases), but inventory **management** actions (ordering, receiving, expiry handling) belong to the Pharmacist. The read needed for prescribing is satisfied via the patient-case medicine lookup, which only returns **ready-to-use** stock.

---

## 7. Domain Glossary

- **Medicine (master):** A catalogue entry (name, "used for" / indication). Shared reference data.
- **Batch:** A physical lot of a medicine with a batch number, expiry date, and quantity. Inventory is tracked at batch level.
- **Hospital Inventory:** Stock held by a hospital, tracked per medicine per batch, each batch carrying a **readiness state**.
- **Pharmacy Inventory:** Stock held by an external pharmacy, tracked per medicine per batch.
- **Order:** A hospital pharmacist's request for medicine stock from one or more pharmacies.
- **Sub-order:** The portion of an order assigned to a single pharmacy (when multiple pharmacies are needed).
- **Patient Case:** A consultation record created by a doctor containing symptoms, diseases, prescribed medicines, dosing, and cost summary.
- **Default Rx:** A doctor's saved default dose/days/frequency/timing for a given medicine, prefilled into patient cases.
- **Near-Expiry:** A batch expiring within the next 3 months.
- **Expired:** A batch past its expiry date.
- **Ready-to-Use:** Inventory state in which stock has been received and confirmed by the pharmacist and may be prescribed/dispensed.

---

## 8. Inventory State Model

Hospital inventory batches move through readiness states. This is central to the ready-to-use gate.

```
                 (pharmacy accepts order)
RECEIVED_PENDING  ────────────────────────►  added to hospital inventory, NOT usable
        │
        │  pharmacist marks "Ready to Use"
        ▼
   READY_TO_USE   ───►  available for doctor to prescribe/dispense
        │
        │  expiry date within 3 months
        ▼
   NEAR_EXPIRY    ───►  still usable; surfaced for reorder
        │
        │  expiry date passed
        ▼
    EXPIRED       ───►  not usable; surfaced for reorder; excluded from prescribing
```

**Rules**
- A batch becomes part of hospital inventory the moment the pharmacy **accepts** the order, but in `RECEIVED_PENDING` — it is **not** prescribable.
- Only `READY_TO_USE` (and not-yet-expired) batches are returned to the doctor for prescribing and counted as dispensable.
- Near-expiry and expired states are derived from the batch expiry date relative to the current date; they can apply on top of a previously ready batch.
- Quantity available to a doctor = sum of `READY_TO_USE` batch quantities that are not expired.

---

## 9. Order Lifecycle (Cross-Portal)

This is the integration spine between the two portals.

```
HOSPITAL (Pharmacist)                         PHARMACY (Operator)
─────────────────────                         ───────────────────
Browse nearby pharmacy
medicine list
      │
Add to cart (Needed Qty,
default 100 if avail > 100)
      │
Place order → system shows
pharmacies that can fulfill
      │
Select pharmacy.
If one can't fulfill fully,
multi-select pharmacies
(order split into sub-orders)
      │
Order placed ─────────────────────────────►  Sub-order appears in "My Orders"
   status: PENDING                                   status: PENDING
                                                          │
                                              Accept ◄────┴────► Reject
                                                 │               │
                          deduct qty from        │               │ status: REJECTED
                          pharmacy inventory      │               │ (hospital notified;
                                                 │               │  pharmacist may reorder
                          add batch(es) to        │               │  / select another pharmacy)
                          hospital inventory      │
                          as RECEIVED_PENDING     │
                                                 ▼
                                          status: ACCEPTED
      │
Pharmacist sees received stock,
marks "Ready to Use"
      │
Hospital batch → READY_TO_USE
Sub-order status: COMPLETED
```

**Key rules**
- **No partial fulfillment.** A pharmacy accepts a sub-order in full or rejects it.
- On **Accept**: quantity is deducted from the pharmacy's inventory and a corresponding batch is created in the hospital's inventory as `RECEIVED_PENDING`. (Batch number and expiry come from the pharmacy's batch being shipped.)
- On **Reject**: no inventory moves. The pharmacist is notified and can reorder or pick another pharmacy for that portion.
- **Multi-pharmacy order:** when no single pharmacy can fulfill the full needed quantity, the pharmacist multi-selects pharmacies. The order is split into independent **sub-orders**, each accepted/rejected on its own. The parent order is `COMPLETED` only when all sub-orders are resolved.
- A sub-order reaches `COMPLETED` only after the pharmacist marks the received stock **Ready to Use**.

### 9.1 Order status enumeration
`PENDING` → `ACCEPTED` → `COMPLETED`, or `PENDING` → `REJECTED`.
Optional terminal: `CANCELLED` (pharmacist cancels while still `PENDING`).

---

## 10. Functional Requirements — Hospital Portal

### 10.1 Auth
A user creates and accesses an account, selecting their role at signup.

**Sign Up (role-aware)**
- Role selector (*) — **Doctor** or **Pharmacist** (drives which fields show and which permission set is assigned)
- First Name (*)
- Last Name (*)
- Email ID (*)
- **Specialization** (*, at least one) — **shown only for Doctor**
- State (*)
- City (*)
- Address (*)
- Pincode (*)
- Phone Number (*, for inquiry)
- Password (*)
- Confirm Password (*)

*Assumption to confirm:* pharmacist signup uses the same fields minus Specialization. If a pharmacist license number is required, add it as a pharmacist-only field.

Endpoints: `GET /roles`, `GET /specialization`, `GET /states`, `GET /cities`, `POST /sign-up`

**Email Verification** — OTP (*, 4-digit). `POST /verify-email`

**Sign In** — Email (*), Password (*). `POST /sign-in`

**Forgot Password** — Email (*) → `POST /send-otp`; OTP (*) → `POST /verify-email`; New Password (*), Confirm New Password (*) → `POST /forget-password`

**Reset Password (logged-in)** — Current Password (*), New Password (*), Confirm New Password (*). `POST /reset-password`
> Note: email is not needed here since the user is authenticated; identity comes from the session/token. (Original doc listed email — dropped as redundant.)

### 10.2 Profile
- View details captured at signup
- Change Address (State, City, Address)
- Change Phone Number
- Toggle Active/Inactive (Doctor availability)
- **Add Consultation Fees** (Doctor only)
- **Default Needed Quantity** setting (Pharmacist-relevant; default 100, editable — drives the cart default in Request Medicine Stock)
- Change Password

Endpoints: `GET /profile`, `POST /update-profile-details` (address, phone, consultation fees, default needed qty), `POST /update-status` (active/inactive)

### 10.3 Dashboard
Counts and graphs of: Total Medicines, Total Patients (doctor), Total Expired Medicines — broken down **day / week / month / quarter / year**, shown as cards and charts.
> Marked "to be updated later" in the source. Treat metrics as role-scoped: a doctor sees patient/prescribing metrics; a pharmacist sees inventory/expiry/order metrics. Detailed metric list to be finalized.

### 10.4 Patient Cases Management *(Doctor)*

**Add Patient Case** — consultation form:
- Patient Name (*)
- Symptoms (*, at least one — select or type)
- Diseases (*, at least one — select or type)
- Medicines (*, at least one — select or type) — **restricted to ready-to-use, non-expired hospital inventory**
- Doses (*) — e.g., once/twice/thrice a day, once in 3 days
- Days (*) — number
- Remarks

Endpoints: `GET /diseases`, `GET /medicines` (ready-to-use only), `GET /get-default-rx`, `POST /save-patient-case`

**Dispensing rule:** saving a patient case that prescribes a medicine should deduct the prescribed quantity from ready-to-use hospital inventory (dispense). *Confirm whether deduction happens at case creation or at a separate dispense step.*

**View Patient Case List** — filterable Day (default) / Week / Month / Year. Columns: Patient Name, Symptoms (badges), Diseases (badges), Medicines (badges), Medication Days Count. `GET /patient-cases-list`

**View Single Patient Case / Consultation Summary** — shown after creating a case (with a Print action) or when selecting from the list:
- Patient Name, Symptoms, Diseases, Medicines, Doses, Days, Remarks
- **Medicine Cost + Consultation Fees + Taxes = Total Cost to pay** (computed and displayed on screen)
- Print action renders an on-screen printable summary (no PDF generation this phase)

Endpoint: `GET /patient-case/:id`

### 10.5 Manage Default Rx *(Doctor)*
For each medicine available to the doctor, save default prescription settings:
- Dose (number)
- Days (number)
- Frequency (dropdown: once/twice/thrice a day, once in 4 days, once a week, etc.)
- When to take (Before/After — Breakfast/Lunch/Dinner)

Endpoints: `GET /available-medicine-list`, `GET /available-medicine/:id`, `PUT /update-default-rx`

### 10.6 Request Medicine Stock *(Pharmacist)*
Pharmacist orders stock from external pharmacies.

**View Medicine List** — medicines available in nearby pharmacies: Medicine Name, Used For, Available Quantity (across nearby pharmacies), Add-to-Cart. `GET /medicine-list-for-available-pharmacy`

**Order Medicines (cart)** — Medicine Name, Used For, Available Quantity, **Needed Quantity** (default 100 when available > 100; default editable from Profile). `POST /pharmacy-list-for-order` (returns pharmacies able to fulfill)

**Select Pharmacy** — list of pharmacies that can fulfill: Pharmacy Name, Total Order Price, Pharmacy Location. Select one; if none can fulfill the full order, multi-select pharmacies (order splits into sub-orders). `POST /place-order`

### 10.7 Track Medicine Inventory *(Pharmacist)*
Medicines currently held by the hospital, with batch detail and readiness state. Surfaces `RECEIVED_PENDING` vs `READY_TO_USE`. Columns: Medicine Name, Used For, Available Quantity, batch breakdown, **Mark Ready-to-Use** action for pending batches. `GET /available-medicine-list`

### 10.8 Goods Received / Mark Ready-to-Use *(Pharmacist)*
Lists batches in `RECEIVED_PENDING` (created when a pharmacy accepted an order). Pharmacist confirms receipt and marks **Ready to Use**, flipping the batch to `READY_TO_USE` and completing the related sub-order.
Endpoint: `PUT /inventory/batch/:id/ready` (or `POST /mark-ready-to-use`)

### 10.9 Near-Expiry Medicine Stock *(Pharmacist)*
Nested list of batches expiring within 3 months. Per medicine: Medicine Name, Used For, Near-Expiry Quantity, **Reorder** button; expandable batch rows (Batch Number, Expiry Date, Near-Expiry Quantity). Reorder adds the medicine to the Request Medicine Stock cart. `GET /near-expiry-medicine-list`, `POST /add-to-cart`

### 10.10 Expired Medicine Stock *(Pharmacist)*
Nested list of expired batches. Per medicine: Medicine Name, Used For, Expired Quantity, **Reorder** button; expandable batch rows (Batch Number, Expiry Date, Expired Quantity). Expired batches are excluded from prescribing. `GET /expired-medicine-list`, `POST /add-to-cart`
> Source doc reused the near-expiry endpoint for the expired list; corrected to a dedicated `GET /expired-medicine-list`.

---

## 11. Functional Requirements — Pharmacy Portal

Modules mirror the Hospital Portal structure (per the timeline: Auth, Profile, Dashboard, My Orders, Medicine Inventory, Near-Expiry, Expiry). Field-level detail is inferred by mirroring the doctor portal where not specified.

### 11.1 Auth
- **Sign Up:** First Name, Last Name, Email (*), Pharmacy Name (*), State (*), City (*), Address (*), Pincode (*), Phone Number (*), Password (*), Confirm Password (*). *(Pharmacy license number recommended — confirm.)* `GET /states`, `GET /cities`, `POST /sign-up`
- **Email Verification:** OTP (4-digit). `POST /verify-email`
- **Sign In:** Email, Password. `POST /sign-in`
- **Forgot Password / Reset Password:** same flow as Hospital Portal.

### 11.2 Profile
View signup details; change Address (State/City/Address), Phone Number, Active/Inactive (pharmacy availability to receive orders), Change Password. `GET /profile`, `POST /update-profile-details`, `POST /update-status`

### 11.3 Dashboard
Counts and graphs (day/week/month/quarter/year, cards + charts): Total Medicines in inventory, Total Orders (received/accepted/rejected), Total Near-Expiry, Total Expired. *(Final metric list TBD, mirroring hospital dashboard.)*

### 11.4 My Orders
Incoming orders (sub-orders) from hospitals. List columns: Hospital Name, Medicines & quantities, Total Order Price, Status, Date. Actions: **Accept** / **Reject** (whole sub-order; no partial).
- **Accept:** deduct quantities from pharmacy inventory (by batch), create the corresponding `RECEIVED_PENDING` batch(es) in the hospital inventory, set sub-order `ACCEPTED`.
- **Reject:** set sub-order `REJECTED`, notify hospital.
Endpoints: `GET /orders`, `GET /order/:id`, `POST /order/:id/accept`, `POST /order/:id/reject`

### 11.5 Medicine Inventory
Pharmacy's own stock by medicine and batch: Medicine Name, Used For, Available Quantity, batch rows (Batch Number, Expiry Date, Quantity, **Price per unit**). Add/edit stock and batches (this is how pharmacy inventory **increases** — pharmacy adds received stock; the hospital side increases only via accepted orders).
Endpoints: `GET /medicine-inventory`, `POST /medicine-inventory` (add batch), `PUT /medicine-inventory/:id`

### 11.6 Near-Expiry
Nested list of pharmacy batches expiring within 3 months (Medicine Name, Used For, Near-Expiry Quantity; batch rows). `GET /near-expiry-medicine-list`

### 11.7 Expiry
Nested list of expired pharmacy batches; excluded from being offered to hospitals. `GET /expired-medicine-list`

---

## 12. Money & Invoice Logic (Display Only)

All monetary values are **computed and shown on screen**; no gateway, no PDF.

- **Order total (stock request):** Σ (line item needed quantity × pharmacy unit price), per pharmacy sub-order, plus taxes if applicable. Shown on Select Pharmacy and My Orders.
- **Patient case total:** `Medicine Cost + Consultation Fees + Taxes = Total Cost to pay`, shown on the consultation summary.
  - Medicine Cost = Σ (prescribed quantity × unit cost) for prescribed medicines.
  - Consultation Fees = from the doctor's profile.
  - Taxes = configurable rate (define rate source; assume a flat configurable % for now).
- **Invoice figures** appear on screen wherever a total is shown; the Print action produces an on-screen printable view only.

---

## 13. Data Model (Key Entities)

> Field-level; not exhaustive of audit columns. `*` = required.

- **User:** id, role_id*, first_name*, last_name*, email* (unique), password_hash*, phone*, state*, city*, address*, pincode*, status (active/inactive), email_verified, hospital_id (for hospital users), specialization[] (doctor only), consultation_fee (doctor), default_needed_qty (pharmacist).
- **Pharmacy:** id, name*, email*, phone*, state*, city*, address*, pincode*, status, email_verified, license_no (confirm).
- **Role:** id, name*, is_system. **Permission / RolePermission:** role_id, module, action (enables editable RBAC + new roles).
- **Medicine (master):** id, name*, used_for/indication.
- **HospitalInventoryBatch:** id, hospital_id*, medicine_id*, batch_no*, expiry_date*, quantity*, readiness_state* (RECEIVED_PENDING / READY_TO_USE), unit_cost, source_pharmacy_id, sub_order_id.
- **PharmacyInventoryBatch:** id, pharmacy_id*, medicine_id*, batch_no*, expiry_date*, quantity*, unit_price*.
- **Order:** id, hospital_id*, created_by (pharmacist user)*, status*, created_at. **SubOrder:** id, order_id*, pharmacy_id*, status*, total_price.
- **OrderLineItem:** id, sub_order_id*, medicine_id*, needed_qty*, unit_price, line_total.
- **PatientCase:** id, doctor_id*, patient_name*, symptoms[]*, diseases[]*, remarks, consultation_fee, tax, medicine_cost, total_cost, created_at. **PatientCaseMedicine:** id, case_id*, medicine_id*, dose*, days*, frequency, when_to_take, dispensed_qty.
- **DefaultRx:** id, doctor_id*, medicine_id*, dose, days, frequency, when_to_take.
- **OTP:** email*, code*, purpose (verify/forgot), expires_at.
- **Notification:** id, recipient, type, payload, read_at.

---

## 14. Notifications (Recommended)

Email infra already exists (OTP). Add event notifications:
- Pharmacy: new incoming order.
- Hospital pharmacist: order accepted / rejected; stock received & awaiting ready-to-use.
- Pharmacist: near-expiry / expired alerts (digest).
*Channel and exact events to confirm; in-app at minimum, email optional.*

---

## 15. Non-Functional Requirements

- **Security/Auth:** token-based sessions; passwords hashed; OTP expiry; all module endpoints guarded by the RBAC permission check.
- **Authorization:** every request validated against `role → module/action`; doctor cannot hit pharmacist endpoints and vice-versa.
- **Data integrity:** inventory moves (accept, mark-ready, dispense) are transactional — no negative stock; concurrent acceptance handled with row locking.
- **Auditability:** record who/when for order accept/reject, mark-ready, and dispense.
- **Geography:** states/cities reference data; "nearby pharmacies" defined by city/pincode proximity (define proximity rule).
- **Performance:** list endpoints paginated; dashboards aggregate server-side.

---

## 16. Open Items / Assumptions to Confirm

1. **Pharmacist signup fields** — same as doctor minus Specialization? Add license number?
2. **Pharmacy license number** — required at pharmacy signup?
3. **Dispense timing** — does saving a patient case immediately deduct ready-to-use stock, or is there a separate dispense action?
4. **Tax rate** — flat configurable %? Source of the rate?
5. **"Nearby" definition** — same city, pincode radius, or state?
6. **Dashboard metrics** — final list per role (source marked "update later").
7. **Multi-pharmacy allocation** — does the pharmacist manually assign quantities per pharmacy, or does the system suggest a split?
8. **Notifications** — in-app only, or email too, and exact trigger list.

---

## 17. Out of Scope (This Phase)

Payment gateway; PDF invoice generation; admin portal; partial fulfillment; shipment/logistics tracking; multi-hospital admin oversight.

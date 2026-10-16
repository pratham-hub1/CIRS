# CIRS — Campus Item Recovery System: Overview

**Document role:** Anchor / source of truth. Every other document in this project derives from this one. If any other document conflicts with this, **this one wins.** Changes here ripple out to all downstream docs.

**Status:** LOCKED (locked 2026-10-08)
**Last updated:** 2026-10-08
**Owner:** Backend team

---

## 1. Purpose & problem

CIRS is a campus lost-and-found management system for GSFC University. Today there is no central record of lost or found items: information moves by word of mouth, or by physically visiting the Security Office. As a result, items are hard to search, ownership is hard to verify, and recovery depends on luck and footwork.

CIRS fixes this by giving the campus a single, searchable, verified record of lost and found items, and a controlled process for returning items to their owners.

The system is built and maintained by a **backend team**. The user interface is built by a separate **frontend team**, working against the API contract this project defines.

## 2. Scope

**In scope**
- The backend services, data, and the API contract that powers the portal.
- Reporting, searching, matching, claiming, verification, status tracking, notifications, admin operations, archiving.

**Out of scope / offline**
- Anything physical: collecting an item, walking to the desk, retrieving it from storage, handing it over in person.
- The frontend UI itself (separate team).

**Portal boundary rule (important)**
The portal only **informs and instructs**. It tells the user what to do and where to go; the physical action is theirs. The portal's involvement in collection ends at marking an item `Ready for Collection` and telling the user where to collect it. No physical-world step is modelled in the system.

## 3. Users & roles

- **Student / Faculty** — report lost items, report found items, search and browse, submit ownership claims, track their own cases, receive notifications.
- **Admin / Security personnel** — review reports and claims, verify ownership, update status, manage storage locations, confirm collection, archive cases.

Role-based access is enforced on every operation.

## 4. Feature set

### 4.1 Core
- University login + role-based access + logout
- Report lost item → unique case ID
- Report found item (with current storage location)
- Search & filter (name, category, keyword, location, date, brand, colour, status)
- Community feed of notices, with sensitive data masked (no phone / email / student ID / ownership proof)
- My Active Cases (own reports, claims, status)
- Submit ownership claim (with proof + supporting documents)
- Risk-based verification (low / medium / high)
- Admin/security claim review (compare details, ask for more, approve/reject, record the result)
- Status tracking (Lost Reported → Found → Ready for Collection → Returned → Archived, or Unclaimed for items never claimed), staff-only, always logged
- Notifications (report submitted, possible match, new claim, more info needed, approved/rejected, ready for collection, returned)
- Admin/security panel (reports, cases, claims, verification, status updates, storage locations, collection confirmation, archiving, records)
- Collection & return (portal part: mark ready + notify location; handover is offline)
- Archive returned cases (kept forever, removed from the active feed)

### 4.2 Added via gap analysis
- **Auto-matching engine** (lost ↔ found) — scoring on category + keywords + date window + location; notifies both sides. *This is the core value feature.*
- **Identity verification mechanism** at handover (a concrete method, not left undefined)
- **Competing-claims / dispute resolution** (multiple claims on one found item; rejection handling)
- **Owner ↔ finder communication channel** (staff-mediated, privacy-consistent)
- **Saved search / watch alerts** (notify when a matching item is posted)
- **Unclaimed found-item lifecycle** (reminders, retention period, disposal/donation policy)
- **User-side lifecycle actions** (edit report, withdraw claim, cancel/close case)
- **Duplicate report handling** (dedup / merge)
- **Notification delivery channels** (in-app + email)
- **Abuse / rate limiting** (spam reports, fake claims)
- **Multi-campus / department tenancy** (designed in from the start)
- **Privacy / data-retention policy** (resolves the "archive forever" vs personal-data tension)
- **Admin analytics** (recovery rate, hotspots, pending claims)
- **Post-return confirmation** ("was it the right item?")

### 4.3 Smart additions
- **Collection token / pickup code** (user shows the code at the desk — makes identity verification concrete, prevents wrong handover)
- **Auto-generated verification questions per category** (risk-based; cuts staff load)
- **Item hold / reservation on claim approval** (prevents double-handover)
- **SLA / escalation timer on pending claims** (addresses the human verification bottleneck)
- **Serial / identifier field for high-value items** (sharper matching + verification)
- **University email domain restriction** (only university emails)
- **Two-way handover confirmation** (staff marks Returned + user confirms receipt)
- **Notification digest** (batch instead of spam)

## 5. Backend vs frontend boundary

**Backend owns:** the data model, business logic, authentication & role-based access, the matching engine, verification workflows, notifications, admin operations, and the API contract.

**Frontend owns:** all UI/UX, screens, client-side validation, and presentation.

**Interface between them:** the API contract (see `04-api-and-auth.md`). This overview fixes *what the system does*; the API document fixes *how it is exposed*.

## 6. Key principles & constraints

- **Locked tech stack** (see `02-tech-stack.md`): Node.js + TypeScript, NestJS (Fastify), PostgreSQL, Prisma, JWT + argon2, S3-compatible storage.
- **Portal boundary rule** — portal informs/instructs only; physical steps stay offline.
- **This document is the source of truth** — no drift from what is decided here.
- **Privacy first** — personal and ownership data is masked on public surfaces.
- **Everything auditable** — status changes and admin actions are logged.
- **Cases are archived forever, never deleted** — subject to the retention policy in `01-requirements.md`.

## 7. Glossary

- **Item** — a lost or found object reported into the system.
- **Case** — a single report (lost or found) with a unique case ID.
- **Claim** — a user's assertion of ownership over a found item, with proof.
- **Match** — a suggested link between a lost report and a found report.
- **Storage location** — where a found item currently sits (Security Office, Library, Laboratory, Department Office, Reception).
- **Status lifecycle** — Lost Reported → Found → Ready for Collection → Returned → Archived; a found item that is never claimed ends at Unclaimed.
- **Verification level** — the risk-based tier of a claim: low / medium / high.

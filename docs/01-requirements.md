# CIRS — Requirements

**Derived from:** `00-overview.md` (locked). This document must not contradict the overview; if it does, the overview wins.
**Status:** LOCKED (locked 2026-10-08)
**Last updated:** 2026-10-08
**Owner:** Backend team

**How to read this.** Functional requirements are organised **feature-wise**. Each has an ID, a statement, and testable acceptance criteria (AC). Features that carry real impact/risk additionally require a **Correctness Contract** before they are finally locked — see section 6. Low-impact items are locked on a sound long-term call, without a formal proof.

---

## 1. Roles & permission matrix

Roles: `STUDENT`, `FACULTY`, `ADMIN` (Admin = security personnel). Student and Faculty currently share the same permissions; they are separate roles so they can diverge later without a schema change.

| Capability | Student | Faculty | Admin |
|---|---|---|---|
| Login / logout | ✓ | ✓ | ✓ |
| Report lost item | ✓ | ✓ | ✓ |
| Report found item | ✓ | ✓ | ✓ |
| Search / browse / community feed | ✓ | ✓ | ✓ |
| Submit ownership claim | ✓ | ✓ | ✗ |
| View own cases & claims | ✓ | ✓ | ✓ |
| View all cases & claims | ✗ | ✗ | ✓ |
| Verify / approve / reject claims | ✗ | ✗ | ✓ |
| Change item status | ✗ | ✗ | ✓ |
| Manage storage locations | ✗ | ✗ | ✓ |
| Confirm collection / handover | ✗ | ✗ | ✓ |
| Archive cases | ✗ | ✗ | ✓ |
| View analytics | ✗ | ✗ | ✓ |

## 2. Functional requirements

### 2.1 Authentication & access

**FR-1 — Login.** A user authenticates with university credentials and receives a session.
*AC:* valid credentials → authenticated session + role; invalid → generic failure (no user enumeration); failed attempts are rate-limited.

**FR-2 — Logout.** A user can end their session.
*AC:* after logout the session/token is invalid and cannot be reused.

**FR-3 — Role-based access enforcement.** Every operation is gated by role per the matrix in section 1.
*AC:* a request without the required role is rejected (403) and never mutates state. Enforcement is centralised, not per-endpoint ad hoc.

**FR-4 — University email restriction.** Only university-domain emails may register/authenticate.
*AC:* a non-university email is rejected at registration and login.

**FR-5 — Session/token lifecycle.** Short-lived access token + refresh token, with expiry and revocation.
*AC:* expired access token is rejected; refresh works only while valid; logout/revocation invalidates refresh.

### 2.2 Reporting

**FR-6 — Report lost item.** A user reports a lost item (name, category, description, date/time, last known location, colour, brand, identifying marks, optional images) and receives a unique case ID.
*AC:* a valid report creates exactly one case with a unique, never-reused case ID; the report is retrievable by the reporter.

**FR-7 — Report found item.** A user (or security) reports a found item with the same details plus found location, images, and current storage location (Security Office, Library, Laboratory, Department Office, Reception).
*AC:* a valid report creates exactly one found case with a unique case ID and a valid storage location.

**FR-8 — Duplicate report handling.** Possible duplicates are detected and flagged, not silently merged.
*AC:* a near-duplicate report surfaces a flag to the reporter and/or staff; merging is an explicit, logged action.

**FR-9 — Edit own report.** A reporter can correct their report within a defined window.
*AC:* edits are allowed only by the owner, only while the case is in a pre-claim state, and each edit is logged.

### 2.3 Discovery

**FR-10 — Search.** Free-text search across reports.
*AC:* search matches name, description, brand, colour, and keywords; results respect privacy masking; results are paginated and bounded.

**FR-11 — Filter.** Filter by category (electronics, wallets, documents, bags, clothing, accessories, stationery, keys, others), location, date, and status.
*AC:* filters combine (AND) and are applied server-side.

**FR-12 — Community feed with privacy masking.** A public feed of current notices with sensitive data hidden.
*AC:* the feed never exposes phone numbers, personal emails, student IDs, or ownership proofs — enforced by **allowlist serialization** (a field is only present if explicitly whitelisted), not by stripping a denylist.

**FR-13 — Saved search / watch alerts.** A user can save a search and be alerted when a matching item is posted.
*AC:* a new matching report triggers an alert to the watcher; the watcher can remove the watch.

### 2.4 Matching

**FR-14 — Auto-match engine.** When a lost or found report is created, the system computes candidate matches against the opposite type and notifies both sides of strong candidates.
*AC:* matching is deterministic for identical inputs, terminates, is bounded, is symmetric (lost→found and found→lost agree), and never crashes on any input. Exact-key matches (e.g. matching serial number) are never missed. See the Correctness Contract in section 6.

### 2.5 Claims

**FR-15 — Submit ownership claim.** A user claims a found item with description, date/place lost, identifying marks, ownership proof, supporting documents, and verification answers.
*AC:* a claim references exactly one found item and one claimant; proof documents are stored and access-controlled.

**FR-16 — Risk-based verification level.** Each claim is assigned a level: low (bottle, notebook, umbrella, stationery), medium (bags, watches, headphones, accessories), high (phones, laptops, tablets, wallets).
*AC:* the level is derived from the item category by a fixed, documented mapping; it determines how much proof and which approvals are required.

**FR-17 — Auto-generated verification questions per category.** The system proposes category-specific verification questions.
*AC:* the question set is determined by category; staff can add/override; the set used is recorded on the claim.

### 2.6 Verification & review

**FR-18 — Admin claim review.** Staff view pending claims, compare details, request more information, approve or reject, and record the outcome.
*AC:* every decision is recorded with actor, timestamp, and reason; requesting more info moves the claim to a pending-info state.

**FR-19 — Competing-claims resolution.** Multiple claims on one found item are handled explicitly.
*AC:* at most one claim can be in the "approved/hold" state for a given found item at any time (see Correctness Contract). Rejections are recorded and, where allowed, appealable.

**FR-20 — Item hold / reservation on approval.** Approving a claim reserves the item.
*AC:* a reserved item cannot be handed to or reserved by anyone else; the reservation is released on rejection/withdrawal/expiry.

**FR-21 — SLA / escalation on pending claims.** Claims pending beyond a threshold are escalated/reminded.
*AC:* a claim exceeding the SLA triggers a staff notification; thresholds are configurable.

### 2.7 Status, collection & lifecycle

**FR-22 — Status tracking.** Item status follows Lost Reported → Found → Ready for Collection → Returned → Archived (or Unclaimed for found items never claimed), changed only by authorised staff and always logged.
*AC:* only transitions in the defined state machine are accepted; an invalid transition is rejected; every change is logged with actor and timestamp.

**FR-23 — Collection token / pickup code.** On approval, the claimant receives a code to present at collection.
*AC:* the code is unique per approved claim, time-bounded, and single-use.

**FR-24 — Two-way handover confirmation.** Staff mark the item Returned; the claimant confirms receipt.
*AC:* the case reaches Returned only when both sides are recorded (or staff override, logged).

**FR-25 — Post-return confirmation.** After return, the user confirms it was the right item.
*AC:* the confirmation is recorded on the case; a negative response flags the case for review.

**FR-26 — Archive.** Returned cases are archived (kept forever, removed from the active feed).
*AC:* archived cases are excluded from active listings/search but remain retrievable by staff; nothing is hard-deleted except per the retention policy.

**FR-27 — Unclaimed found-item lifecycle.** Found items that are never claimed are handled by a defined policy.
*AC:* reminders fire at configured intervals; after a retention period the item moves to a terminal "unclaimed/disposed" state via a logged staff action.

**FR-28 — User-side lifecycle actions.** A reporter can edit (FR-9), withdraw a claim, or cancel/close their own case.
*AC:* each action is allowed only in the valid state and by the owner, and is logged.

### 2.8 Notifications

**FR-29 — Notification events.** Events: report submitted, possible match, new claim, more info needed, claim approved/rejected, ready for collection, item returned.
*AC:* each listed event produces a notification to the correct recipient(s).

**FR-30 — Delivery channels.** In-app notifications plus email.
*AC:* in-app is always produced; email is produced for the same events (subject to user preference).

**FR-31 — Digest.** High-volume notifications can be batched into a digest.
*AC:* digest recipients receive one batched message per period instead of per-event messages.

### 2.9 Communication

**FR-32 — Owner ↔ finder channel (staff-mediated).** Communication between parties happens through staff, consistent with privacy masking.
*AC:* no direct contact details are exposed; messages route through staff/the system only.

### 2.10 Admin panel & analytics

**FR-33 — Admin panel operations.** Staff manage reports, cases, claims, verification, status, storage locations, collection confirmation, archiving, and records.
*AC:* each operation is role-gated and logged.

**FR-34 — Analytics.** Staff can see recovery rate, hotspots, and pending-claim counts.
*AC:* metrics are computed from source data and do not expose private data beyond staff need.

### 2.11 Platform concerns

**FR-35 — Multi-campus / department tenancy.** The data model supports multiple campuses and departments from the start.
*AC:* records are scoped to a campus/department; cross-scope access is prevented by default.

**FR-36 — Abuse / rate limiting.** Spam reports and fake claims are throttled.
*AC:* per-user rate limits apply to reports and claims; violations are logged.

**FR-37 — Audit log.** Status changes and admin actions are recorded.
*AC:* each entry has actor, action, target, timestamp, and before/after where relevant; the log is append-only.

**FR-38 — Privacy masking & data retention.** Personal and ownership data is masked on public surfaces and governed by a retention policy.
*AC:* public surfaces use allowlist serialization (FR-12); retention follows the agreed policy; the tension with "archive forever" is resolved by the policy in section 4.

## 3. Non-functional requirements

**NFR-1 — Performance.** Pages load under 3 s, search results under 2 s, at 500 concurrent users. Search and listing endpoints are paginated and indexed.
**NFR-2 — Security.** Hashed passwords (argon2), input validation, protection from SQL injection and XSS, uploaded-file validation (type, size, content), and an audit log.
**NFR-3 — Availability & backups.** 99% availability target, with backups and consistent data.
**NFR-4 — Scalability.** Supports multiple departments and campuses without redesign.
**NFR-5 — Privacy.** Personal and ownership data is protected and masked on public surfaces.
**NFR-6 — Maintainability.** Modular code with business logic separated from the interface; the API is versioned and documented.
**NFR-7 — Observability.** Health checks, structured logging, and error tracking sufficient to operate the service.

## 4. Constraints, assumptions & retention

- Authentication is first-party (username/password), restricted to university email domains (FR-4). If SSO becomes available, it can replace FR-1 without changing downstream contracts.
- Single campus at launch; the tenancy model (FR-35) is built in from the start so adding campuses is config, not redesign.
- **Retention vs "archive forever":** cases are retained indefinitely in archived form, but *personal data* within them is subject to a retention policy — after the retention window, personal identifiers are anonymised while the case record (for analytics/integrity) is preserved. The exact window is a policy parameter, fixed in configuration and recorded as an open item.

## 5. Out of scope

- All physical actions: collecting, walking to the desk, retrieving from storage, in-person handover (portal boundary rule).
- The frontend UI and client-side behaviour (separate team).

## 6. Features requiring a Correctness Contract (high-impact)

Before final lock, these get a formal Correctness Contract (invariants + enforcement + proof + edge cases + test obligations), housed per the hybrid rule (global invariants in `06-correctness.md`, local proofs in the owning doc):

- **FR-14** Auto-match engine (determinism, termination, symmetry, boundedness, exact-key completeness)
- **FR-19 / FR-20** Competing claims + item hold (mutual exclusion under concurrency)
- **FR-22** Status state machine (totality, determinism, no invalid transitions)
- **FR-23** Collection token (uniqueness, single-use, expiry under concurrency)
- **FR-24** Two-way handover (atomicity of the two-sided confirmation)
- **FR-12 / FR-38** Privacy masking (allowlist-by-construction proof)
- **FR-3** RBAC enforcement (completeness: no endpoint reachable without an authorised role)
- **FR-5** Refresh-token rotation & reuse detection (atomic rotation; replay revokes the family)
- **FR-13 / FR-21 / FR-27 / FR-31** Scheduled jobs & saved-search alerts (exactly-once; no missed/duplicate alerts)

Everything else is locked on a sound long-term call without a formal proof.

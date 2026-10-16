# CIRS — Backend Implementation Log

This log tracks the phase-by-phase implementation progress of the CIRS backend in Antigravity, following `07-build-plan.md`.

---

## Overall Status
- Current Phase: Phase 6 — Lifecycle, collection & return (Completed)
- Next Phase: Phase 7 — Admin, analytics & audit
- Last Updated: 2026-10-16

---

## Phase 0: Foundation (Enabling)
- **Status:** COMPLETED
- **What Was Built:** Fastify NestJS skeleton, Pino logging, Terminus `/health`, centralized error filter, Prisma schema with `INV-DM-1..10`, CI structural checks (`INT-4`, `INT-5`, `INT-6`).
- **Contracts Satisfied:** `INT-4`, `INT-5`, `INT-6`, `INV-DM-1..10`
- **Tests Run & Results:** 4 test suites passed (7 tests), e2e passed, clean build.

---

## Phase 1: Auth, Users & Tenancy
- **Status:** COMPLETED
- **What Was Built:** TenancyService, AuthService (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`), UsersService (`/users/me`, `/users/me/notification-preferences`), global `JwtAuthGuard` and `RolesGuard`.
- **Contracts Satisfied:** `FR-1`..`FR-5`, `FR-35`, `INV-DM-7`, `INT-4`, `INT-6`, `INT-10`.
- **Tests Run & Results:** 8 test suites passed (31 tests), e2e passed, clean build.

---

## Phase 2: Items / Cases
- **Status:** COMPLETED
- **What Was Built:** FilesModule (image upload validation & storage), ItemsModule (case ID generation `CIRS-YYYY-XXXXXX`, lost/found reporting, edit own report, cancel case, case messages).
- **Contracts Satisfied:** `FR-6`..`FR-9`, `FR-28`, `FR-32`, `INV-DM-1`, `INV-DM-6`, `INV-DM-10`.
- **Tests Run & Results:** 10 test suites passed (50 tests), e2e passed, clean build.

---

## Phase 3: Discovery
- **Status:** COMPLETED
- **What Was Built:** SearchModule (community feed with allowlist serialization `serializePublicItem`, multi-field search and AND multi-filter, saved searches / watch alerts).
- **Contracts Satisfied:** `FR-10`..`FR-13`, `INT-4`, `INT-5`, `INT-6`.
- **Tests Run & Results:** 11 test suites passed (56 tests), e2e passed, clean build.

---

## Phase 4: Matching & Notifications
- **Status:** COMPLETED
- **What Was Built:**
  - `NotificationsModule` (`src/modules/notifications/`):
    - `notify`: Multi-channel notification engine with deterministic `eventKey` deduplication (`WF-5`).
    - Respects user preferences (`emailEnabled`).
    - `GET /notifications`: List notifications for authenticated user.
    - `POST /notifications/:id/read` & `POST /notifications/read-all`: Read status management.
  - `MatchingModule` (`src/modules/matching/`):
    - `MatchScorer`: Pure deterministic, strictly symmetric (`score(A, B) === score(B, A)`), bounded in `[0, 1]` scorer combining category (0.4), Jaccard text tokens (0.35), date proximity (0.15), and location similarity (0.1) (`WF-3`).
    - Exact-key completeness: identical non-null serial numbers score exactly `1.0` (`WF-3 e`).
    - `runMatchingForItem`: Triggered post-commit of item creation, computes opposite-type candidates in same campus, upserts match pair using composite `UNIQUE(lostItemId, foundItemId)` (`INV-DM-9`), and notifies both parties (`INT-2`).
    - `evaluateSavedSearches`: Evaluates active saved searches against new reports and emits alerts keyed `SAVED_SEARCH:<searchId>:<itemId>` (`INT-12`).
    - `GET /items/:caseId/matches`: Candidate matches list.
    - `POST /matches/:id/confirm` & `POST /matches/:id/dismiss`: Staff match resolution.
- **Contracts Satisfied:**
  - `WF-3` (Matching engine correctness): Determinism, termination, symmetry, boundedness, exact-key completeness, idempotency, and no-crash safety.
  - `WF-5` (Notification idempotency): Unique deterministic eventKey prevents duplicate alerts on retries or concurrent events.
  - `INT-2` (Report-to-match-to-notify composition): Atomic post-commit matching surfaces candidate matches and notifies both reporters without duplication.
  - `INT-12` (Saved-search alert correctness): Matches evaluated and watchers alerted once per item.
  - `INV-DM-9` (Unique match pair): Pair uniqueness guaranteed by schema and upsert.
- **Tests Run & Results:**
  - `npm test`: 14 test suites passed (72 tests total)
  - `npm run test:e2e`: 1 test suite passed (1 test total)
  - `npm run build`: Clean TypeScript compile with 0 errors

---

## Phase 5: Claims & Verification
- **Status:** COMPLETED
- **What Was Built:**
  - `verification-questions.ts`: Category-based verification question generator (`FR-17`) according to category verification levels (HIGH: ELECTRONICS, WALLETS; MEDIUM: BAGS, ACCESSORIES; LOW: DOCUMENTS, CLOTHING, STATIONERY, KEYS, OTHERS) with mandatory security questions.
  - `ClaimsModule` (`src/modules/claims/`):
    - `POST /claims`: Submit a claim on a found item (`INV-DM-2` itemType === FOUND, blocks duplicate active claims, initializes questions, status PENDING).
    - `GET /claims/my`: List current user's submitted claims.
    - `GET /claims/:id`: Retrieve claim details (claimant or staff).
    - `POST /claims/:id/withdraw`: Claimant withdrawal from PENDING or INFO_REQUESTED (`FR-28`, `WF-2`).
    - `POST /claims/:id/answers`: Claimant answers verification questions (`FR-18`), transitioning INFO_REQUESTED back to PENDING.
    - `POST /claims/:id/appeal`: Submit appeal with justification on a REJECTED claim (`INT-3`).
  - `VerificationModule` (`src/modules/verification/`):
    - `GET /admin/claims`: Staff claim review queue filtered by campus and status.
    - `POST /admin/claims/:id/approve`: Atomic transaction approving claim (`WF-2`), establishing single hold (`INV-DM-4`), advancing item to `READY_FOR_COLLECTION`, generating single-use collection token (`INV-DM-5`), and notifying claimant. Pre-checks and transaction rollback guarantee only one hold exists at any time.
    - `POST /admin/claims/:id/reject`: Rejects claim with required staff reason (`WF-2`), releasing hold if one was assigned and notifying claimant with appeal rights.
    - `POST /admin/claims/:id/request-info`: Requests additional verification answers from claimant (`FR-18`, transitions to INFO_REQUESTED).
    - `POST /admin/claims/:id/decide-appeal`: Staff decision on appeal (`ACCEPTED` reopens claim to `PENDING` for re-verification per `INT-3`; `DENIED` confirms terminal rejection).
- **Contracts Satisfied:**
  - `INV-DM-2` (Found-item claim integrity: claims accepted strictly on FOUND items)
  - `INV-DM-4` (Single active hold per item: at most one claim approved/held per item, competing claims rejected/blocked)
  - `INV-DM-5` (Collection token single-use: token generated atomically on approval)
  - `WF-2` (Claim state machine: PENDING → INFO_REQUESTED / APPROVED / REJECTED / WITHDRAWN; strict valid transitions)
  - `INT-3` (Claim approval to hold to collection handover to return composition & appeal reopening)
  - `INT-4`, `INT-5`, `INT-6` (Security, authorization, tenancy, and role enforcement)
- **Tests Run & Results:**
  - `npm test`: 16 test suites passed (86 tests total)
  - `npm run test:e2e`: 1 test suite passed (1 test total)
  - `npm run build`: Clean TypeScript compile with 0 errors

---

## Phase 6: Lifecycle, Collection & Return
- **Status:** COMPLETED
- **What Was Built:**
  - `lifecycle.state-machine.ts`: Pure domain state machine defining `ITEM_TRANSITION_MAP`, `getNextItemStatus`, and `canTransitionItem` enforcing totality, determinism, validity, and termination (`WF-1`, `INV-DM-3`).
  - `LifecycleService` (`src/modules/lifecycle/lifecycle.service.ts`):
    - `POST /admin/items/:caseId/status`: Advances item status along valid state machine transitions with domain guards and audit logging (`FR-22`, `WF-1`).
    - `POST /admin/items/:caseId/ready`: Marks item `READY_FOR_COLLECTION` after hold verification and notifies claimant (`FR-23`).
    - `POST /admin/items/:caseId/handover`: Staff-side handover recording or logged staff override (`FR-24`).
    - `POST /items/:caseId/confirm-receipt`: Claimant-side receipt confirmation (`FR-24`).
    - Two-way handover atomicity (`WF-4`): Item transitions to `RETURNED` iff both staff handover and claimant receipt are recorded, or via logged staff override.
    - `POST /claims/:id/redeem`: Collection token redemption using atomic conditional update (`INV-DM-5`, `INT-7`). Enforces expiry and single-use, and records staff handover.
    - `POST /claims/:id/post-return-feedback`: Post-return satisfaction feedback (`FR-25`). Negative feedback automatically flags case discrepancy for immediate staff review (`FLAG_RETURN_DISCREPANCY`).
    - `POST /admin/items/:caseId/archive`: Moves returned or closed lost cases to `ARCHIVED` terminal state (`FR-26`).
    - `POST /admin/items/:caseId/unclaimed`: Moves stale found cases to `UNCLAIMED` terminal state (`FR-27`).
  - `ScheduledJobsService` (`src/modules/lifecycle/scheduled-jobs.service.ts`):
    - `escalatePendingClaims`: Identifies claims pending beyond threshold (48h) and notifies campus staff using deterministic event key `SLA_ESCALATION:<claimId>:<date>` (`FR-21`, `INT-11`).
    - `processUnclaimedItems`: Issues reminders at 300 days and flags retention limit at 365 days (`FR-27`, `INT-11`).
    - `processNotificationDigest`: Batches notifications for digest-enabled users (`FR-31`, `INT-11`).
  - `LifecycleController` (`src/modules/lifecycle/lifecycle.controller.ts`):
    - Explicit route-role annotations enforcing RBAC completeness (`INT-4`).
- **Contracts Satisfied:**
  - `WF-1` (Item state machine: totality, determinism, validity, termination)
  - `WF-4` (Two-way handover atomicity: half-completed handover cannot reach RETURNED)
  - `INT-1` (Claim-to-return complete composition)
  - `INT-7` (Cross-module concurrency: atomic collection token redemption)
  - `INV-DM-3` (Item status enum integrity and state-machine transitions)
  - `INV-DM-5` (Collection token unique and single-use)
  - `INT-11` (Scheduled-job exactly-once execution via deterministic keying)
  - `INT-4` (RBAC completeness verified across all lifecycle endpoints)
- **Tests Run & Results:**
  - `npm test`: 18 test suites passed (120 tests total)
    - `test/lifecycle.state-machine.spec.ts` (PASS - valid transitions, invalid transitions rejected, terminal states)
    - `test/lifecycle.service.spec.ts` (PASS - WF-4 two-way handover atomicity, staff override, INV-DM-5 token single-use under concurrency, post-return feedback discrepancy flagging, archiving, unclaimed, INT-11 SLA escalation)
    - `test/structural/int4-route-role.spec.ts` (PASS - all 11 controllers verified)
    - All earlier test suites passed.
  - `npm run test:e2e`: 1 test suite passed (1 test total)
  - `npm run build`: Clean TypeScript compile with 0 errors
- **Next Phase:**
  - Phase 7 — Admin, analytics & audit (`AdminModule`, `AuditModule`, storage location management `FR-33`, analytics computations `FR-34`, append-only audit trail queries `FR-37`, `INT-8`, `INV-DM-8`).



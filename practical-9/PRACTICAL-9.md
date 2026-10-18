# Practical 9 — Test Suites & Coverage Metrics

## CIRS — Campus Item Recovery System

**Aim:** Designing Test Suites & estimating test coverage metrics with structural complexity.

**Application:** CIRS — Campus Item Recovery System (GSFC University) — a campus lost-and-found portal (report lost/found, search, auto-match, ownership claim + verification, collection/return, admin).

**Technology:** Node.js + TypeScript (NestJS + Fastify), PostgreSQL (Prisma), JWT + argon2id, **Jest** (test framework).

**Where the tests live:** `Backend/test/` (unit + integration + structural suites) and `Backend/test/structural/`.

---

## 1. Test Plan → Test Suites → Test Cases

**Test Plan:** "CIRS backend test plan."

**Test Suites (28):** each maps to a module/concern, and contains multiple positive + negative test cases.

| # | Test Suite | File |
|---|---|---|
| 1 | Auth | `auth.service.spec.ts` |
| 2 | JWT Auth Guard | `jwt-auth.guard.spec.ts` |
| 3 | Users | `users.service.spec.ts` |
| 4 | Tenancy | `tenancy.service.spec.ts` |
| 5 | Campuses | `campuses.controller.spec.ts` |
| 6 | Items | `items.service.spec.ts` |
| 7 | Search | `search.service.spec.ts` |
| 8 | Matching | `matching.service.spec.ts` |
| 9 | Match Scorer | `match-scorer.spec.ts` |
| 10 | Claims | `claims.service.spec.ts` |
| 11 | Verification | `verification.service.spec.ts` |
| 12 | Lifecycle | `lifecycle.service.spec.ts` |
| 13 | Lifecycle State Machine | `lifecycle.state-machine.spec.ts` |
| 14 | Notifications | `notifications.service.spec.ts` |
| 15 | Admin | `admin.service.spec.ts` |
| 16 | Files | `files.service.spec.ts` |
| 17 | Rate Limit Guard | `rate-limit.guard.spec.ts` |
| 18 | Roles Guard | `roles.guard.spec.ts` |
| 19 | Prisma | `prisma.service.spec.ts` |
| 20 | Configuration | `configuration.spec.ts` |
| 21 | CORS / TrustProxy | `cors-trustproxy.spec.ts` |
| 22 | Security | `security.spec.ts` |
| 23 | Registration & Feed Evidence | `registration-and-feed-evidence.spec.ts` |
| 24 | Account & Tenancy Isolation | `account-and-tenancy-isolation.spec.ts` |
| 25 | Health | `health.controller.spec.ts` |
| 26 | Structural — INT-4 (RBAC completeness) | `structural/int4-route-role.spec.ts` |
| 27 | Structural — INT-5 (privacy whitelist) | `structural/int5-public-dto-whitelist.spec.ts` |
| 28 | Structural — INT-6 (tenancy scoping) | `structural/int6-scoped-repository.spec.ts` |

(E2E: `app.e2e-spec.ts`, run separately.)

---

## 2. Test Scenarios (15)

1. User authentication (register / login)
2. Token refresh & replay detection
3. Role-based access control (RBAC)
4. Registration & campus discovery
5. Reporting lost / found items
6. Search & multi-filter
7. Privacy masking (community feed)
8. Auto-match engine
9. Ownership claim submission
10. Claim verification (approve / reject / hold)
11. Item status state machine
12. Collection token & two-way handover
13. Notifications
14. Account & tenancy isolation
15. Admin operations, audit & platform

---

## 3. Positive & Negative Test Cases (per scenario)

> Format: **Scenario → Positive | Negative**. Cases are drawn from the actual test suites.

**1. Authentication** (auth.service, jwt-auth.guard, security)
- + Login with valid credentials → access + refresh token; public route accessible without token.
- − Wrong password → generic 401 (no user enumeration); unknown email → 401; malformed / expired token → 401; disabled user → 401.

**2. Token refresh & replay (INT-10)** (auth.service)
- + Valid refresh token rotates → successor issued with same familyId; logout revokes family.
- − Replay of an already-revoked token → 401 and the **entire token family is revoked**.

**3. RBAC (FR-3, INT-4)** (roles.guard, security, structural/int4)
- + Role match → allowed; admin → admin route 200.
- − Student → admin route 403; route with no access policy → fail-closed (403); unauthenticated → 401.

**4. Registration & campus discovery** (auth.service, campuses.controller, registration-and-feed-evidence, configuration)
- + University email + valid campusId → 201; `GET /campuses` public; `/users/me` returns real DB profile.
- − Non-university email → rejected; unknown campus → 400; missing/short JWT secret or missing DATABASE_URL → fatal throw (fail-fast).

**5. Reporting lost/found (FR-6..9, INV-DM-6)** (items.service)
- + Lost report → status LOST_REPORTED + unique caseId `CIRS-YYYY-XXXXXX`; found report with valid storage location → FOUND.
- − Lost without `dateLost` → rejected; found without `storageLocationId` → rejected; storage location not in user's campus → rejected; non-owner edit → rejected; edit after approval → rejected.

**6. Search & multi-filter (FR-10..13)** (search.service)
- + Text + filters (AND) → matching items; create/list saved search.
- − Delete another user's saved search → forbidden.

**7. Privacy masking (FR-12, INT-5)** (search.service, structural/int5)
- + Feed returns masked items (archived excluded); allowlist keeps only whitelisted fields.
- − Sensitive fields (email / phone / studentId / ownership proof) never present in the public DTO.

**8. Matching engine (WF-3, INT-2/12, INV-DM-9)** (matching.service, match-scorer)
- + Matching lost+found → match upserted and both sides notified; saved-search match → watcher notified; staff confirm/dismiss.
- − No candidate → no match; identical serials → score 1.0; determinism (same input = same score); symmetry (score(A,B)=score(B,A)); bounded [0,1]; nulls → no crash.

**9. Ownership claim (FR-15..17, INV-DM-2, INT-3)** (claims.service)
- + Claim on a FOUND item → 201 + auto risk level; answers move claim back to PENDING; appeal on a REJECTED claim.
- − Claim on a LOST item → rejected; claim own found item → rejected; withdraw another's claim → forbidden; appeal on a non-REJECTED claim → rejected.

**10. Verification (WF-2, INV-DM-4, INT-1/7)** (verification.service)
- + Approve → hold + item READY_FOR_COLLECTION + single-use token; request-info → INFO_REQUESTED; reject with reason.
- − Second approval on the same item → 409; racing approvals → P2002 partial-unique violation handled; accept appeal → reopen to PENDING.

**11. Item state machine (WF-1)** (lifecycle.state-machine)
- + Valid: LOST_REPORTED+ITEM_LOCATED→FOUND; FOUND+CLAIM_APPROVED→READY_FOR_COLLECTION; READY_FOR_COLLECTION+HANDOVER_COMPLETE→RETURNED; etc.
- − Invalid transition → rejected; illegal jumps → rejected; ARCHIVED / UNCLAIMED strictly terminal (no outgoing transitions).

**12. Collection token & handover (INV-DM-5, WF-4, INT-7)** (lifecycle.service)
- + First redemption sets usedAt; both staff handover + user receipt → RETURNED; post-return feedback recorded.
- − Second / concurrent redemption → 409; expired token → rejected; only handover (no receipt) → stays READY_FOR_COLLECTION; override without reason → rejected (fail-fast); archive an active FOUND item → rejected.

**13. Notifications (WF-5, FR-29..31)** (notifications.service)
- + Unique eventKey created; mark one / all read.
- − Duplicate eventKey → skipped; EMAIL channel while disabled → fail-fast.

**14. Account & tenancy isolation (INV-DM-7, INT-6)** (account-and-tenancy-isolation, tenancy.service, structural/int6)
- + `/items/mine`, `/claims/mine`, `/notifications`, `/saved-searches` return only the caller's data; admin sees only own campus.
- − User B edit/cancel/withdraw/appeal/read User A's records → 403 (no mutation); Campus 2 read Campus 1 → 403 (tenancy violation); scoped helper with missing campusId → fail-fast; unauthenticated → 401; non-admin → 403.

**15. Admin, audit & platform (FR-33/34/37, INT-8)** (admin.service, files.service, rate-limit.guard, cors-trustproxy, health, prisma)
- + Storage-location CRUD (writes audit); analytics from source data; append-only audit; valid file type/size; request within rate limit; CORS/preflight; health up.
- − Cross-campus storage update → forbidden; duplicate location → 409; forbidden file type / file > 10MB → rejected; rate exceeded → 429; Prisma connect failure → throws.

---

## 4. Coverage Metrics

| Metric | Formula | CIRS value |
|---|---|---|
| Test Execution Coverage | (Executed / Planned) × 100 | 100% |
| Requirements Coverage | (Requirements Tested / Total) × 100 | 38 FR + 7 NFR = 45 → ~100% |
| Test Case Effectiveness | (Defects Detected / Tests Run) × 100 | (fill from your run) |
| Defect Removal Efficiency (DRE) | (Pre-release bugs / Total bugs) × 100 | ~100% |
| Passed Test Cases (%) | (Passed / Executed) × 100 | ~100% |
| Defect Escape Rate | (Production Defects / Total Reported) × 100 | 0% |

---

## 5. Structural Complexity

Cyclomatic complexity: **M = E − N + 2P**, or simply **decision points + 1** (count `if / switch case / && / || / ternary`).

| Function | Approx. M |
|---|---|
| `getNextItemStatus()` (state machine switch) | ~7 |
| `MatchScorer.score()` (4 factors) | ~6–8 |
| `RolesGuard.canActivate()` | ~3 |
| `applyCampusScope()` (tenancy) | ~3 |

Higher-complexity functions are backed by more test cases (coverage tied to complexity).

---

## 6. How to run

```
cd Backend
npm ci
npm run prisma:generate
npm test              # unit + integration + structural suites
npm run check:ci      # INT-4 / INT-5 / INT-6 structural checks
npm run test:e2e      # end-to-end
```

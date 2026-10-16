# CIRS — Build Plan

**Derived from:** `00-overview.md`, `01-requirements.md`, `02-tech-stack.md`, `03-architecture-and-data-model.md`, `04-api-and-auth.md`, `05-workflows.md`, `06-correctness.md` (all locked). Must not contradict them; if it does, the overview wins.
**Status:** LOCKED (locked 2026-10-08)
**Last updated:** 2026-10-08
**Owner:** Backend team

**Purpose.** The execution order for Antigravity: what to build, in what sequence, and what "done" means. This is the last document; it turns the locked design into an ordered, verifiable build.

---

## 1. How we build (carried from the ground rules)

- **Implementation happens in Antigravity**, from these docs. The docs are the source of truth; no silent deviation.
- **Never build in one go — build phase by phase.** Implement strictly one phase at a time (Phase 0 → 8), and run that phase's tests before moving on. Do not scaffold the whole system in a single pass.
- **Prove before lock, proportional to impact.** Correctness-critical work must satisfy its contract (`03`, `05`, `06`) before it is "done".
- **Contracts + tests are part of done** — not a later phase. A feature is finished when its local contract holds, its integration dependencies are consistent, and its test obligations are met.
- **No scope drift.** Anything not in the locked docs is out of scope until decided here and re-locked.

## 2. Phases

> **Do not build in one go.** Work one phase at a time and test each phase before starting the next. A phase is complete only when its exit criteria and tests pass. Log progress in `IMPLEMENTATION-LOG.md` after every phase.

Phases are ordered by dependency: each builds only on what is already solid.

### Phase 0 — Foundation (enabling)
- Repo + NestJS (Fastify) skeleton, config via env, logging (pino), health checks.
- Prisma init + first migration; local PostgreSQL (native install or hosted/managed). **No Docker** — files on local disk, Redis later.
- CI pipeline with the structural checks stubbed: route-role declaration (INT-4), public-DTO whitelist (INT-5), scoped-repository check (INT-6).
- **Exit:** app boots, `/health` green, CI runs, migrations apply cleanly.

### Phase 1 — Auth, users & tenancy
- `AuthModule` (register/login/refresh/logout, argon2id, JWT), `UsersModule`, `TenancyModule`.
- Central `AuthGuard` + `RolesGuard`; campus scoping.
- **FRs:** FR-1…FR-5, FR-3, FR-35. **Contracts:** INT-4, INT-6, INV-DM-7.
- **Exit:** login/logout work; RBAC completeness check passes; tenancy isolation tested.

### Phase 2 — Items / cases
- `ItemsModule`: report lost/found, case-ID generation, edit, cancel.
- Item schema + type-specific CHECKs; images via `FilesModule`.
- **FRs:** FR-6…FR-9, FR-28. **Contracts:** INV-DM-1, INV-DM-6, INV-DM-10.
- **Exit:** a report yields a unique case ID; illegal rows are rejected by the schema.

### Phase 3 — Discovery
- `SearchModule`: search, filter, community feed with **allowlist serializers**.
- **FRs:** FR-10…FR-12. **Contracts:** INT-5.
- **Exit:** public-DTO whitelist check passes; no sensitive field is reachable on public surfaces.

### Phase 4 — Matching & notifications
- `MatchingModule` (scorer + candidate set), `NotificationsModule` (events, channels, digest), saved searches.
- **FRs:** FR-13, FR-14, FR-29…FR-31. **Contracts:** WF-3, WF-5, INT-2, INV-DM-9.
- **Exit:** matching passes determinism/symmetry/idempotency tests; notifications deduplicate.

### Phase 5 — Claims & verification
- `ClaimsModule` (submit, documents, questions), `VerificationModule` (risk level, review, decisions, competing claims, hold, appeals, SLA).
- **FRs:** FR-15…FR-21, FR-32. **Contracts:** WF-2, INT-1 (partial), INT-3, INV-DM-2, INV-DM-4.
- **Exit:** at most one APPROVED claim per item under a concurrency test; appeals reopen correctly.

### Phase 6 — Lifecycle, collection & return
- `LifecycleModule`: item state machine, collection token, two-way handover, archive, unclaimed path; scheduled jobs (SLA, unclaimed reminders, digest).
- **FRs:** FR-22…FR-27. **Contracts:** WF-1, WF-4, INT-1 (complete), INT-7, INV-DM-3, INV-DM-5.
- **Exit:** no invalid transition is accepted; half-completed handover cannot reach `RETURNED`; token is single-use under concurrency.

### Phase 7 — Admin, analytics & audit
- `AdminModule` (panel operations, storage locations, analytics), `AuditModule`.
- **FRs:** FR-33, FR-34, FR-37. **Contracts:** INT-8, INV-DM-8.
- **Exit:** every state change / decision has an audit row; analytics computes from source data.

### Phase 8 — Hardening & deployment prep
- Rate limiting (FR-36), security pass (NFR-2), performance pass (NFR-1), observability (NFR-7), backups (NFR-3).
- **FRs:** FR-36. **NFRs:** NFR-1…NFR-7.
- **Exit:** load test at 500 concurrent users; p95 within targets; deploy runbook ready.

## 3. Milestones

| Milestone | Phases | Exit criteria |
|---|---|---|
| M1 — Foundation ready | 0 | Boots, CI green, migrations clean |
| M2 — Auth + tenancy | 1 | INT-4, INT-6 pass |
| M3 — Reporting live | 2 | INV-DM-1/6/10 pass |
| M4 — Discoverable | 3 | INT-5 passes |
| M5 — Matched & notified | 4 | WF-3, WF-5, INT-2 pass |
| M6 — Claims + verification | 5 | WF-2, INV-DM-4, INT-3 pass |
| M7 — Full lifecycle | 6 | WF-1, WF-4, INT-1, INT-7 pass |
| M8 — Admin + audit | 7 | INT-8, INV-DM-8 pass |
| M9 — Hardened + deployable | 8 | NFR targets met, runbook ready |

## 4. Testing strategy

- **Unit** (Jest): domain logic, state machines, scorer — one test per invariant.
- **Integration / API** (Supertest): endpoints + DB, including the schema constraints (inserts that must fail).
- **Concurrency tests:** racing approvals, token redemptions, status transitions, handovers (INT-7).
- **Property-based tests** for the matcher: determinism, symmetry, boundedness (WF-3).
- **CI structural checks:** route-role declaration (INT-4), public-DTO whitelist (INT-5), scoped repositories (INT-6).
- **Contract tests:** each contract ID has at least one test that would fail if the invariant were violated.

## 5. Definition of Done

A task is done when **all** hold:

1. Its **local contract** (`03`/`05`) is satisfied.
2. Its **integration contracts** (`06`) are satisfied where it meets other modules.
3. Its **test obligations** are written and green.
4. It **audits** where required (INT-8).
5. It does **not contradict** any locked doc.

## 6. Deployment

- Config via env only; secrets never in code (NFR-2).
- Migrations applied as a deploy step; forward-only (INV-DM-8 spirit, `03` §2.5).
- Backups + restore rehearsed (NFR-3); health checks wired to the orchestrator (NFR-7).
- **Deployment target is still open** — the plan is host-agnostic; picking it does not change the design.

## 7. Risks & mitigations

- **Human verification bottleneck** (staff approving claims) → SLA escalation job (FR-21) + auto-generated questions (FR-17).
- **Matching quality** (fuzzy) → we lock determinism/symmetry/exact-key guarantees, not perfection (WF-3); threshold is tunable.
- **Retention policy undefined** → anonymisation hook designed in; window is a config parameter (open item).
- **Frontend token-transport coordination** → flagged in `04` §8; align before Phase 1 completes.

## 8. Open items

- Deployment target / environment.
- Retention window value.
- Rate-limit thresholds.
- Category → verification level mapping confirmation (`03` §4).

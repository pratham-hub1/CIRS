# CIRS — Correctness (Invariant Registry & Integration Contracts)

**Derived from:** `00-overview.md`, `01-requirements.md`, `02-tech-stack.md`, `03-architecture-and-data-model.md`, `04-api-and-auth.md`, `05-workflows.md` (all locked). Must not contradict them; if it does, the overview wins.
**Status:** LOCKED (locked 2026-10-08)
**Last updated:** 2026-10-08
**Owner:** Backend team

**Purpose.** This is the single registry of what must *always* be true, and the proof that the system is correct not just module-by-module but **as a whole**. Local contracts (schema and workflow) are defined in `03` and `05`; this document consolidates them and adds the **integration** and **cross-cutting** contracts that no single module owns. A coding agent can validate an implementation against this list alone.

---

## 1. Global invariant registry

| ID | Invariant (must always hold) | Enforcement | Defined in |
|---|---|---|---|
| INV-DM-1 | Case IDs unique & immutable | `UNIQUE(caseId)` | `03` |
| INV-DM-2 | A claim is always for a FOUND item | composite FK + `CHECK` | `03` |
| INV-DM-3 | Item status is a valid enum value, moved only along the state machine | enum + transition map | `03`, `05` |
| INV-DM-4 | At most one APPROVED claim per found item | partial unique index | `03` |
| INV-DM-5 | Collection token unique & single-use | unique + atomic conditional update | `03` |
| INV-DM-6 | Type-specific fields always present | `CHECK` | `03` |
| INV-DM-7 | Records scoped to a campus | FK + tenancy guard | `03`, this doc |
| INV-DM-8 | Audit log append-only | INSERT-only grant | `03` |
| INV-DM-9 | A lost/found pair appears once in `match` | `UNIQUE(lostItemId,foundItemId)` | `03` |
| INV-DM-10 | A duplicate pointer never forms a self-loop or cycle | self-FK + `CHECK(duplicateOfId <> id)` | `03` |
| WF-1 | Item state machine: totality, determinism, validity, termination | transition map + conditional update | `05` |
| WF-2 | Claim state machine + single approval | transition map + partial unique index | `05` |
| WF-3 | Matching: determinism, termination, symmetry, boundedness, exact-key, idempotency | deterministic scorer + unique pair | `05` |
| WF-4 | Two-way handover atomicity | atomic conditional update | `05` |
| WF-5 | Notification idempotency | unique event key | `05` |
| INT-1…12 | Integration & cross-cutting contracts | see §2–§3 | this doc |

## 2. Integration contracts (interrelated features)

### INT-1 — Claim-to-return composition
**Chain:** `submit claim → verify → approve → hold → issue token → handover → confirm → RETURNED → archive`.
- **Invariants:** (a) an item reaches `READY_FOR_COLLECTION` only if it has exactly one APPROVED claim; (b) a token exists only for an APPROVED claim; (c) `RETURNED` only after the two-way handover (WF-4); (d) `ARCHIVED` only from `RETURNED`.
- **Enforcement:** each step's guard references the previous step's persisted state; the item status transition, claim approval, hold, and token issuance happen in **one transaction**.
- **Proof:** because approval + hold + status change commit atomically, there is no observable intermediate state where the item is `READY_FOR_COLLECTION` without an APPROVED claim, or a token exists without approval. The DB indexes (INV-DM-4, INV-DM-5) hold under concurrency, so the chain cannot be half-applied. Downstream guards (WF-4) require the upstream persisted facts, so the chain is monotone.
- **Edge cases:** approval rolled back → no hold, no token, status unchanged; token expiry before collection → item reverts `READY_FOR_COLLECTION → FOUND` (WF-1) and the claim's hold releases.

### INT-2 — Report-to-match-to-notify composition
**Chain:** `report item → match → notify both sides`.
- **Invariants:** (a) matches are created only for opposite-type pairs; (b) both sides are notified for a surfaced match; (c) re-reporting does not duplicate matches.
- **Enforcement:** matching runs post-commit of item creation; `UNIQUE(lostItemId,foundItemId)` (INV-DM-9) with upsert; notifications keyed (WF-5).
- **Proof:** the unique pair makes duplicate matches unrepresentable; notification keys make duplicate alerts unrepresentable; symmetry (WF-3) means either report order yields the same pair.
- **Edge cases:** a report that matches many items → all pairs created and notified, capped and paginated.

### INT-3 — Reject-to-appeal composition
**Chain:** `reject claim → appeal → re-review`.
- **Invariants:** an appeal exists only for a REJECTED claim; a reopened claim re-enters the claim state machine at PENDING; the single-approval invariant is preserved across reopening.
- **Enforcement:** appeal creation guarded by claim status = REJECTED; reopening is a claim transition (WF-2); approval still guarded by INV-DM-4.
- **Proof:** reopening does not create a second APPROVED claim because approval remains index-guarded; the appeal cannot attach to a non-REJECTED claim by guard.
- **Edge cases:** appeal on an already-approved item's claim → cannot occur (that claim is APPROVED, not REJECTED).

## 3. Cross-cutting contracts

### INT-4 — RBAC completeness
- **Invariant:** every endpoint is reachable only by an explicitly authorised role; no endpoint is accidentally open.
- **Enforcement:** each route declares its allowed roles; a **central guard** enforces them from the verified JWT. A build-time/CI check enumerates every registered route and asserts a role declaration exists — an undeclared route **fails the build**.
- **Proof:** the enumeration is over the framework's own route registry, so a new endpoint cannot escape the check; the check is part of the pipeline, so an unauthorised route cannot be deployed. (Allowlist, not denylist.)
- **Edge cases:** a route that should be public (`/auth/login`, `/health`) declares `public` explicitly — still an explicit declaration, so the rule holds.

### INT-5 — Privacy masking by construction
- **Invariant:** public responses never contain phone, personal email, student ID, or ownership proof.
- **Enforcement:** public endpoints use **allowlist serializers** — a field appears only if explicitly whitelisted; new fields default to excluded. A CI test asserts the public DTO whitelist.
- **Proof:** because output is built from a fixed whitelist, a sensitive field cannot appear unless it is added to the whitelist; adding it is a deliberate, reviewable change. Denylist leaks are impossible by construction.
- **Edge cases:** nested objects/images → the whitelist applies recursively; a leaked upload URL → storage access is separately access-controlled.

### INT-6 — Tenancy isolation
- **Invariant:** no actor can read or write another campus's records.
- **Enforcement:** a central tenancy guard injects the actor's `campusId` into every scoped query; repository access goes through scoped helpers.
- **Proof:** because scoping is central and applied to every query path, an unscoped query is not reachable through the normal data layer. (Pair with a CI check that repositories use scoped helpers.)
- **Edge cases:** cross-campus admin operations (future) → explicit, logged exceptions, not silent widening.

### INT-7 — Cross-module concurrency
- **Invariant:** contended operations (two approvals, two token redemptions, two status transitions, two handovers) resolve to exactly one winner; the loser is rejected, never silently applied.
- **Enforcement:** atomic conditional updates (`WHERE state = expected`) + the relevant unique indexes (INV-DM-4, INV-DM-5).
- **Proof:** an atomic conditional update affects either 0 or 1 row; unique indexes make duplicate terminal states unrepresentable. Therefore two concurrent attempts cannot both succeed, and a failed attempt leaves state unchanged.
- **Edge cases:** retry after a lost race → re-reads state and either re-validates or is rejected by the guard.

### INT-8 — Audit completeness
- **Invariant:** every status change, claim decision, and admin action is logged.
- **Enforcement:** all such operations route through a single service that writes `audit_log` in the same transaction as the change (INV-DM-8).
- **Proof:** because the write is transactional with the change, there is no committed state change without a corresponding audit row; the append-only grant (INV-DM-8) prevents removal.
- **Edge cases:** failed operations (rolled back) → no audit row, correctly, since no change occurred.

### INT-9 — System-wide idempotency
- **Invariant:** replayed requests (retries, duplicate deliveries) do not create duplicate effects.
- **Enforcement:** `Idempotency-Key` on unsafe operations; unique keys for matches (INV-DM-9), notifications (WF-5), and tokens (INV-DM-5).
- **Proof:** each effect has a uniqueness key; a replay collides with the key and is a no-op or a benign conflict.
- **Edge cases:** same key, different payload → rejected as a conflict.

### INT-10 — Refresh-token rotation & reuse detection
- **Invariants:** (a) rotation is atomic — a refresh consumes the presented token and issues exactly one successor, or does nothing; (b) a consumed/revoked token can never be used again; (c) reuse of a token that has already been rotated revokes the whole token family.
- **Enforcement:** rotation runs in one transaction — a conditional update `UPDATE refresh_token SET revokedAt=now(), replacedById=<new> WHERE id=? AND revokedAt IS NULL` plus an insert of the successor with the same `familyId`. If the update affects **0 rows**, the token was already consumed → treat as reuse → revoke the family.
- **Proof:** the conditional update affects 0 or 1 row, so a token is consumed at most once even under concurrent refresh (mutual exclusion). Reuse makes the update affect 0 rows, which the handler maps to family revocation, so a stolen-and-replayed token cannot yield a new session (fail-closed). (FR-5, FR-2.)
- **Edge cases:** two concurrent refreshes with the same token → one wins, the other sees 0 rows → family revoked; logout revokes the family.

### INT-11 — Scheduled-job exactly-once
- **Invariant:** each scheduled job processes each due target at most once per period, and never double-applies an effect.
- **Enforcement:** every job effect carries a deterministic key `(jobType, targetId, period)` with a uniqueness constraint (or a `processedAt` marker set by a conditional update). Jobs are idempotent: re-running is a no-op for already-processed targets.
- **Proof:** the unique key makes a second application for the same (job, target, period) unrepresentable; a crashed-and-restarted job re-scans and skips processed targets. Applies to SLA escalation (FR-21), unclaimed retention (FR-27), and digest (FR-31).
- **Edge cases:** overlapping runs → key collision, one applies; late targets → picked up next period.

### INT-12 — Saved-search alert correctness
- **Invariant:** an alert fires **iff** a newly created item matches an active saved search — no missed alerts, no duplicates.
- **Enforcement:** on item creation (post-commit), evaluate all active saved searches in the item's campus; for each match emit an alert keyed `(savedSearchId, itemId)` with a uniqueness constraint (WF-5 keying).
- **Proof:** evaluation runs for every new item (no miss); the unique key makes duplicates unrepresentable (no repeat). Symmetric to INT-2.
- **Edge cases:** many watchers → capped and batched by digest (INT-11); a deactivated search is skipped.

## 4. How a coding agent uses this

1. Implement each module; satisfy its **local contract** (`03`, `05`).
2. Satisfy the **integration contracts** (§2) where modules meet.
3. Satisfy the **cross-cutting contracts** (§3) globally.
4. CI enforces the structural checks: route-role declaration (INT-4), public DTO whitelist (INT-5), scoped repositories (INT-6).
5. Every contract lists its **test obligations**; those tests are part of done.

## 5. Honest limits

Proof here eliminates **design-level** failure — logic, concurrency, integrity, illegal states. It does not eliminate third-party outages, ops misconfiguration, or small implementation bugs. Fuzzy quality (match relevance) is bounded by the guarantees in WF-3, not proven perfect. Target: **the system must not break by design.**

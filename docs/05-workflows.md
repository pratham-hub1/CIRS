# CIRS — Workflows

**Derived from:** `00-overview.md`, `01-requirements.md`, `02-tech-stack.md`, `03-architecture-and-data-model.md`, `04-api-and-auth.md` (all locked). Must not contradict them; if it does, the overview wins.
**Status:** LOCKED (locked 2026-10-08)
**Last updated:** 2026-10-08
**Owner:** Backend team

**Purpose.** Fix the behaviour of every stateful flow and prove each one correct *on its own* (local contracts). Cross-cutting / interrelated proofs live in `06-correctness.md` and reference these by ID.

---

## 1. Item status state machine (FR-22)

States: `LOST_REPORTED`, `FOUND`, `READY_FOR_COLLECTION`, `RETURNED`, `ARCHIVED`, and `UNCLAIMED` *(added to `03` — see §7)*.

**Start state by type:** a `LOST` item starts at `LOST_REPORTED`; a `FOUND` item starts at `FOUND`.

### Transition table

| From | Event | To | Guard / actor |
|---|---|---|---|
| LOST_REPORTED | item located / matched | FOUND | staff-confirmed |
| LOST_REPORTED | close | ARCHIVED | owner or staff |
| FOUND | claim approved | READY_FOR_COLLECTION | claim is APPROVED (creates hold) |
| READY_FOR_COLLECTION | claim reverted | FOUND | claim rejected / withdrawn / token expired |
| READY_FOR_COLLECTION | handover complete | RETURNED | two-way handover (§4) |
| RETURNED | archive | ARCHIVED | post-return handled |
| FOUND | retention elapsed | UNCLAIMED | staff action after policy window |

**Terminal states:** `ARCHIVED`, `UNCLAIMED` (no outgoing transitions).

Only authorised staff trigger transitions; every change writes an `audit_log` row.

### WF-1 — Item state machine correctness

- **Invariants:** (a) *totality* — every (state, event) pair relevant to a state has a defined outcome or is explicitly rejected; (b) *determinism* — each accepted (state, event) maps to exactly one next state; (c) *validity* — any transition not in the table is rejected; (d) *termination* — every path reaches a terminal state.
- **Enforcement:** `status` is a DB enum; the transition map is a single source of truth in the domain layer; the status-change service accepts only (currentState, event) → nextState from that map; `audit_log` records before/after.
- **Proof:** the enum forbids unknown states. The map is a total function over *accepted* (state, event) pairs; by construction the service cannot compute a next state outside the table, so invalid transitions are unrepresentable. Each state's out-edges are finite and acyclic (all edges move toward `RETURNED`/`ARCHIVED`/`UNCLAIMED` or revert to `FOUND`), so no cycle without progress and every path terminates.
- **Edge cases:** concurrent transitions on one item → guarded by an atomic conditional update `WHERE status = expected`; the loser's update affects zero rows and is rejected. Revert loops are bounded (revert only from `READY_FOR_COLLECTION` to `FOUND`, and re-approval re-enters the same bounded path).

## 2. Claim state machine (FR-15, FR-18, FR-19)

States: `PENDING`, `INFO_REQUESTED`, `APPROVED`, `REJECTED`, `WITHDRAWN`.

| From | Event | To | Actor |
|---|---|---|---|
| PENDING | staff requests info | INFO_REQUESTED | staff |
| INFO_REQUESTED | claimant answers | PENDING | claimant |
| PENDING | staff approves | APPROVED | staff |
| PENDING | staff rejects | REJECTED | staff |
| INFO_REQUESTED | staff rejects | REJECTED | staff |
| PENDING / INFO_REQUESTED | claimant withdraws | WITHDRAWN | claimant |
| REJECTED | appeal accepted | PENDING | staff |

**Terminal states (for a claim's own life):** `APPROVED`, `REJECTED`, `WITHDRAWN` (an appeal can reopen a `REJECTED` claim).

### WF-2 — Claim state machine correctness

- **Invariants:** totality, determinism, validity, and — critically — **at most one `APPROVED` claim per item** (INV-DM-4).
- **Enforcement:** `status` enum; transition map in the domain layer; approval is an atomic conditional update that additionally relies on the partial unique index `UNIQUE(itemId) WHERE status='APPROVED'`.
- **Proof:** transition validity follows as in WF-1. The single-approval invariant is guaranteed by the database index, so even if two approvals race, at most one row can be `APPROVED`; the losing update raises a unique violation and is rejected (mapped to `409`).
- **Edge cases:** approve-after-withdraw → transition map rejects; two approvals racing → one wins by index; appeal on a non-`REJECTED` claim → rejected by guard.

## 3. Matching engine (FR-14)

**Trigger:** when an item is created, compute candidate matches against items of the opposite type in the same campus.

**Candidate set (bounded):** opposite type, same campus, `|dateLost − dateFound| ≤ W` (window W), category match or adjacent. Scoring uses: category (exact), keyword overlap (name/description tokens), date proximity, location similarity. `score ∈ [0,1]`.

**Output:** `match` rows with `score ≥ T` (threshold T), status `SUGGESTED`; both sides notified.

### WF-3 — Matching engine correctness

- **Invariants:** (a) *determinism* — identical inputs produce identical scores and ordering; (b) *termination* — the computation finishes; (c) *symmetry* — `score(lost, found) = score(found, lost)`; (d) *boundedness* — candidate set is finite and score is in [0,1]; (e) *exact-key completeness* — if `serialNumber` is non-null and equal, the pair is surfaced; (f) *idempotency* — re-running never creates duplicate pairs; (g) *no-crash* — nulls/empty fields are handled.
- **Enforcement:** deterministic tokenizer + fixed integer weights; stable sort with a tie-breaker on `(lostItemId, foundItemId)`; candidate prefilter by campus/type/date; `UNIQUE(lostItemId, foundItemId)` with upsert; explicit null handling.
- **Proof:** with fixed weights and a deterministic tokenizer, the score is a pure function of the two records → same inputs give the same output (a). The candidate set is finite (campus + type + date window) and scoring is O(1) per pair → termination (b). Scoring uses each field in a symmetric way (a keyword set and a date difference are symmetric), so swapping arguments leaves the score unchanged (c). Normalised score is in [0,1] and the candidate set is finite → boundedness (d). The exact-key rule sets score to 1 when serials are equal and non-null, so such a pair always clears T (e). Upsert on the unique pair makes re-runs idempotent (f). Null-safe comparisons remove the crash class (g).
- **Honest limit:** *relevance quality* (is this a "good" match?) is not provable; we lock the guarantees above, not a claim of perfect matching.
- **Edge cases:** many candidates → capped and ranked, paginated; ties → broken deterministically; both serials null → falls back to fuzzy score.

## 4. Collection, handover & return (FR-23, FR-24, FR-25)

1. Staff **approve** claim → hold created (INV-DM-4) + item `FOUND → READY_FOR_COLLECTION` + **collection token** issued (INV-DM-5) + claimant notified with the location.
2. Claimant collects **offline** (portal boundary rule — no physical step modelled).
3. Staff **redeem** the token (single-use) → handover recorded (`handoverAt`).
4. Claimant **confirms receipt** (`receiptConfirmedAt`) → item `READY_FOR_COLLECTION → RETURNED` only when **both** sides are recorded, or via a logged staff override.
5. **Post-return feedback** recorded (FR-25).

### WF-4 — Two-way handover atomicity

- **Invariant:** the item reaches `RETURNED` iff (handover recorded AND receipt confirmed) OR a logged staff override — never on a half-completed handover.
- **Enforcement:** the transition to `RETURNED` is an atomic conditional update `WHERE status='READY_FOR_COLLECTION' AND ((handoverAt IS NOT NULL AND receiptConfirmedAt IS NOT NULL) OR handoverOverrideBy IS NOT NULL)`.
- **Proof:** the guard is evaluated inside the update's WHERE clause, so a half-completed handover cannot satisfy it; the update is atomic, so two concurrent completions cannot both flip the state (the second affects zero rows). Override is an explicit, logged branch.
- **Edge cases:** user confirms before staff handover → guard not satisfied, state unchanged; double confirm → idempotent (no state change after first).

## 5. Verification flow (risk-based) (FR-16, FR-17)

- On claim submission, the **verification level** is derived from the category mapping in `03` §2.3 (LOW / MEDIUM / HIGH).
- The system generates **category-specific verification questions** (FR-17); staff may add/override; the set used is recorded on the claim.
- Staff review per level: LOW = simple confirmation; MEDIUM = extra description required; HIGH = staff approval. Decision recorded (WF-2).

## 6. Notifications flow (FR-29, FR-30, FR-31)

- **Events → recipients:** report submitted → reporter; possible match → both sides; new claim → staff; more info needed → claimant; approved/rejected → claimant; ready for collection → claimant; item returned → reporter/claimant.
- **Channels:** in-app always; email per preference. **Digest** batches high-volume events (FR-31).

### WF-5 — Notification idempotency

- **Invariant:** a single logical event does not produce duplicate notifications.
- **Enforcement:** a deterministic event key (type + target + recipient + causal id) with a uniqueness constraint; delivery retries reuse the key.
- **Proof:** the unique key makes a second notification for the same logical event unrepresentable, so retries are safe.

## 7. Amendment to `03` (resolved)

FR-27 requires a terminal **unclaimed/disposed** state, but the locked `ItemStatus` enum in `03` has only `LOST_REPORTED, FOUND, READY_FOR_COLLECTION, RETURNED, ARCHIVED`. To keep "archive = returned cases only" (per the overview), the unclaimed path needs its own state.

**Resolved (2026-10-08):** `UNCLAIMED` was added to `ItemStatus` in `03` as a one-line amendment; the rest of `03` is unaffected. `ARCHIVED` remains reserved for returned cases.

## 8. Local Correctness Contracts summary

| ID | Contract | Owning doc |
|---|---|---|
| WF-1 | Item state machine (totality, determinism, validity, termination) | here |
| WF-2 | Claim state machine + single-approval | here |
| WF-3 | Matching engine (determinism, termination, symmetry, boundedness, exact-key, idempotency) | here |
| WF-4 | Two-way handover atomicity | here |
| WF-5 | Notification idempotency | here |
| INV-DM-1…10 | Schema-level invariants | `03` |

Integration contracts that compose these (e.g. `claim → approve → hold → token → handover → status`) are proven in `06-correctness.md`.

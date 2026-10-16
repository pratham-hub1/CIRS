# CIRS — Implementation Log (for Antigravity agents)

**Purpose.** This is the implementation-side working log. Update it **after every phase** — and after any significant change — so that a new conversation can pick up the exact state of the build without losing context. It records what is built, what is pending, which contracts are satisfied, and what to do next.

**This file is meant to be written to.** Unlike the locked corpus, you edit this file freely.

---

## How to use this log

1. **Before you start:** read the entire locked corpus in `/docs` (`00-overview.md` … `07-build-plan.md`). `00-overview.md` is the anchor — if anything conflicts, it wins.
2. **Build phase by phase.** Never build in one go. One phase at a time, per `07-build-plan.md` §2.
3. **Test each phase** before starting the next. A phase is done only when its exit criteria and tests pass (`07-build-plan.md` §5 Definition of Done).
4. **After each phase:** fill in that phase's entry below and update the "Current status" table.
5. **Never invent.** If a document is silent or an open item applies, stop and ask — do not assume.
6. **Resuming after switching conversations:** read the corpus, then read "Current status" and the last phase entry here, then continue from "Next".

## Current status

| Phase | Name | Status | Contracts targeted | Notes |
|---|---|---|---|---|
| 0 | Foundation | not started | — | |
| 1 | Auth, users & tenancy | not started | INT-4, INT-6, INV-DM-7 | |
| 2 | Items / cases | not started | INV-DM-1, INV-DM-6, INV-DM-10 | |
| 3 | Discovery | not started | INT-5 | |
| 4 | Matching & notifications | not started | WF-3, WF-5, INT-2, INV-DM-9 | |
| 5 | Claims & verification | not started | WF-2, INT-1(part), INT-3, INV-DM-2, INV-DM-4 | |
| 6 | Lifecycle, collection & return | not started | WF-1, WF-4, INT-1, INT-7, INV-DM-3, INV-DM-5 | |
| 7 | Admin, analytics & audit | not started | INT-8, INV-DM-8 | |
| 8 | Hardening & deployment prep | not started | NFR-1…7 | |

**Status values:** `not started` · `in progress` · `blocked` · `done`

## Open items (resolve with the human — do NOT invent)

- Deployment target / environment.
- Retention window value.
- Rate-limit thresholds.
- Category → verification level mapping (`03` §4).
- Token transport: response body vs HttpOnly cookie (`04` §8).

## Phase log

### Phase 0 — Foundation
- **Status:** not started
- **Built:**
- **Contracts satisfied:**
- **Tests run / results:**
- **Blockers / questions:**
- **Next:**

### Phase 1 — Auth, users & tenancy
- **Status:** not started
- **Built:**
- **Contracts satisfied:**
- **Tests run / results:**
- **Blockers / questions:**
- **Next:**

### Phase 2 — Items / cases
- **Status:** not started
- **Built:**
- **Contracts satisfied:**
- **Tests run / results:**
- **Blockers / questions:**
- **Next:**

### Phase 3 — Discovery
- **Status:** not started
- **Built:**
- **Contracts satisfied:**
- **Tests run / results:**
- **Blockers / questions:**
- **Next:**

### Phase 4 — Matching & notifications
- **Status:** not started
- **Built:**
- **Contracts satisfied:**
- **Tests run / results:**
- **Blockers / questions:**
- **Next:**

### Phase 5 — Claims & verification
- **Status:** not started
- **Built:**
- **Contracts satisfied:**
- **Tests run / results:**
- **Blockers / questions:**
- **Next:**

### Phase 6 — Lifecycle, collection & return
- **Status:** not started
- **Built:**
- **Contracts satisfied:**
- **Tests run / results:**
- **Blockers / questions:**
- **Next:**

### Phase 7 — Admin, analytics & audit
- **Status:** not started
- **Built:**
- **Contracts satisfied:**
- **Tests run / results:**
- **Blockers / questions:**
- **Next:**

### Phase 8 — Hardening & deployment prep
- **Status:** not started
- **Built:**
- **Contracts satisfied:**
- **Tests run / results:**
- **Blockers / questions:**
- **Next:**

## Decision changes

*(Record any deviation, resolved open item, or decision made during implementation — with the reason. Should stay empty if the corpus is being followed exactly.)*

## Change log

- *(Add a dated line per phase or significant change.)*

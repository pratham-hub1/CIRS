# CIRS — Backend Document Corpus (Start Here)

**What this is.** The locked design corpus for the **CIRS — Campus Item Recovery System** backend (GSFC University). Implementation happens elsewhere (Antigravity); these documents are the source of truth. This file tells you how to read the corpus and how to build from it.

**Scope reminder.** Backend only. The frontend is a separate team; we expose an API and nothing else.

---

## 1. Reading order (do this first, fully, before writing code)

1. **`00-overview.md`** — the anchor. Read it completely first. If any document conflicts with it, **the overview wins.**
2. **`01-requirements.md`** — what the system must do (FR-1…38, NFR-1…7), feature-wise with acceptance criteria.
3. **`02-tech-stack.md`** — the locked stack (TypeScript / NestJS / PostgreSQL / Prisma / JWT+argon2 / S3 / Redis-later).
4. **`03-architecture-and-data-model.md`** — layers, modules, folder structure, tables, enums, and schema-level invariants (INV-DM).
5. **`04-api-and-auth.md`** — the API contract (endpoints, request/response, status codes, RBAC) and the auth/security model.
6. **`05-workflows.md`** — the state machines, matching engine, collection/handover, notifications, and local contracts (WF).
7. **`06-correctness.md`** — the global invariant registry and the integration / cross-cutting contracts (INT). This is the checklist to validate an implementation against.
8. **`07-build-plan.md`** — the build order (phases), milestones, testing strategy, and the Definition of Done.

**Companion (edit this one):** **`IMPLEMENTATION-LOG.md`** — the phase-by-phase progress log. Update it after every phase.

## 2. Document map — open which document when

| When you need to know… | Open |
|---|---|
| What the system is, scope, boundary, feature set | `00-overview.md` |
| What it must do (requirements) | `01-requirements.md` |
| Which tech and why | `02-tech-stack.md` |
| Tables, fields, enums, constraints, migrations | `03-architecture-and-data-model.md` |
| An endpoint, its role, its request/response, auth | `04-api-and-auth.md` |
| How a flow/state machine behaves | `05-workflows.md` |
| What must *always* be true, and how it is enforced | `06-correctness.md` |
| What to build next, and when a task is done | `07-build-plan.md` |
| Where to log progress | `IMPLEMENTATION-LOG.md` |

## 3. Golden rules

- **`00-overview.md` is the anchor.** Conflicts resolve in its favour.
- **The documents are locked.** Do not change them. Log your progress in `IMPLEMENTATION-LOG.md` instead.
- **Build phase by phase.** One phase at a time (Phase 0 → 8), and test each phase before starting the next. **Never build in one go.**
- **Prove before done.** Satisfy the contracts — local (INV-DM, WF) and integration/cross-cutting (INT) — plus their tests.
- **Never invent.** If a document is silent, or an open item applies, **stop and ask**; do not assume.
- **Secrets:** environment variables only.

## 4. Open items (resolve with the human — do NOT invent)

- Deployment target / environment.
- Retention window value.
- Rate-limit thresholds.
- Category → verification level mapping (`03` §4).
- Token transport: response body vs HttpOnly cookie (`04` §8).

## 5. API contract for the frontend team

- **Human-readable:** `04-api-and-auth.md`.
- **Machine-readable:** the auto-generated **OpenAPI / Swagger** from the running NestJS app.

Hand the frontend team `04-api-and-auth.md` (plus `00-overview.md` for context); they consume the generated OpenAPI for the actual integration.

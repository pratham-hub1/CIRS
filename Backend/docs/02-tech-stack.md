# CIRS — Tech Stack

**Derived from:** `00-overview.md` (locked). Must not contradict it; if it does, the overview wins.
**Status:** LOCKED (locked 2026-10-08)
**Last updated:** 2026-10-08
**Owner:** Backend team

**Purpose.** Fix the tooling so implementation in Antigravity is unambiguous. This document is the authority for stack choices; every other document assumes it. A stack choice is a **decision argued on long-term grounds**, not a formal correctness proof — per the impact-proportional rule, proofs apply to correctness-critical *features*, not to tool selection.

---

## 1. Locked stack

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Compile-time type safety, safe refactoring, and a self-documenting API contract for the frontend handoff |
| Runtime | **Node.js** (current LTS) | Mature, fast for I/O-bound work; pairs with the language choice |
| Framework | **NestJS** (Fastify adapter) | Modules, dependency injection, guards for RBAC, validation pipes, auto-generated Swagger; Fastify for throughput |
| Database | **PostgreSQL** | Relational fit (users, items, claims, notifications, M:N matches), strong constraints, built-in full-text search, JSONB for flexible fields |
| ORM / migrations | **Prisma** | Type-safe client, schema-as-source-of-truth, first-class migrations |
| Auth | **JWT** (short-lived access + refresh) + **argon2id** hashing + RBAC guards | Stateless API auth that fits a separate frontend; argon2id for password hashing |
| Validation | **class-validator + class-transformer** (Nest-native); **zod** where useful | Declarative DTO validation at the boundary |
| File storage | **S3-compatible** (MinIO self-host or cloud); local disk for dev | Clean interface for images and ownership proofs; swappable, future-proof |
| Cache / queue (later phase) | **Redis** | Caching, rate limiting, sessions, and background jobs — added when needed, not up front |
| API docs | **OpenAPI / Swagger** (auto-generated) | The API contract handed to the frontend team, generated from code |
| Logging / observability | Structured logging (pino), health checks (Nest Terminus) | Operability (NFR-7) |
| Testing | **Jest** (unit) + **Supertest** (API/e2e) | Test obligations from the Correctness Contracts |
| Local environment | **No Docker.** Native PostgreSQL (local install or hosted/managed); files on local disk; Redis later. | Lighter footprint; nothing in the design depends on Docker |

## 2. Rationale for the key choices

**TypeScript over plain JavaScript.** JS would run, but this backend has many entities, RBAC rules, and correctness-critical flows where errors would otherwise surface at runtime. TypeScript moves those to compile time, makes a multi-person codebase safer to refactor, and turns the API contract into types the frontend team can rely on. Cost (build step, mild learning curve) is worth it long-term.

**NestJS over bare Express/Fastify.** The value is structure: modules, dependency injection, guards (which *are* the RBAC mechanism), and validation pipes — all of which map directly to requirements (FR-3 RBAC, FR-5 tokens, FR-12 masking DTOs). Bare Express is lighter but leaves all structure to convention, which erodes in a team project. NestJS on Fastify keeps runtime overhead low while giving enforced structure.

**PostgreSQL over MySQL / MongoDB.** The domain is relational and integrity-sensitive (a claim belongs to a found item; a case has one status; users submit many items). Postgres gives real constraints, transactions for concurrency guarantees, and built-in full-text search for FR-10 — without adding a search engine. MongoDB's flexibility is unnecessary here and would weaken integrity.

**Prisma over TypeORM / raw SQL.** Type-safe queries and a schema file that is the single source of truth for the data model, with migrations. This directly supports the data-model doc and the "illegal states unrepresentable" technique.

**JWT over server sessions.** The frontend is a separate team; a stateless token API is the clean interface. Short-lived access + refresh balances security with usability.

## 3. Deliberately rejected

- **Java Spring Boot** — suggested in the brief, but heavy; conflicts with the lightweight constraint.
- **Python / FastAPI** — a strong alternative (lightweight, auto-docs, async); not chosen because the team standardised on TypeScript.
- **Go** — best raw performance and footprint, but slower dev velocity and more verbose; performance here is not CPU-bound.
- **MongoDB** — the data is relational; a document store would weaken integrity.

## 4. How the stack meets the non-functional requirements

- **NFR-1 Performance** — Fastify throughput, Postgres indexes + full-text search, pagination, Redis cache later.
- **NFR-2 Security** — argon2id, class-validator DTOs, Prisma parameterised queries (SQLi-safe by construction), framework XSS-safe templating, file-validation pipes, audit log.
- **NFR-3 Availability & backups** — Postgres backups; reproducible setup via pinned versions and migrations (no Docker required).
- **NFR-4 Scalability** — tenancy in the data model; Redis for horizontal scaling of hot paths.
- **NFR-5 Privacy** — allowlist DTOs for masking; access-controlled file storage.
- **NFR-6 Maintainability** — NestJS modules; typed contracts; versioned, documented API.
- **NFR-7 Observability** — structured logs, health checks.

## 5. Implementation notes

- **Versions:** this document states intent. Exact versions are pinned in the repository lockfile at setup; the lockfile is the truth.
- **Config & secrets:** environment variables only; never hard-code credentials in code or commits.
- **Boundaries:** the stack is fixed; adding a component (e.g. Redis, a queue) is an explicit, recorded decision, not a silent drift.

## 6. Open items

- Deployment target / environment — open (affects hosting, not the stack itself).
- Exact runtime and database versions — pinned at setup.

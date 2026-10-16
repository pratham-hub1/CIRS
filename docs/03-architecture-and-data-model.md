# CIRS — Architecture & Data Model

**Derived from:** `00-overview.md` (locked), `01-requirements.md` (locked), `02-tech-stack.md` (locked). Must not contradict them; if it does, the overview wins.
**Status:** LOCKED (locked 2026-10-08; amended 2026-10-08 — added `UNCLAIMED` to ItemStatus)
**Last updated:** 2026-10-08
**Owner:** Backend team

**Purpose.** Fix the backend's structure and the data model so implementation in Antigravity is unambiguous. Every requirement in `01-requirements.md` must be traceable to a module and a table here.

---

## 1. Architecture

### 1.1 Layering (top to bottom)

1. **API / presentation layer** — controllers, DTOs, guards (auth + RBAC), pipes (validation), serializers (allowlist output).
2. **Application / service layer** — use-cases and business logic (reporting, matching, claims, verification, lifecycle).
3. **Domain layer** — entities, enums, invariants, and the status state machine.
4. **Data access layer** — Prisma repositories; the only place raw queries live.

**Rule:** business logic never lives in controllers (satisfies NFR-6). The frontend is a separate system; the backend exposes only the API.

### 1.2 Modules (NestJS)

| Module | Responsibility |
|---|---|
| `AuthModule` | Login, logout, JWT issue/refresh/revoke, password hashing |
| `UsersModule` | User records, roles, profile |
| `TenancyModule` | Campus / department scoping and guards |
| `ItemsModule` | Report lost / found, case IDs, edit, cancel |
| `SearchModule` | Search, filter, community feed |
| `MatchingModule` | Auto-match engine (FR-14) |
| `ClaimsModule` | Submit claim, documents, verification questions |
| `VerificationModule` | Risk level, staff review, decisions, competing claims, hold, SLA |
| `LifecycleModule` | Status state machine, collection token, handover, archive |
| `NotificationsModule` | Events, channels, digest |
| `StorageModule` | Storage locations |
| `FilesModule` | S3-compatible upload/download, validation |
| `AdminModule` | Admin panel operations, analytics |
| `AuditModule` | Append-only audit log |
| `CommonModule` | Config, logging, error model, health |

### 1.3 Request lifecycle

`request → AuthGuard (identity) → RolesGuard (RBAC, FR-3) → ValidationPipe (DTO) → Controller → Service → Repository (Prisma) → PostgreSQL → Serializer (allowlist) → response`

Every layer's failure mode is centralised: auth → 401, RBAC → 403, validation → 422, not found → 404, conflict → 409, unexpected → 500 (logged).

### 1.4 Folder structure

```
src/
  modules/<module>/
    controllers/ services/ dto/ entities/ guards/
  common/            # config, logging, errors, serializers
  domain/            # enums, state machine, invariants
prisma/
  schema.prisma      # source of truth for the data model
  migrations/        # forward-only
test/                # unit + api/e2e
```

## 2. Data model

**Modelling decision:** one report = one **case** = one **Item** record. `Item` carries the public `caseId` (the overview glossary's "Item" and "Case" are the same row; `caseId` is its public identifier).

### 2.1 Tables

**`campus`** — `id` PK, `name`, `code` (unique), `createdAt`.
**`department`** — `id` PK, `campusId` FK→campus, `name`, `code`, unique(`campusId`,`code`).
**`user`** — `id` PK, `name`, `email` (unique), `passwordHash`, `role` (enum), `campusId` FK, `departmentId` FK nullable, `status` (enum), `createdAt`, `updatedAt`.
**`refresh_token`** — `id` PK, `userId` FK, `familyId`, `tokenHash`, `replacedById` FK→refresh_token nullable, `expiresAt`, `revokedAt` nullable, `createdAt`.
**`storage_location`** — `id` PK, `campusId` FK, `name` (enum), unique(`campusId`,`name`).
**`item`** — `id` PK, `caseId` (unique, public), `type` (enum LOST/FOUND), `reporterId` FK→user, `campusId` FK, `departmentId` FK nullable, `itemName`, `category` (enum), `description`, `colour`, `brand`, `identifyingMarks`, `serialNumber` nullable, `status` (enum), `dateLost` nullable, `lastKnownLocation` nullable, `dateFound` nullable, `foundLocation` nullable, `storageLocationId` FK nullable, `duplicateOfId` FK→item nullable (self), `createdAt`, `updatedAt`, `archivedAt` nullable.
**`item_image`** — `id` PK, `itemId` FK, `url`, `sortOrder`, `createdAt`.
**`claim`** — `id` PK, `itemId` FK→item, `itemType` (enum, fixed `FOUND`), `claimantId` FK→user, `description`, `dateLost`, `placeLost`, `identifyingMarks`, `verificationLevel` (enum), `status` (enum), `decidedBy` FK→user nullable, `decidedAt` nullable, `decisionReason` nullable, `handoverAt` nullable, `receiptConfirmedAt` nullable, `postReturnFeedback` nullable, `handoverOverrideBy` FK→user nullable, `handoverOverrideReason` nullable, `createdAt`, `updatedAt`.
**`claim_document`** — `id` PK, `claimId` FK, `url`, `docType`, `createdAt`.
**`claim_question`** — `id` PK, `claimId` FK, `questionText`, `source` (AUTO/MANUAL), `answerText` nullable, `answeredAt` nullable.
**`match`** — `id` PK, `lostItemId` FK→item, `foundItemId` FK→item, `score`, `status` (enum), `createdAt`, unique(`lostItemId`,`foundItemId`).
**`notification`** — `id` PK, `userId` FK, `type` (enum), `message`, `channel` (enum), `readAt` nullable, `createdAt`.
**`notification_preference`** — `userId` PK FK, `emailEnabled`, `digestEnabled`, `updatedAt`.
**`saved_search`** — `id` PK, `userId` FK, `name`, `criteria` (JSONB), `active`, `createdAt`.
**`collection_token`** — `id` PK, `claimId` FK unique, `code` (unique), `expiresAt`, `usedAt` nullable, `createdAt`.
**`appeal`** — `id` PK, `claimId` FK, `appellantId` FK→user, `reason`, `status` (enum), `decidedBy` FK nullable, `decidedAt` nullable, `createdAt`.
**`case_message`** — `id` PK, `itemId` FK→item, `senderId` FK→user, `body`, `visibleToStaff` (bool), `createdAt`. Staff-mediated channel (FR-32); no direct contact details are exchanged.
**`audit_log`** — `id` PK, `actorId` FK→user nullable, `action`, `targetType`, `targetId`, `before` (JSONB nullable), `after` (JSONB nullable), `createdAt`. Append-only.

### 2.2 Relationships

- user 1:N item (reports) · user 1:N claim (submits) · user(admin) 1:N claim (decides)
- claim N:1 item (found) — the claim is *for* a found item
- item(lost) M:N item(found) via `match`
- item 1:N item_image · item N:1 storage_location · item N:1 campus/department
- claim 1:N claim_document · claim 1:N claim_question · claim 1:1 collection_token · claim 1:N appeal
- user 1:N notification · user 1:1 notification_preference · user 1:N saved_search
- item 1:N case_message · user 1:N case_message (staff-mediated comms, FR-32)
- audit_log references any target (polymorphic via `targetType`/`targetId`)

### 2.3 Enumerations

- **Role:** STUDENT, FACULTY, ADMIN
- **UserStatus:** ACTIVE, DISABLED
- **ItemType:** LOST, FOUND
- **ItemCategory:** ELECTRONICS, WALLETS, DOCUMENTS, BAGS, CLOTHING, ACCESSORIES, STATIONERY, KEYS, OTHERS
- **ItemStatus:** LOST_REPORTED, FOUND, READY_FOR_COLLECTION, RETURNED, ARCHIVED, UNCLAIMED
- **ClaimStatus:** PENDING, INFO_REQUESTED, APPROVED, REJECTED, WITHDRAWN
- **VerificationLevel:** LOW, MEDIUM, HIGH
- **StorageLocationName:** SECURITY_OFFICE, LIBRARY, LABORATORY, DEPARTMENT_OFFICE, RECEPTION
- **NotificationType:** REPORT_SUBMITTED, POSSIBLE_MATCH, NEW_CLAIM, MORE_INFO_NEEDED, CLAIM_APPROVED, CLAIM_REJECTED, READY_FOR_COLLECTION, ITEM_RETURNED
- **MatchStatus:** SUGGESTED, CONFIRMED, DISMISSED
- **AppealStatus:** PENDING, ACCEPTED, REJECTED
- **Channel:** IN_APP, EMAIL

**Category → verification level (FR-16):** HIGH = ELECTRONICS, WALLETS; MEDIUM = BAGS, ACCESSORIES; LOW = DOCUMENTS, CLOTHING, STATIONERY, KEYS, OTHERS. *(Assumption — see §4: the brief's examples "bottle, umbrella, watches, headphones" have no matching category and are assumed to fall under OTHERS/ACCESSORIES.)*

### 2.4 Schema-level invariants (local Correctness Contracts)

These are intrinsic to the schema; the cross-cutting registry (`06-correctness.md`) will reference them by ID.

**INV-DM-1 — Case IDs are unique and immutable.**
- *Enforcement:* `UNIQUE(caseId)`; the ID is generated once and never updated.
- *Proof:* the unique index makes two rows with the same caseId unrepresentable; no update path touches caseId.
- *Edge cases:* generation collision → retry on unique-violation.

**INV-DM-2 — A claim is always for a FOUND item.**
- *Enforcement:* composite foreign key `(itemId, itemType)` → `item(id, type)`, with `CHECK(itemType = 'FOUND')`.
- *Proof:* any claim whose item is not FOUND violates the FK/CHECK and cannot be inserted; the rule lives in the schema, not only in code.

**INV-DM-3 — Item status is always a valid enum value and only moves along the defined state machine.**
- *Enforcement:* enum type on `status`; transition validation in the domain state machine (see `05-workflows.md`); every change written to `audit_log`.
- *Proof:* the enum forbids unknown values; the transition map forbids illegal moves; the state-machine correctness contract (totality/determinism) is proven in `05-workflows.md`.

**INV-DM-4 — At most one APPROVED claim per found item.**
- *Enforcement:* partial unique index `UNIQUE(itemId) WHERE status = 'APPROVED'`.
- *Proof:* the index makes two APPROVED claims on one item unrepresentable, even under concurrency — the database, not application timing, guarantees it. This is the structural basis of the "hold" (FR-19/FR-20).
- *Edge cases:* approving while another approval is in flight → one insert fails the unique index and is rejected; the winner is the committed one.

**INV-DM-5 — A collection token is unique and single-use.**
- *Enforcement:* `UNIQUE(code)`; `usedAt` is set by an atomic conditional update `UPDATE ... SET usedAt = now() WHERE id = ? AND usedAt IS NULL`.
- *Proof:* the conditional update affects exactly one row the first time and zero rows after; two concurrent redemptions cannot both succeed.
- *Edge cases:* expired token → rejected by `expiresAt` check before redemption.

**INV-DM-6 — An item's type-specific fields are always present for its type.**
- *Enforcement:* `CHECK((type='LOST' AND dateLost IS NOT NULL) OR (type='FOUND' AND dateFound IS NOT NULL AND storageLocationId IS NOT NULL))`.
- *Proof:* a LOST row without dateLost, or a FOUND row without dateFound/storage, cannot be inserted.

**INV-DM-7 — Records are scoped to a campus.**
- *Enforcement:* `campusId` FK on `item`/`user`/`storage_location`; tenancy guard rejects cross-campus access.
- *Proof:* every query is filtered by the actor's campus; the guard is applied centrally so no endpoint bypasses it. (Cross-cutting completeness proven in `06-correctness.md`.)

**INV-DM-8 — The audit log is append-only.**
- *Enforcement:* no UPDATE/DELETE privileges on `audit_log` for the application role.
- *Proof:* with only INSERT granted, mutation of history is not representable through the app.

**INV-DM-9 — A lost/found pair appears at most once in `match`.**
- *Enforcement:* `UNIQUE(lostItemId, foundItemId)`.
- *Proof:* re-running the matcher cannot create duplicate pairs (supports idempotency of FR-14).

**INV-DM-10 — A duplicate pointer never forms a self-loop or a cycle.**
- *Enforcement:* `duplicateOfId` FK→item, `CHECK(duplicateOfId <> id)`.
- *Proof:* the CHECK forbids self-reference; merging is one-directional (a report points at its canonical report), so no cycle is created.

### 2.5 Migrations & versioning

- `schema.prisma` is the single source of truth; every change is a Prisma migration.
- Migrations are **forward-only** in normal operation; destructive changes require an explicit, reviewed migration.
- The API is versioned independently of the schema (see `04-api-and-auth.md`).

## 3. Cross-cutting concerns

- **Error model:** one error shape across the API; mapping in §1.3.
- **Config & secrets:** environment variables only.
- **Privacy masking:** implemented by **allowlist serializers** (a field is present only if whitelisted) — the masking contract is proven in `06-correctness.md` (FR-12/FR-38).
- **Audit:** every status change and admin action writes to `audit_log` (FR-37).

## 4. Assumptions & open items (nothing here is silently assumed)

- **Category → verification level mapping** (§2.3) — assumed, because the brief's low/medium/high examples (bottle, umbrella, watches, headphones) do not map cleanly onto the category enum. **Needs confirmation.**
- **Retention window** for personal data (FR-38) — value not fixed; a policy parameter.
- **Deployment target** — open; does not affect this model.
- **SSO** — assumed not present at launch; first-party auth per FR-4.

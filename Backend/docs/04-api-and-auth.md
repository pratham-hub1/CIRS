# CIRS — API & Auth

**Derived from:** `00-overview.md` (locked), `01-requirements.md` (locked), `02-tech-stack.md` (locked), `03-architecture-and-data-model.md` (locked). Must not contradict them; if it does, the overview wins.
**Status:** LOCKED (locked 2026-10-08)
**Last updated:** 2026-10-08
**Owner:** Backend team

**Purpose.** This is the contract the frontend team builds against, and the auth/security specification the backend implements. Every endpoint maps to a requirement in `01-requirements.md`.

---

## 1. Conventions

- **Base URL / versioning:** `/api/v1/...`. Breaking changes ship as a new version; the schema version is independent.
- **Format:** JSON in, JSON out. UTF-8. ISO-8601 UTC timestamps.
- **Auth header:** `Authorization: Bearer <accessToken>` on every protected endpoint.
- **Success envelope:** resource payloads returned directly (or `{ "data": [...], "nextCursor": "..." }` for lists).
- **Error envelope:** `{ "error": { "code": "...", "message": "...", "details": [...]? } }`.
- **Pagination:** cursor-based (`?limit=&cursor=`); default 20, max 100.
- **Idempotency:** unsafe repeat-prone operations accept an `Idempotency-Key` header (notably token redemption and claim submission).
- **Rate limits:** per-user limits on report/claim creation (FR-36); exceeding returns `429`.
- **Status codes:** `200` ok · `201` created · `204` no content · `400` malformed · `401` unauthenticated · `403` forbidden (RBAC) · `404` not found · `409` conflict · `422` validation failed · `429` rate-limited · `500` server error.

## 2. Auth model

- **Passwords:** hashed with **argon2id** (never stored or logged in plaintext).
- **Tokens:** short-lived **access token** (JWT) + longer **refresh token**. JWT claims: `sub` (userId), `role`, `campusId`, `exp`, `iat`, `jti`.
- **Refresh tokens** are stored hashed in `refresh_token`, grouped by a `familyId`; they **rotate on use** — the presented token is revoked and a successor issued atomically. **Reuse of an already-rotated/revoked token revokes the entire family** (replay defence). See INT-10. (FR-5, FR-2.)
- **RBAC:** enforced centrally by a `RolesGuard` reading the endpoint's declared roles; the actor's role comes from the verified JWT, never from request input (FR-3).
- **Registration/login** is restricted to university email domains (FR-4).
- **Token transport (open — confirm with frontend):** access token in the response body; refresh token is recommended as an `HttpOnly`, `Secure`, `SameSite` cookie. The exact transport is a frontend-coordination detail and is flagged in §8.

## 3. Endpoint catalogue

Roles: `S` Student · `F` Faculty · `A` Admin. `Auth` = any authenticated role.

### 3.1 Auth & user
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| POST | `/auth/register` | public | Register (university email only) — FR-4 |
| POST | `/auth/login` | public | Authenticate — FR-1 |
| POST | `/auth/refresh` | public | Refresh access token — FR-5 |
| POST | `/auth/logout` | Auth | End session / revoke — FR-2 |
| GET | `/users/me` | Auth | Own profile |
| PATCH | `/users/me` | Auth | Update own profile |
| GET | `/users/me/notification-preferences` | Auth | Read prefs — FR-30/31 |
| PATCH | `/users/me/notification-preferences` | Auth | Update prefs — FR-30/31 |

### 3.2 Items / cases
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| POST | `/items` | S,F,A | Report lost or found → case ID — FR-6/7 |
| GET | `/items` | Auth | Search + filter — FR-10/11 |
| GET | `/items/mine` | Auth | My Active Cases — FR-28 |
| GET | `/items/:caseId` | Auth | Fetch a case (masked if not owner/admin) — FR-12 |
| PATCH | `/items/:caseId` | owner | Edit within window — FR-9 |
| POST | `/items/:caseId/cancel` | owner | Cancel/close own case — FR-28 |
| POST | `/items/:caseId/messages` | Auth | Send a staff-mediated message — FR-32 |
| GET | `/items/:caseId/messages` | owner,A | Read case messages — FR-32 |

### 3.3 Discovery
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| GET | `/feed` | Auth | Community feed, privacy-masked — FR-12 |
| POST | `/saved-searches` | Auth | Create a watch — FR-13 |
| GET | `/saved-searches` | Auth | List watches — FR-13 |
| DELETE | `/saved-searches/:id` | owner | Remove a watch — FR-13 |

### 3.4 Matching
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| GET | `/items/:caseId/matches` | Auth | Candidate matches — FR-14 |
| POST | `/matches/:id/confirm` | A | Confirm a match — FR-14 |
| POST | `/matches/:id/dismiss` | A | Dismiss a match — FR-14 |

### 3.5 Claims
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| POST | `/items/:caseId/claims` | S,F | Submit ownership claim — FR-15 |
| GET | `/claims/mine` | S,F | Own claims — FR-28 |
| GET | `/claims/:id` | owner,A | Claim detail — FR-15 |
| POST | `/claims/:id/withdraw` | owner | Withdraw a claim — FR-28 |
| POST | `/claims/:id/answers` | owner | Answer INFO_REQUESTED questions → back to PENDING — FR-18 |
| POST | `/claims/:id/documents` | owner | Upload proof/supporting doc — FR-15 |

### 3.6 Verification (staff)
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| GET | `/admin/claims` | A | Pending/all claims — FR-18 |
| POST | `/admin/claims/:id/request-info` | A | Ask for more info — FR-18 |
| POST | `/admin/claims/:id/approve` | A | Approve (creates hold) — FR-18/20 |
| POST | `/admin/claims/:id/reject` | A | Reject (with reason) — FR-18 |
| POST | `/admin/claims/:id/questions` | A | Add/override verification questions — FR-17 |

### 3.7 Lifecycle, collection & handover (staff + user)
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| POST | `/admin/items/:caseId/status` | A | Advance status via state machine — FR-22 |
| POST | `/admin/items/:caseId/ready` | A | Mark Ready for Collection + notify — FR-23 |
| POST | `/admin/items/:caseId/handover` | A | Staff-side handover — FR-24 |
| POST | `/admin/items/:caseId/archive` | A | Archive — FR-26 |
| POST | `/admin/items/:caseId/unclaimed` | A | Mark unclaimed/disposed — FR-27 |
| POST | `/claims/:id/redeem` | A | Redeem collection token (single-use) — FR-23 |
| POST | `/items/:caseId/confirm-receipt` | owner | User-side handover confirmation — FR-24 |
| POST | `/claims/:id/post-return-feedback` | owner | Was it the right item? — FR-25 |

### 3.8 Appeals
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| POST | `/claims/:id/appeals` | owner | Appeal a rejection — FR-19 |
| POST | `/admin/appeals/:id/decide` | A | Decide an appeal — FR-19 |

### 3.9 Notifications
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| GET | `/notifications` | Auth | List notifications — FR-29 |
| POST | `/notifications/:id/read` | owner | Mark read — FR-29 |
| POST | `/notifications/read-all` | Auth | Mark all read — FR-29 |

### 3.10 Admin panel, storage & analytics
| Method | Path | Role | Purpose (FR) |
|---|---|---|---|
| GET | `/admin/items` | A | All cases — FR-33 |
| GET | `/admin/storage-locations` | A | List storage locations — FR-33 |
| POST | `/admin/storage-locations` | A | Create storage location — FR-33 |
| PATCH | `/admin/storage-locations/:id` | A | Update storage location — FR-33 |
| GET | `/admin/analytics` | A | Recovery rate / hotspots / pending — FR-34 |
| GET | `/admin/audit-log` | A | Audit entries — FR-37 |

### 3.11 Platform
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/health` | public | Liveness/readiness — NFR-7 |

### 3.12 Background / scheduled jobs

These are not HTTP endpoints; they run as scheduled workers (Redis / queue in a later phase).

| Job | Purpose (FR) |
|---|---|
| Match on report | Compute candidate matches when an item is created — FR-14 |
| Saved-search alerts | Notify watchers when a matching item is posted — FR-13 |
| SLA escalation | Escalate / remind staff on claims pending beyond threshold — FR-21 |
| Unclaimed reminders + retention | Remind, then move stale found items to `UNCLAIMED` — FR-27 |
| Notification digest | Batch high-volume notifications per period — FR-31 |

## 4. Key request / response shapes

**POST `/auth/login`**
```json
// request
{ "email": "student@gsfcuniversity.ac.in", "password": "••••••••" }
// 200
{ "accessToken": "<jwt>", "expiresIn": 900, "user": { "id": "…", "role": "STUDENT" } }
```

**POST `/items`** (report; `type` selects lost/found)
```json
// request
{
  "type": "FOUND",
  "itemName": "Black wallet",
  "category": "WALLETS",
  "description": "…", "colour": "black", "brand": "…",
  "identifyingMarks": "…", "serialNumber": null,
  "dateFound": "2026-10-01T09:30:00Z",
  "foundLocation": "Library 2nd floor",
  "storageLocationId": "…",
  "images": ["<upload-id>"]
}
// 201
{ "caseId": "CIRS-2026-000123", "status": "FOUND", "createdAt": "…" }
```

**POST `/items/:caseId/claims`**
```json
// request
{
  "description": "…", "dateLost": "2026-09-28T…", "placeLost": "Canteen",
  "identifyingMarks": "…",
  "answers": [{ "questionId": "…", "answerText": "…" }],
  "documents": ["<upload-id>"]
}
// 201
{ "claimId": "…", "verificationLevel": "HIGH", "status": "PENDING" }
```

**POST `/admin/claims/:id/approve`**
```json
// 200
{ "claimId": "…", "status": "APPROVED", "holdCreated": true,
  "collectionToken": { "issued": true, "expiresAt": "…" } }
```
*Conflict (`409`) if the item already has an APPROVED claim (INV-DM-4).*

**POST `/claims/:id/redeem`**
```json
// request
{ "code": "AB12-CD34" }
// 200
{ "redeemed": true, "itemId": "…" }
```
*`409` if already used; `422`/`404` if invalid or expired (INV-DM-5).*

## 5. RBAC

Every endpoint declares its allowed roles (table above); the `RolesGuard` enforces them centrally from the JWT. No endpoint is reachable without an explicitly authorised role. **Completeness** — that no endpoint is accidentally open — is proven as a cross-cutting Correctness Contract in `06-correctness.md` (FR-3).

## 6. Security & validation

- **SQL injection:** all DB access via Prisma's parameterised queries — injection is not representable (NFR-2).
- **XSS:** no HTML is rendered by the backend; all free-text is treated as data; output is JSON.
- **Input validation:** every request body/query validated by a DTO (class-validator); unknown fields rejected.
- **File upload validation:** type allowlist, size cap, content sniffing before storage; stored in S3-compatible storage, access-controlled (FR-15, NFR-2).
- **Privacy masking:** public responses (`/feed`, non-owner `/items/:caseId`) use **allowlist serializers** — a field appears only if explicitly whitelisted (FR-12/FR-38).
- **Rate limiting:** per-user on `POST /items` and `POST /items/:caseId/claims` (FR-36).

## 7. Audit

Every status change, claim decision, and admin action writes an append-only `audit_log` entry (actor, action, target, before/after, timestamp) — FR-37, INV-DM-8.

## 8. Open items (flagged, not assumed)

- **Token transport** (body vs HttpOnly cookie) — to be confirmed with the frontend team (§2).
- **Rate-limit thresholds** — exact numbers are a policy parameter.
- **Deployment/host** — does not affect the contract.

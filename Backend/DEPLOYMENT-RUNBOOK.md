# CIRS Backend — Deployment & Operations Runbook

**Campus Item Recovery System (GSFC University)**  
**Version:** 1.0.0  
**Stack:** Node.js + TypeScript, NestJS (Fastify), PostgreSQL 16, Prisma ORM, JWT + argon2id, Local / S3 Storage.

---

## 1. System Architecture Overview

```
                      +-----------------------------+
                      |   Reverse Proxy / Ingress   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |      NestJS (Fastify)       |
                      |   CIRS Application Server   |
                      +---+---------------------+---+
                          |                     |
            +-------------+--+               +--+-------------+
            |  PostgreSQL 16 |               |  Local / MinIO |
            |  Database      |               |  File Storage  |
            +----------------+               +----------------+
```

---

## 2. Environment Configuration

All configuration is provided via environment variables. **No secrets are ever hardcoded in repository files.**

| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | HTTP port | `3000` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://cirs_dev:password@localhost:5432/cirs` |
| `JWT_SECRET` | Secret key for access token signing | Minimum 32-character random string |
| `JWT_EXPIRES_IN` | Access token lifetime | `900` (15 minutes) |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Minimum 32-character random string |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `604800` (7 days) |
| `UPLOAD_DIR` | Local disk directory for uploaded images | `./uploads` |
| `MAX_FILE_SIZE_BYTES` | File upload cap (10 MB per NFR-2) | `10485760` |
| `RATE_LIMIT_MAX` | Global / per-user default rate limit | `20` |
| `RATE_LIMIT_TTL_SECONDS` | Rate limit window in seconds | `3600` (1 hour) |
| `RETENTION_WINDOW_DAYS` | Retention window before anonymisation | `365` |

---

## 3. Pre-Deployment Setup & Database Migration

1. **Install Dependencies:**
   ```bash
   npm ci --omit=dev
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Apply Database Migrations (Forward-Only):**
   ```bash
   npx prisma migrate deploy
   ```
   *Note: In accordance with `INV-DM-8` and `07-build-plan.md` §6, migrations are strictly forward-only.*

4. **Enforce DB Role Privileges for Application User (INV-DM-8 / REV-2):**
   For dedicated application users (e.g. `cirs_app`), ensure only `SELECT` and `INSERT` permissions are granted on `audit_log`:
   ```sql
   -- Run as PostgreSQL superuser / owner:
   REVOKE UPDATE, DELETE, TRUNCATE ON "audit_log" FROM cirs_dev;
   REVOKE UPDATE, DELETE, TRUNCATE ON "audit_log" FROM PUBLIC;
   GRANT SELECT, INSERT ON "audit_log" TO cirs_dev;
   ```
   *(Note: The database trigger `trg_prevent_audit_log_modification` created by migration also unconditionally rejects all UPDATE/DELETE attempts at the DB engine level).*

---

## 4. Starting the Service

### Production Mode:
```bash
node dist/main.js
```
Using PM2 or Windows Service Manager (NSSM):
```bash
pm2 start dist/main.js --name cirs-backend -i max
```

---

## 5. Health Checks & Monitoring (`NFR-7`)

- **Liveness & Readiness Endpoint:**
  ```http
  GET /health
  ```
  **Expected 200 OK Response:**
  ```json
  {
    "status": "ok",
    "info": {
      "database": { "status": "up" },
      "storage": { "status": "up" }
    },
    "error": {},
    "details": {
      "database": { "status": "up" },
      "storage": { "status": "up" }
    }
  }
  ```
  If the database connection is lost, `/health` returns `503 Service Unavailable`.

---

## 6. Backup & Disaster Recovery (`NFR-3`)

### Database Backup (PostgreSQL):
```bash
# Automated daily snapshot
pg_dump -h localhost -U cirs_dev -d cirs -F c -b -v -f /backups/cirs_db_$(date +%Y%m%d_%H%M%S).dump
```

### Database Restore:
```bash
pg_restore -h localhost -U cirs_dev -d cirs -v /backups/cirs_db_<TIMESTAMP>.dump
```

### Storage Backups:
Regularly synchronize the `./uploads` directory to secondary offsite / S3 storage:
```bash
# Example rsync or aws s3 sync
aws s3 sync ./uploads s3://cirs-backups-bucket/uploads/
```

---

## 7. Security & Compliance Checklist (`NFR-2`, `NFR-5`, `FR-36`)

1. **Passwords:** Hashed with argon2id (`argon2.hash`).
2. **Refresh Tokens:** Single-use with atomic rotation; reuse revokes the token family (`INT-10`).
3. **Public API Whitelist:** Public endpoints strictly serialize through whitelist schemas (`INT-5`).
4. **Rate Limiting:** Enforced via `RateLimitGuard` (`20 requests/hour` per user for claims and reports) (`FR-36`).
5. **Audit Logging:** Every status change, verification decision, and admin operation is transactionally written to `audit_log` (`INT-8`, `INV-DM-8`).
6. **Data Retention:** Expired cases older than 365 days undergo data anonymization preserving audit integrity (`FR-38`).

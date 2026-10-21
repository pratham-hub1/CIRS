# CIRS Frontend — Campus Item Recovery System

Production-grade, privacy-first university lost-and-found web platform for **GSFC University** (Vigyan Bhavan, Bhavan-1, Central Library, Cafeteria, and Labs). Built with **React 18**, **TypeScript 5**, **Vite 5**, and **Tailwind CSS**.

Designed following the visual clarity, restrained elegance, and high-density UX inspired by modern recovery systems like Magpie, adhering strictly to the university security protocols and backend API contracts.

---

## 🚀 Key Highlights & Architectural Features

### 1. Zero Backend Modifications & Strict Contract Conformance
- Developed strictly within `Frontend/` with zero alterations to `Backend/` models, Prisma schemas, or controllers.
- Strict payload compliance matching NestJS DTO validation rules (`whitelist: true`, `forbidNonWhitelisted: true`).
- Exact enumeration synchronization: `ItemStatus`, `ClaimStatus`, `VerificationLevel`, `StorageLocationName`, `Role`, `NotificationType`, `MatchStatus`, and `AppealStatus`.

### 2. Privacy-First Identity & Masking
- Public feeds and shared discovery cards **never** expose personal contact info, student IDs, serial numbers, or sensitive verification answers.
- Serial numbers, identifying marks, and purchase receipts are only visible to authorized case owners and security staff.

### 3. Session Security & Refresh Token Transport
- **In-Memory JWT Access Token**: Short-lived tokens reside exclusively in memory—never in `localStorage`.
- **HttpOnly Refresh Cookie Support**: Seamless automatic session renewal via `cirs_refresh_token` cookie with `credentials: 'include'`.
- **401 Token Refresh Queue**: Intercepts expired token errors, queues concurrent calls, invokes `POST /api/v1/auth/refresh`, and transparently replays requests.
- **Idempotency Headers**: Mutating requests automatically attach a unique `Idempotency-Key` header to prevent double-submits.

### 4. Interactive Student & Faculty Portals
- **Community Feed & Discovery (`/feed`)**: Debounced full-text search, category pills, lost/found filters, cursor pagination, and clean empty states.
- **Lost & Found Reporting (`/report/lost`, `/report/found`)**: Multipart image uploads with client-side preview and size validation (10 MB limit), conditional location & storage fields, and immediate case ID generation.
- **Multi-Tier Claim Verification (`/items/:caseId`)**: 
  - Dynamic verification levels (Low, Medium, High).
  - Secret item quiz answering.
  - Ownership document uploads (bills, registration cards, IMEI slips).
  - Appeal arbitration if a claim is rejected.
- **Custody Handover Token**: Generates single-use 6-character collection codes upon claim approval.
- **Match Notification Review**: View system-suggested algorithmic matches, confirm item parity, or dismiss non-matches.
- **Saved Search Alerts (`/saved-searches`)**: Set keyword & category triggers with push/in-app alerting when new items are logged.
- **Real-Time Notification Drawer (`/notifications`)**: Instant unread badges, mark as read, mark all read, and direct deep-linking to cases and claims.

### 5. Campus Security & Administration Desk
- **Executive KPI Dashboard (`/admin`)**: Real-time recovery rates, status distribution breakdown, category counts, and campus loss hotspots.
- **Case Management (`/admin/cases`)**: Filterable master inventory, status transitions (`READY_FOR_COLLECTION`, `UNCLAIMED`, `ARCHIVED`), and direct storage assignment.
- **Claim Arbitration & Evidence Review (`/admin/claims`)**: Side-by-side evidence inspection, question prompts, approval workflows, and appeal decisions.
- **Security Handover Desk (`/admin/redeem`)**: Dedicated counter workflow to verify student IDs and redeem single-use collection codes to execute custody handovers.
- **Physical Storage Management (`/admin/storage`)**: Track campus storage lockers, security control rooms, and bin inventory across GSFC University.
- **Immutable Audit Trail (`/admin/audit`)**: Append-only log recording actor identity, role, timestamp, action type, target IDs, and before/after JSON state diffs.

---

## 🛠️ Tech Stack & Directory Structure

- **Framework**: React 18.3 + TypeScript 5.6
- **Build Tool**: Vite 5.4
- **Routing**: React Router DOM 6.28
- **Styling**: Tailwind CSS 3.4 + PostCSS + Autoprefixer
- **Icons**: Lucide React
- **HTTP Client**: Centralized native client with retry queue & demo fallback

```
Frontend/
├── src/
│   ├── components/
│   │   ├── common/         # Badge, Modal, ConfirmDialog, FileUpload, LoadingSpinner, EmptyState, ErrorBoundary
│   │   └── layout/         # Header, Sidebar, MobileNav, AppLayout, ProtectedRoute
│   ├── context/            # AuthContext, ToastContext, NotificationContext
│   ├── pages/
│   │   ├── admin/          # AdminOverview, AdminCases, AdminClaims, AdminMatches, AdminStorageLocations, AdminRedeemToken, AdminAuditLog
│   │   ├── auth/           # Login, Register
│   │   ├── claims/         # MyClaims, ClaimDetails, SubmitClaimModal
│   │   ├── dashboard/      # Dashboard
│   │   ├── feed/           # CommunityFeed
│   │   ├── items/          # ItemDetails, ReportItem, MyCases
│   │   ├── notifications/  # NotificationsPage
│   │   ├── profile/        # ProfileSettings
│   │   ├── search/         # SavedSearches
│   │   └── NotFound.tsx    # 404 Error Screen
│   ├── services/           # apiClient, authService, itemsService, claimsService, adminService, searchService, filesService, demoFixtures
│   ├── types/              # enums, api, auth, item, claim, admin, notification, matching, savedSearch
│   ├── App.tsx             # Root Router configuration
│   ├── index.css           # Tailwind base styles and subtle scrollbars
│   ├── main.tsx            # Application entry point
│   └── vite-env.d.ts       # TypeScript Vite environment definitions
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v18.0.0 or later, tested with v24.12.0)
- npm (v9.0.0 or later)

### Installation
```bash
cd Frontend
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local` (or configure `.env.local` for local development):
```bash
cp .env.example .env.local
```
Configuration parameters:
```env
# Backend Base URL (targets the live remote Cloudflare tunnel backend)
VITE_API_BASE_URL=https://misc-cholesterol-till-benefits.trycloudflare.com/api/v1

# University domain restriction hint
VITE_UNIVERSITY_DOMAIN=gsfcuniversity.ac.in

# Default Campus ID (for tenancy validation)
VITE_DEFAULT_CAMPUS_ID=campus-1

# Opt-in preview mode (false for live backend operation)
VITE_DEMO_MODE=false
```

### Running Locally (Development Mode)
```bash
npm run dev
```
The application will launch on `http://localhost:5173`. Requests are forwarded to the live remote backend at `https://misc-cholesterol-till-benefits.trycloudflare.com` directly or via the Vite development proxy (`/api`, `/uploads`, `/health`), ensuring same-origin cookie transport and full CORS compatibility.

### Production Build & Typecheck
```bash
npm run build
```
Generates an optimized, minified bundle in `Frontend/dist/` with full TypeScript type verification.

### Preview Production Build
```bash
npm run preview
```

---

## 🔗 Remote Backend Integration Details
- **Backend Origin**: `https://misc-cholesterol-till-benefits.trycloudflare.com`
- **API Base**: `https://misc-cholesterol-till-benefits.trycloudflare.com/api/v1`
- **Health Check**: `https://misc-cholesterol-till-benefits.trycloudflare.com/health` (verified HTTP 200 OK)
- **OpenAPI / Swagger Spec**: `https://misc-cholesterol-till-benefits.trycloudflare.com/api/docs-json` (verified HTTP 200 OK)
- **Real-Data Guarantee**: Automatic silent mock-data fallback has been removed. Live server responses and genuine error envelopes (`{ error: { code, message, details } }`) are rendered. Demo fixtures are strictly opt-in via `VITE_DEMO_MODE=true`.

---

## ♿ Accessibility & Testing

A scoped accessibility pass covers form semantics, modal/drawer focus management, icon-button
labelling, and a skip-to-content link. Reusable primitives live in `src/components/a11y/`
(`FormField`, `LiveRegion`, `SkipToContent`, `VisuallyHidden`) and `src/hooks/`
(`useFocusTrap`, `useEscapeKey`, `useBodyScrollLock`).

A **Vitest + React Testing Library** harness (with **axe-core** assertions and a keyboard-focus
test) verifies the behaviour.

```bash
cd Frontend
npm install
npm test          # vitest run — 22 tests incl. axe checks
npm run lint      # tsc --noEmit
npm run build     # tsc && vite build
```

See **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** for the full change list, the primitive APIs,
the verification commands, and the manual keyboard / screen-reader checklist.

# CIRS Frontend — Accessibility Pass

**Branch:** `a11y/form-modal-accessibility-pass` (branched from `main`, not merged)
**Scope:** forms, modals/overlays, navigation, icon-only controls, and a test harness
**Status:** `tsc` clean, `vite build` clean, 22/22 automated tests green (incl. axe-core)

---

## 1. Why this exists

The CIRS frontend is functionally complete but its interactive surfaces had a set of
accessibility gaps that would fail a WCAG 2.1 AA audit and make the app hard to use
with a keyboard or a screen reader:

- Labels were visually present but **not programmatically associated** with their inputs
  in most forms (`<label>` without `htmlFor`, `<input>` without `id`).
- Validation errors were shown only as toasts or banners with **no `aria-invalid` /
  `aria-describedby` and no live-region announcement** — a screen-reader user got no
  feedback at all.
- `Modal` and `MobileNav` rendered visually like dialogs but did **no focus management**:
  focus stayed behind the overlay, `Tab` escaped to the page underneath, focus was never
  restored to the trigger, and every modal reused the literal id `modal-title` (duplicate
  ids when more than one modal existed).
- Several **icon-only buttons** had no accessible name (only `title` or nothing).
- There was **no skip-to-content link**, so keyboard users had to tab through the whole
  header and sidebar on every page.
- The file-upload drop zone was a `<div onClick>` — **not reachable or operable by keyboard**.

## 2. What changed (mapped to the brief)

| Brief item | Where | Notes |
| --- | --- | --- |
| Label association | `FormField`, `Login`, `Register`, `ReportItem`, `SubmitClaimModal`, `ProfileSettings`, `FileUpload` | `htmlFor`/`id` wired everywhere; auto-generated ids via `useId()` |
| `aria-invalid` / `aria-describedby` | `FormField`, `FileUpload` | Errors set `aria-invalid` and are linked together with helper text |
| Live-region error announcements | `FormField`, `LiveRegion`, form-level summaries in `Login`, `Register`, `ReportItem`, `SubmitClaimModal` | `role="alert"` + `aria-live="assertive"` |
| Focus management in Modal / MobileNav | `useFocusTrap`, `Modal`, `ConfirmDialog`, `MobileNav` | Move-in on open, Tab wrap, restore on close, Escape to dismiss |
| `aria-label` on icon buttons | `Header`, `Modal`, `MobileNav`, `FileUpload`, `ReportItem`, `SearchBrowse`, `SavedSearches`, `NotificationsPage`, `AdminAuditLog` | Plus `aria-expanded` / `aria-haspopup` on menu triggers |
| Skip-to-content link | `SkipToContent`, `AppLayout` | First focusable element; targets `#main-content` |
| Vitest + Testing Library harness | `vitest.config.ts`, `src/test/`, `__tests__/` | With axe-core assertions and a keyboard-focus test |

### Additional fixes found along the way

- **Dialog semantics on `MobileNav`.** The slide-over drawer now carries
  `role="dialog"`, `aria-modal="true"`, `aria-label`, and locks background scroll with a
  hook that restores the *previous* overflow value (the old code reset it to `unset`,
  which could leave the page unscrollable when overlays stacked).
- **Keyboard-operable file drop zone.** The drop zone is now a real
  `role="button" tabIndex={0}` control that opens the picker on `Enter`/`Space`. The
  hidden `<input type="file">` was moved to be a **sibling** of the drop zone rather than a
  child — axe flags a focusable control nested inside another interactive control
  (`nested-interactive`).
- **Accessible toggle switches.** The notification preference switches had a wrapping
  `<label>` with no text, so the checkbox had **no accessible name**. They now expose
  `role="switch"` + `aria-label` + `aria-checked`.
- **Keyboard-reachable notification rows.** The header notification list items were
  clickable `<div>`s; they are now `<button>`s.
- **Search input labelled.** The global header search had only a placeholder; it now has a
  visually-hidden `<label>` and a `role="search"` landmark.
- **Segmented controls.** Report-type tabs and filter switches now expose `aria-pressed`
  so their selected state is conveyed, not just coloured.
- **Visible keyboard focus.** A global `:focus-visible` outline was added in `index.css`
  for elements that don't opt into a custom focus ring.
- **Build fix (pre-existing).** `recharts@3` declares `react-is` as a *peer* dependency,
  but it was absent from the lockfile, so a clean install could not build the production
  bundle (`Rollup failed to resolve import "react-is"`). `react-is@^18.3.1` is now an
  explicit dependency, and `npm run build` succeeds. This is unrelated to the a11y work but
  was blocking verification.

## 3. New reusable primitives

These live in `src/components/a11y/` and `src/hooks/` and are the reason the pass is
reviewable in isolation — each is small, typed, and independently tested.

### `useFocusTrap<T>(active)`
Traps `Tab`/`Shift+Tab` inside the returned ref while `active` is true, focuses the first
focusable element on activation, and restores focus to the previously focused element on
deactivation.

```tsx
const ref = useFocusTrap<HTMLDivElement>(isOpen);
<div ref={ref} tabIndex={-1} role="dialog" aria-modal="true">…</div>
```

### `useEscapeKey(active, handler)` / `useBodyScrollLock(locked)`
Small, single-purpose hooks. The Escape handler is stored in a ref so inline callbacks
don't re-register the listener every render; the scroll lock restores the prior value.

### `<FormField>`
The workhorse. Give it a label and a single control; it wires the association, the
`aria-invalid`, the `aria-describedby` (helper text + error), and renders the error in an
assertive live region. It also supports `leadingIcon`, `trailingAdornment`, `helpText`,
and `required`.

```tsx
<FormField id="email" label="University Email" required helpText="…@gsfcuniversity.ac.in">
  <input type="email" />
</FormField>
```

### `<LiveRegion>`
A never-removed `role="status"`/`role="alert"` region for announcing async results (e.g.
"Case ID copied to clipboard"). Screen readers only announce changes to regions that
already exist, so it is rendered permanently and driven by its `message` prop.

### `<SkipToContent>` and `<VisuallyHidden>`
The skip link (visually hidden until focused) and a `sr-only` wrapper for label text.

## 4. Files added

```
Frontend/
├── ACCESSIBILITY.md                      # this document
├── vitest.config.ts                      # jsdom + setup + include glob
└── src/
    ├── hooks/
    │   ├── useFocusTrap.ts
    │   ├── useEscapeKey.ts
    │   ├── useBodyScrollLock.ts
    │   └── __tests__/useFocusTrap.test.tsx
    ├── components/a11y/
    │   ├── FormField.tsx
    │   ├── LiveRegion.tsx
    │   ├── SkipToContent.tsx
    │   ├── VisuallyHidden.tsx
    │   └── __tests__/{FormField,LiveRegion,SkipToContent}.test.tsx
    ├── components/common/__tests__/{Modal,FileUpload}.test.tsx
    └── test/
        ├── setup.ts                      # jest-dom matchers + framer-motion stub + cleanup
        └── axe.ts                        # axe-core runner (color-contrast/region disabled)
```

## 5. Files modified

`Modal.tsx`, `ConfirmDialog.tsx`, `FileUpload.tsx`, `EmptyState.tsx`,
`layout/{Header,MobileNav,AppLayout}.tsx`, `pages/auth/{Login,Register}.tsx`,
`pages/items/{ReportItem,MyCases}.tsx`, `pages/claims/SubmitClaimModal.tsx`,
`pages/profile/ProfileSettings.tsx`, `pages/search/{SearchBrowse,SavedSearches}.tsx`,
`pages/notifications/NotificationsPage.tsx`, `pages/admin/AdminAuditLog.tsx`,
`pages/feed/CommunityFeed.tsx`, `index.css`, `package.json`, `README.md`.

No backend files, DTOs, or API contracts were touched.

## 6. Verification

### Type-check
```bash
cd Frontend
npm run lint      # tsc --noEmit  → clean
npm run build     # tsc && vite build → clean
```

### Automated tests (Vitest + Testing Library + axe-core)
```bash
cd Frontend
npm install       # installs the new dev dependencies
npm test          # vitest run
```

The suite (22 tests across 6 files) covers:

- `Modal` — dialog semantics, `aria-labelledby`/`aria-describedby`, Escape-to-close,
  focus moves in on open and is **restored to the trigger** on close, `Tab` wraps at the
  boundaries, and **zero axe violations**.
- `FormField` — label association, `aria-required`, helper-text wiring, `aria-invalid` +
  assertive error region, zero axe violations.
- `FileUpload` — label↔input association, drop zone operable with `Enter`, zero axe
  violations.
- `useFocusTrap` — initial focus, Tab wrapping, focus restoration.
- `SkipToContent` — correct `href`/name, zero axe violations.
- `LiveRegion` — polite/assertive roles and `aria-live` values.

> Test note: `framer-motion` is stubbed to a synchronous passthrough in `src/test/setup.ts`
> so assertions on roles/focus are deterministic (its rAF-driven animations are not).
> `color-contrast` is disabled in the axe helper because jsdom has no layout engine;
> contrast is covered by the manual checklist below.

### Manual keyboard / screen-reader checklist

Run `npm run dev` and confirm:

1. **Skip link** — on first `Tab`, "Skip to main content" appears top-left; `Enter` moves
   focus into `<main>`.
2. **Modal** — open "Submit Ownership Claim". Focus lands inside the dialog; `Tab` cycles
   within it and never reaches the page behind; `Esc` closes it and focus returns to the
   button that opened it.
3. **MobileNav** (narrow viewport) — open the drawer; same focus behaviour; `Esc` closes.
4. **Login / Register** — submit an invalid form; the error is announced (VoiceOver /
   NVDA) and the offending field is marked invalid; every field is reachable by its label.
5. **Report Item** — the lost/found switch, all fields, the image drop zone (`Enter` to
   open the picker) and each remove-photo button are keyboard reachable with a visible
   focus ring.
6. **Icon buttons** — with a screen reader, confirm each header/nav/table icon button
   announces a meaningful name (no "button" with no label).
7. **Contrast** — spot-check the new error text and focus outline against their backgrounds
   (jsdom can't do this automatically).

## 7. Notes, limits, and suggested follow-ups

- Tests deliberately cover the **primitives and the two highest-risk surfaces** (Modal,
  FileUpload). They are not a full component test suite; wiring page-level forms to
  `FormField` is covered by types plus the manual checklist.
- `MobileNav` and the page forms are not unit-tested directly (they need the auth and
  notification providers); the behaviour they rely on is tested through `useFocusTrap`
  and `Modal`.
- Follow-ups worth scheduling: add `@vitest/coverage-v8`, promote axe checks to a
  `jsx-a11y` ESLint rule set, and add `aria-live` announcements to the toast layer so
  toasts are mirrored to screen readers.
- This branch is intentionally **not merged into `main`**.

## 8. Running everything at a glance

```bash
cd Frontend
npm install
npm run lint      # tsc --noEmit
npm test          # vitest run (axe included)
npm run build     # tsc && vite build
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — type-check (`tsc`) then build to `dist/`
- `npm run preview` — preview the production build

There is no test runner and no lint/format script configured in `package.json`. The parent-folder `CLAUDE.md` mentions ESLint/Prettier conventions, but neither is wired up here — don't invoke them via npm.

## Architecture

Single-page Hebrew RTL app (`<html lang="he" dir="rtl">`) for tracking family vehicles, their license/insurance expiry, notes, and attached documents. **No backend** — everything lives in `localStorage`.

### State: two contexts (vehicles + notifications)

Two React Contexts, nested in this exact order in `App.tsx`:

```
<VehicleProvider>
  <NotificationProvider>   {/* derives state from VehicleProvider — order matters */}
    ...
```

- **Vehicles** — `src/store/useVehicles.ts` + `src/store/VehicleContext.tsx`. Owns the canonical `Vehicle[]` (CRUD for vehicles, notes, documents). Hydrates from `localStorage` key `family_vehicles_v1` on mount and persists via `useEffect`. Consumed with `useVehicleStore()`.
- **Notifications** — `src/services/notifications.ts` + `src/store/NotificationContext.tsx`. Pure derived state from `vehicles` plus its own settings/seen-IDs (separate localStorage keys: `family_vehicle_notifications_settings_v1`, `family_vehicle_notifications_seen_v1`). Owns: `activeAlerts`, `unseenAlerts`, `enabled`, `setEnabled`, `markAllSeen`, `showToast`. Consumed with `useNotifications()`.

Rules for adding more state:
- Mutations to the vehicle list (or any persisted vehicle sub-field) must go through `useVehicles.ts` — every writer goes through that single hook.
- Read-only state *derived from* vehicles can live in its own context, like `NotificationContext` does — that's the precedent. Don't recompute the same derivation in three components; expose it from one context.

### Notifications model

Single source of truth for the alert count: `getActiveAlerts(vehicles)` in `src/services/notifications.ts`. The `/alerts` page list, the nav badge, the landing-card subtitle, and the toast all consume the same array via `useNotifications()`. If you change the alert threshold (currently ≤30 days), do it in `getActiveAlerts` only.

Alert ID format: `${vehicleId}::${docType}::${expiryDate}`. The expiry date is part of the ID so that renewing a vehicle (changing the date) generates a fresh ID, which means the old "seen" entry no longer matches and the new alert can re-surface if it's also within 30 days. The seen-set is pruned on every alert recompute — entries that no longer match an active alert are dropped from localStorage.

Phase-2 push-notification stubs live in `src/services/notifications.ts` (`requestNotificationPermission`, `registerPushToken`, `sendTestNotification`, `scheduleRenewalChecks`). They currently no-op; their bodies contain commented blueprints for Firebase Cloud Messaging + Netlify Function integration with all config pulled from `import.meta.env.VITE_*`. Never inline FCM keys.

### Routes (React Router v6)

Defined in `src/App.tsx`:

| Path | Page |
|------|------|
| `/` | `LandingPage` — "קצין רכב" hero + 2 entry cards (renewals, treatments) |
| `/renewals` | `HomePage` — list of vehicle cards (was previously at `/`) |
| `/treatments` | `TreatmentsPage` — aggregated treatment notes across all vehicles |
| `/vehicle/new` | `VehicleFormPage` (add mode) |
| `/vehicle/:id/edit` | `VehicleFormPage` (edit mode, prefilled) |
| `/vehicle/:id` | `VehicleDetailPage` — details, docs, notes, delete |
| `/alerts` | `AlertsPage` — expiry items within 30 days |
| `*` | Redirect to `/` (catch-all for stale bookmarks) |

`Navigation` (bottom nav: Home / Renewals / Treatments / Alerts) is rendered alongside `<Routes>` and **hides itself** on the landing page (`/`) and on form screens (`/vehicle/new`, `*/edit`).

The "+" add-vehicle button is no longer in the nav — `HomePage` renders its own `.fab-floating` FAB. If you add another list-style page, copy this pattern rather than reinstating a nav-embedded FAB.

### Expiry status model

`src/utils/dateUtils.ts` is the single source of truth for date logic:

- `getDaysUntil(dateStr)` — days from today (local time, not UTC) to `YYYY-MM-DD`. Negative for past dates.
- `getExpiryStatus(dateStr)` returns `'expired' | 'urgent' | 'soon' | 'ok'`:
  - `< 0` days → `expired`
  - `≤ 7` days → `urgent`
  - `≤ 30` days → `soon`
  - else → `ok`
- `todayISO()` deliberately uses **local time** (not `toISOString().slice(0,10)`) so date inputs don't off-by-one across timezones.

`StatusBadge` and `HomePage` card highlight branch on these statuses. The `Navigation` badge and `AlertsPage` list both consume `useNotifications().activeAlerts` instead (see the Notifications section) — keep both layers consistent if you change thresholds.

### Documents are base64 in localStorage

`VehicleDocument.fileData` stores the full file as a base64 data URL inside the same JSON blob that holds the vehicle list. `VehicleDetailPage` enforces a 5 MB per-file cap, and `useVehicles.persist()` swallows quota errors with a `console.warn` (data stays in memory for the session but is lost on reload). Be aware of this when adding features that touch documents — there's no chunking or external storage.

### Type model

`src/types/index.ts` defines `Vehicle`, `Note` (`type: 'treatment' | 'general'`, optional `title?: string` for treatments), and `VehicleDocument` (`docType: 'license' | 'insurance'`, exactly one of each per vehicle is expected by the UI — `VehicleDetailPage` looks them up via `.find(d => d.docType === ...)`).

When adding fields to persisted shapes (`Vehicle`, `Note`, `VehicleDocument`): make them optional. Old localStorage blobs already in the wild have only the original fields — non-optional additions would break hydration. The existing `title?: string` on `Note` follows this rule, and `TreatmentsPage` / `NoteItem` both fall back to `description` when `title` is absent.

## RTL conventions

The app is fully RTL. A few things to keep in mind when editing UI:

- "Back" arrows render as `→` (toward the start/right side in RTL), not `←`. See `VehicleFormPage` and `VehicleDetailPage` top bars.
- All user-facing strings are Hebrew. New text should match — there is no i18n layer.
- License plate input is digits-only: `onChange` strips non-digits before storing.

## User preferences (from parent `CLAUDE.md`)

The parent folder's `CLAUDE.md` asks for: short practical answers, small focused functions, modern TS, meaningful names, and explaining changes before making them.

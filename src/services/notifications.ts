import { Vehicle } from '../types';
import { getDaysUntil } from '../utils/dateUtils';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

export interface ActiveAlert {
  /** Stable identifier — see buildAlertId() below. */
  id:         string;
  vehicleId:  string;
  docType:    'license' | 'insurance';
  expiryDate: string;   // ISO YYYY-MM-DD
  days:       number;   // negative when already expired
}

export interface NotificationSettings {
  enabled: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// LocalStorage I/O — separate keys from `family_vehicles_v1` so a bad write
// here can never corrupt the vehicle list.
// ──────────────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'family_vehicle_notifications_settings_v1';
const SEEN_KEY     = 'family_vehicle_notifications_seen_v1';

const DEFAULT_SETTINGS: NotificationSettings = { enabled: true };

export function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { enabled: Boolean(parsed?.enabled) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // quota — settings won't persist this session, but won't crash
  }
}

export function loadSeenIds(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveSeenIds(ids: string[]): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    // quota — seen state won't persist this session
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Alert derivation (Phase 1)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Compose an alert ID from (vehicle, doc, expiry-date). Including expiryDate
 * means: if the user renews to a new date, the old "seen" entry no longer
 * matches → it's automatically pruned, and a fresh alert can fire for the
 * new date if it's also within range.
 */
export function buildAlertId(
  vehicleId: string,
  docType:   'license' | 'insurance',
  date:      string,
): string {
  return `${vehicleId}::${docType}::${date}`;
}

/**
 * Active alerts = every expiry date that is ≤30 days away (or already past).
 * This MUST match the threshold used by AlertsPage, or the badge count and
 * the visible list will disagree.
 */
export function getActiveAlerts(vehicles: Vehicle[]): ActiveAlert[] {
  const out: ActiveAlert[] = [];
  for (const v of vehicles) {
    if (v.licenseExpiryDate) {
      const days = getDaysUntil(v.licenseExpiryDate);
      if (days !== null && days <= 30) {
        out.push({
          id:         buildAlertId(v.id, 'license', v.licenseExpiryDate),
          vehicleId:  v.id,
          docType:    'license',
          expiryDate: v.licenseExpiryDate,
          days,
        });
      }
    }
    if (v.insuranceExpiryDate) {
      const days = getDaysUntil(v.insuranceExpiryDate);
      if (days !== null && days <= 30) {
        out.push({
          id:         buildAlertId(v.id, 'insurance', v.insuranceExpiryDate),
          vehicleId:  v.id,
          docType:    'insurance',
          expiryDate: v.insuranceExpiryDate,
          days,
        });
      }
    }
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 2 — push-notification scaffolding (NOT YET WIRED UP)
// ──────────────────────────────────────────────────────────────────────────
//
// What real push needs:
//   1. Firebase Cloud Messaging (FCM) for the browser/device push channel.
//   2. User permission via the Notification API (`Notification.requestPermission`).
//   3. A per-device FCM token, fetched once after permission is granted.
//   4. A backend that stores tokens keyed to a user/device, and that runs a
//      daily job to recompute alerts and call FCM. Two reasonable hosts:
//        - Netlify scheduled functions (`netlify/functions/*` + `netlify.toml`
//          `[functions."check-renewals".schedule]`)
//        - Supabase edge functions + pg_cron
//   5. Vite env vars for config:
//        VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID,
//        VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID,
//        VITE_FIREBASE_VAPID_KEY, VITE_PUSH_REGISTER_URL,
//        VITE_PUSH_TEST_URL, VITE_PUSH_SCHEDULE_URL
//      DO NOT inline keys in source — pull them from import.meta.env.* at
//      call time, and add the real values to `.env.local` (gitignored) and
//      to Netlify's environment variables panel.
//
// ──────────────────────────────────────────────────────────────────────────

/**
 * Phase 2: ask the browser/OS for permission to display system notifications.
 * Phase 1 does NOT call this — the in-app banner does not need OS permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  // TODO(phase-2): real implementation
  //
  // if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  // if (Notification.permission !== 'default') return Notification.permission;
  // return Notification.requestPermission();
  return 'default';
}

/**
 * Phase 2: fetch this device's FCM token and POST it to our backend so the
 * scheduled job can target it. Returns the token (or null on failure).
 */
export async function registerPushToken(): Promise<string | null> {
  // TODO(phase-2): real implementation
  //
  // import { initializeApp } from 'firebase/app';
  // import { getMessaging, getToken } from 'firebase/messaging';
  //
  // const app = initializeApp({
  //   apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  //   projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  //   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  //   appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  // });
  // const messaging = getMessaging(app);
  // const token = await getToken(messaging, {
  //   vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  // });
  // await fetch(import.meta.env.VITE_PUSH_REGISTER_URL, {
  //   method:  'POST',
  //   headers: { 'content-type': 'application/json' },
  //   body:    JSON.stringify({ token }),
  // });
  // return token;
  return null;
}

/**
 * Phase 2: trigger a one-off push end-to-end (frontend → Netlify Function →
 * FCM → device). Used to sanity-check the pipeline after deploy.
 */
export async function sendTestNotification(): Promise<void> {
  // TODO(phase-2): real implementation
  //
  // await fetch(import.meta.env.VITE_PUSH_TEST_URL, { method: 'POST' });
}

/**
 * Phase 2: confirm/refresh the daily renewal-check schedule. The actual
 * cron lives on the backend (Netlify scheduled function / Supabase pg_cron);
 * this is just a frontend handle to opt in or verify.
 */
export async function scheduleRenewalChecks(): Promise<void> {
  // TODO(phase-2): real implementation
  //
  // await fetch(import.meta.env.VITE_PUSH_SCHEDULE_URL, { method: 'POST' });
}

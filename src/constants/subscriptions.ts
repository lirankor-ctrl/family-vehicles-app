import { SubscriptionKey } from '../types';

export interface SubscriptionDef {
  key:   SubscriptionKey;
  label: string;
  icon:  string;
}

/** The four supported vehicle subscriptions/services, in display order.
 *  Add a new entry here (and to SubscriptionKey) to support another service. */
export const SUBSCRIPTION_DEFS: SubscriptionDef[] = [
  { key: 'pango',    label: 'מנוי פנגו',          icon: '🅿️' },
  { key: 'kvish6',   label: 'מנוי כביש 6',        icon: '🛣️' },
  { key: 'carmel',   label: 'מנוי מנהרות הכרמל',  icon: '🚇' },
  { key: 'fastlane', label: 'מנוי נתיב מהיר',     icon: '⚡' },
];

/** A subscription is "filled in" (worth showing) only when it's active OR has a note. */
export function isSubscriptionFilled(s: { active: boolean; notes?: string }): boolean {
  return s.active || Boolean(s.notes?.trim());
}

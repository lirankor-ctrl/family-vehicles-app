export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '—';
  const [y, m, d] = parts;
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
}

export function getDaysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  try {
    const target = new Date(dateStr + 'T00:00:00');
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export type ExpiryStatus = 'expired' | 'urgent' | 'soon' | 'ok';

export function getExpiryStatus(dateStr: string | undefined): ExpiryStatus | null {
  const days = getDaysUntil(dateStr);
  if (days === null) return null;
  if (days < 0)   return 'expired';
  if (days <= 7)  return 'urgent';
  if (days <= 30) return 'soon';
  return 'ok';
}

/** Returns today's date in YYYY-MM-DD using LOCAL time, not UTC. */
export function todayISO(): string {
  const d = new Date();
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

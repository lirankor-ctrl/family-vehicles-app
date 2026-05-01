import { ExpiryStatus, getDaysUntil } from '../utils/dateUtils';

interface Props {
  status: ExpiryStatus | null;
  dateStr?: string;
}

const ICON: Record<ExpiryStatus, string>  = { expired: '❌', urgent: '🚨', soon: '⚠️', ok: '✅' };
const LABEL: Record<ExpiryStatus, string> = { expired: 'פג תוקף', urgent: 'דחוף', soon: 'בקרוב', ok: 'בתוקף' };

export default function StatusBadge({ status, dateStr }: Props) {
  if (!status) return null;

  const days = getDaysUntil(dateStr);
  let suffix = '';
  if (days !== null) {
    if (days === 0)    suffix = ' (היום)';
    else if (days > 0) suffix = ` (${days}י')`;
  }

  return (
    <span className={`status-badge ${status}`} aria-label={LABEL[status]}>
      {ICON[status]} {LABEL[status]}{suffix}
    </span>
  );
}

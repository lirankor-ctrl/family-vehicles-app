import { useHoldToActivate } from '../hooks/useHoldToActivate';

export default function HoldToActivateButton({ onActivate }: { onActivate: () => void }) {
  const { progress, holding, handlers } = useHoldToActivate({ durationMs: 3000, onActivate });
  const circumference = 2 * Math.PI * 16;
  const dashOffset = circumference * (1 - progress);

  return (
    <button
      type="button"
      className={`dash-alert ${holding ? 'holding' : ''}`}
      {...handlers}
      aria-label="החזיקו לחוצים 3 שניות כדי לפתוח מצב תאונה"
    >
      <span className="dash-alert-icon" aria-hidden="true">🚨</span>
      <div className="dash-alert-body">
        <span className="dash-alert-title">תאונה</span>
        <span className="dash-alert-subtitle">{holding ? 'מחזיקים… אל תרפו' : 'לחצו והחזיקו 3 שניות'}</span>
      </div>
      <svg className="dash-alert-ring" viewBox="0 0 36 36" aria-hidden="true">
        <circle className="dash-alert-ring-bg" cx="18" cy="18" r="16" />
        <circle
          className="dash-alert-ring-fg"
          cx="18" cy="18" r="16"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
    </button>
  );
}

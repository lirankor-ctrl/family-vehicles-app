import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { useNotifications } from '../store/NotificationContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { activeVehicles, archivedVehicles } = useVehicleStore();
  const { activeAlerts } = useNotifications();

  const alertCount     = activeAlerts.length;
  const activeCount    = activeVehicles.length;
  const archivedCount  = archivedVehicles.length;

  // treatments page only shows active vehicles → mirror that count here
  const treatmentCount = activeVehicles.reduce(
    (n, v) => n + v.notes.filter(note => note.type === 'treatment').length,
    0,
  );

  const renewalsSubtitle =
    activeCount === 0
      ? 'הוסיפו רכבים ועקבו אחר תאריכי תפוגה'
      : alertCount > 0
        ? `${activeCount} רכבים · ${alertCount} התראות פעילות`
        : `${activeCount} רכבים`;

  const treatmentsSubtitle =
    treatmentCount === 0
      ? 'תיעוד טיפולים והיסטוריית שירות'
      : treatmentCount === 1
        ? 'טיפול אחד בארכיון'
        : `${treatmentCount} טיפולים בארכיון`;

  return (
    <div className="content landing-content">
      <div className="landing-hero">
        <img
          src="/app-logo.png"
          alt="קצין רכב"
          className="landing-logo"
        />
        <h1 className="landing-title">קצין רכב</h1>
        <p className="landing-tagline">ניהול חכם של רכבי המשפחה</p>
      </div>

      <div className="landing-cards">
        <button
          className="landing-card"
          onClick={() => navigate('/renewals')}
          aria-label="חידושי ביטוח ורישיון"
        >
          <span className="landing-card-icon" aria-hidden="true">📋</span>
          <div className="landing-card-body">
            <span className="landing-card-title">חידושי ביטוח / רישיון</span>
            <span className="landing-card-subtitle">{renewalsSubtitle}</span>
          </div>
          {alertCount > 0 && (
            <span className="landing-card-badge" aria-hidden="true">{alertCount}</span>
          )}
          <span className="landing-card-arrow" aria-hidden="true">‹</span>
        </button>

        <button
          className="landing-card"
          onClick={() => navigate('/treatments')}
          aria-label="טיפולים"
        >
          <span className="landing-card-icon" aria-hidden="true">🔧</span>
          <div className="landing-card-body">
            <span className="landing-card-title">טיפולים</span>
            <span className="landing-card-subtitle">{treatmentsSubtitle}</span>
          </div>
          <span className="landing-card-arrow" aria-hidden="true">‹</span>
        </button>

        <button
          className="landing-card landing-card-secondary"
          onClick={() => navigate('/archive')}
          aria-label="ארכיון רכבים"
        >
          <span className="landing-card-icon landing-card-icon-secondary" aria-hidden="true">🗄️</span>
          <div className="landing-card-body">
            <span className="landing-card-title">ארכיון</span>
            <span className="landing-card-subtitle">
              {archivedCount === 0
                ? 'רכבים שיועברו לארכיון יישמרו כאן'
                : archivedCount === 1
                  ? 'רכב אחד בארכיון'
                  : `${archivedCount} רכבים בארכיון`}
            </span>
          </div>
          <span className="landing-card-arrow" aria-hidden="true">‹</span>
        </button>
      </div>
    </div>
  );
}

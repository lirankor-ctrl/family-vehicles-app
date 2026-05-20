import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { useNotifications } from '../store/NotificationContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { vehicles } = useVehicleStore();
  const { activeAlerts } = useNotifications();

  const alertCount = activeAlerts.length;

  const treatmentCount = vehicles.reduce(
    (n, v) => n + v.notes.filter(note => note.type === 'treatment').length,
    0,
  );

  const renewalsSubtitle =
    vehicles.length === 0
      ? 'הוסיפו רכבים ועקבו אחר תאריכי תפוגה'
      : alertCount > 0
        ? `${vehicles.length} רכבים · ${alertCount} התראות פעילות`
        : `${vehicles.length} רכבים`;

  const treatmentsSubtitle =
    treatmentCount === 0
      ? 'תיעוד טיפולים והיסטוריית שירות'
      : treatmentCount === 1
        ? 'טיפול אחד בארכיון'
        : `${treatmentCount} טיפולים בארכיון`;

  return (
    <div className="content landing-content">
      <div className="landing-hero">
        <div className="landing-icon">🚗</div>
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
      </div>
    </div>
  );
}

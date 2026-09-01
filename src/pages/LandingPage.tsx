import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { useNotifications } from '../store/NotificationContext';
import { useChecklistStore } from '../store/ChecklistContext';
import { useAccidentStore } from '../store/AccidentContext';
import HoldToActivateButton from '../components/HoldToActivateButton';

export default function LandingPage() {
  const navigate = useNavigate();
  const { activeVehicles, archivedVehicles } = useVehicleStore();
  const { activeAlerts } = useNotifications();
  const { checklists } = useChecklistStore();
  const { cases: accidentCases, createCase } = useAccidentStore();

  const startAccident = () => {
    const id = createCase();
    navigate(`/accident/${id}`);
  };

  const alertCount     = activeAlerts.length;
  const activeCount    = activeVehicles.length;
  const archivedCount  = archivedVehicles.length;
  const checklistCount = checklists.length;

  // treatments page only shows active vehicles → mirror that count here
  const treatmentCount = activeVehicles.reduce(
    (n, v) => n + v.notes.filter(note => note.type === 'treatment').length,
    0,
  );

  const checklistOpenCount = checklists.reduce(
    (n, c) => n + c.items.filter(it => !it.completed).length,
    0,
  );

  const renewalsSubtitle =
    activeCount === 0
      ? 'רכבים, חידושים, מנויים, מסמכים והתראות'
      : alertCount > 0
        ? `${activeCount} רכבים · ${alertCount} התראות פעילות`
        : `${activeCount} רכבים · הכל בתוקף`;

  const treatmentsSubtitle =
    treatmentCount === 0 ? 'היסטוריית שירות' : `${treatmentCount} טיפולים`;

  const checklistsSubtitle =
    checklistCount === 0
      ? 'רשימות אישיות'
      : checklistOpenCount === 0
        ? 'הכל הושלם 🎉'
        : `${checklistOpenCount} פתוחים`;

  return (
    <div className="content landing-content">
      <div className="landing-hero">
        <img src="/app-logo.png" alt="קצין רכב" className="landing-logo" />
        <h1 className="landing-title">קצין רכב</h1>
        <p className="landing-tagline">ניהול חכם של רכבי המשפחה</p>
      </div>

      <div className="dash">
        {/* ── Primary (largest) ── */}
        <button
          className="dash-primary"
          onClick={() => navigate('/renewals')}
          aria-label="חידושים ומנויים"
        >
          <span className="dash-primary-icon" aria-hidden="true">🚗</span>
          <div className="dash-primary-body">
            <span className="dash-primary-title">חידושים / מנויים</span>
            <span className="dash-primary-subtitle">{renewalsSubtitle}</span>
          </div>
          {alertCount > 0 && (
            <span className="dash-badge" aria-hidden="true">{alertCount}</span>
          )}
        </button>

        {/* ── Emergency: hold-to-activate accident mode ── */}
        <HoldToActivateButton onActivate={startAccident} />

        <button className="dash-small dash-small-full" onClick={() => navigate('/accidents')} aria-label="תאונות">
          <span className="dash-small-icon" aria-hidden="true">📁</span>
          <span className="dash-small-title">תאונות</span>
          {accidentCases.length > 0 && <span className="dash-small-count">{accidentCases.length}</span>}
        </button>

        {/* ── Medium row ── */}
        <div className="dash-row">
          <button className="dash-medium" onClick={() => navigate('/treatments')} aria-label="טיפולים">
            <span className="dash-medium-icon" aria-hidden="true">🔧</span>
            <span className="dash-medium-title">טיפולים</span>
            <span className="dash-medium-subtitle">{treatmentsSubtitle}</span>
          </button>

          <button className="dash-medium" onClick={() => navigate('/checklists')} aria-label="צ'ק ליסט">
            <span className="dash-medium-icon" aria-hidden="true">📋</span>
            <span className="dash-medium-title">צ'ק ליסט</span>
            <span className="dash-medium-subtitle">{checklistsSubtitle}</span>
          </button>
        </div>

        {/* ── Small row ── */}
        <div className="dash-row">
          <button className="dash-small" onClick={() => navigate('/archive')} aria-label="ארכיון">
            <span className="dash-small-icon" aria-hidden="true">🗄️</span>
            <span className="dash-small-title">ארכיון</span>
            {archivedCount > 0 && <span className="dash-small-count">{archivedCount}</span>}
          </button>

          <button className="dash-small" onClick={() => navigate('/links')} aria-label="קישורים">
            <span className="dash-small-icon" aria-hidden="true">🔗</span>
            <span className="dash-small-title">קישורים</span>
          </button>
        </div>

        {/* ── Backup / export footer action ── */}
        <button className="dash-export" onClick={() => navigate('/export')} aria-label="גיבוי וייצוא PDF">
          <span aria-hidden="true">📄</span>
          <span>גיבוי וייצוא PDF</span>
        </button>
      </div>
    </div>
  );
}

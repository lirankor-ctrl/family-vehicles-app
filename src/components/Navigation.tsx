import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../store/NotificationContext';

export default function Navigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { activeAlerts } = useNotifications();

  // hide nav on: landing page and form screens
  const isLanding = pathname === '/';
  const isForm    = pathname === '/vehicle/new' || pathname.endsWith('/edit');
  if (isLanding || isForm) return null;

  const alertCount = activeAlerts.length;

  // /vehicle/:id detail counts as "in renewals context"
  const isRenewals   = pathname === '/renewals' || pathname.startsWith('/vehicle/');
  const isTreatments = pathname === '/treatments';
  const isAlerts     = pathname === '/alerts';

  return (
    <nav className="bottom-nav">
      <button
        className="nav-btn"
        onClick={() => navigate('/')}
        aria-label="מסך פתיחה"
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">בית</span>
      </button>

      <button
        className={`nav-btn ${isRenewals ? 'active' : ''}`}
        onClick={() => navigate('/renewals')}
        aria-label="חידושי ביטוח ורישיון"
      >
        <span className="nav-icon">🚗</span>
        <span className="nav-label">חידושים</span>
      </button>

      <button
        className={`nav-btn ${isTreatments ? 'active' : ''}`}
        onClick={() => navigate('/treatments')}
        aria-label="טיפולים"
      >
        <span className="nav-icon">🔧</span>
        <span className="nav-label">טיפולים</span>
      </button>

      <button
        className={`nav-btn ${isAlerts ? 'active' : ''}`}
        onClick={() => navigate('/alerts')}
        aria-label={`התראות${alertCount > 0 ? ` — ${alertCount} פעילות` : ''}`}
      >
        <span className="nav-icon">
          🔔
          {alertCount > 0 && (
            <span className="nav-count" aria-hidden="true">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </span>
        <span className="nav-label">התראות</span>
      </button>
    </nav>
  );
}

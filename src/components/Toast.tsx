import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../store/NotificationContext';

export default function Toast() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { showToast, unseenAlerts, markAllSeen } = useNotifications();

  if (!showToast) return null;

  // redundant on /alerts (the user is already looking at the full list);
  // distracting on the add/edit form
  const isAlerts = pathname === '/alerts';
  const isForm   = pathname === '/vehicle/new' || pathname.endsWith('/edit');
  if (isAlerts || isForm) return null;

  const count = unseenAlerts.length;
  const subtitle = count === 1
    ? 'התראה חדשה ממתינה'
    : `${count} התראות חדשות ממתינות`;

  const handleView = () => {
    markAllSeen();
    navigate('/alerts');
  };

  return (
    <div className="toast-banner" role="alert" aria-live="polite">
      <div className="toast-icon" aria-hidden="true">🔔</div>
      <div className="toast-body">
        <div className="toast-title">יש חידוש רכב שדורש טיפול</div>
        <div className="toast-subtitle">{subtitle}</div>
      </div>
      <button className="toast-view" onClick={handleView}>
        הצג
      </button>
      <button
        className="toast-dismiss"
        onClick={markAllSeen}
        aria-label="סגור התראה"
      >
        ✕
      </button>
    </div>
  );
}

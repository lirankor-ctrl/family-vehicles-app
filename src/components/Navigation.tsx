import { useNavigate, useLocation } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { getExpiryStatus } from '../utils/dateUtils';

export default function Navigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { vehicles } = useVehicleStore();

  // hide nav entirely on form screens
  const isForm = pathname === '/vehicle/new' || pathname.endsWith('/edit');
  if (isForm) return null;

  // count vehicles with ANY expiry within 30 days or already expired
  const alertCount = vehicles.reduce((n, v) => {
    const ls = getExpiryStatus(v.licenseExpiryDate);
    const is = getExpiryStatus(v.insuranceExpiryDate);
    const hasAlert = (s: ReturnType<typeof getExpiryStatus>) =>
      s === 'expired' || s === 'urgent' || s === 'soon';
    return n + (hasAlert(ls) || hasAlert(is) ? 1 : 0);
  }, 0);

  const isHome   = pathname === '/';
  const isAlerts = pathname === '/alerts';

  return (
    <nav className="bottom-nav">
      <button
        className={`nav-btn ${isHome ? 'active' : ''}`}
        onClick={() => navigate('/')}
        aria-label="מסך בית"
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">בית</span>
      </button>

      <button
        className="fab"
        onClick={() => navigate('/vehicle/new')}
        aria-label="הוסף רכב חדש"
      >
        +
      </button>

      <button
        className={`nav-btn ${isAlerts ? 'active' : ''}`}
        onClick={() => navigate('/alerts')}
        aria-label={`התראות${alertCount > 0 ? ` — ${alertCount} פעילות` : ''}`}
      >
        <span className="nav-icon">
          🔔
          {alertCount > 0 && <span className="badge-dot" aria-hidden="true" />}
        </span>
        <span className="nav-label">התראות</span>
      </button>
    </nav>
  );
}

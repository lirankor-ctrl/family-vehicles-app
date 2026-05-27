import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { formatDate, getExpiryStatus } from '../utils/dateUtils';
import StatusBadge from '../components/StatusBadge';

export default function HomePage() {
  const navigate = useNavigate();
  const { activeVehicles, archivedVehicles } = useVehicleStore();

  const count          = activeVehicles.length;
  const archivedCount  = archivedVehicles.length;

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          {/* RTL: → points toward start (right side) = "back to landing" */}
          <button className="back-btn" onClick={() => navigate('/')} aria-label="חזרה למסך פתיחה">→</button>
          <img src="/app-logo.png" alt="" className="topbar-logo" aria-hidden="true" />
          <span className="topbar-title">🚗 רכבי המשפחה</span>
          {count > 0 && (
            <span className="topbar-subtitle">{count} רכבים</span>
          )}
        </div>
      </div>

      <div className="content">
        {count === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <h2>{archivedCount > 0 ? 'אין רכבים פעילים' : 'אין רכבים עדיין'}</h2>
            <p>
              {archivedCount > 0
                ? 'כל הרכבים שלכם נמצאים בארכיון. אפשר לשחזר אותם או להוסיף רכב חדש.'
                : 'לחצו על כפתור + למטה כדי להוסיף את הרכב הראשון של המשפחה'}
            </p>
          </div>
        ) : (
          activeVehicles.map(v => {
            const ls = getExpiryStatus(v.licenseExpiryDate);
            const is = getExpiryStatus(v.insuranceExpiryDate);
            const worstStatus =
              ls === 'expired' || is === 'expired' ? 'alert-expired' :
              ls === 'urgent'  || is === 'urgent'  ? 'alert-urgent'  :
              ls === 'soon'    || is === 'soon'    ? 'alert-soon'    : '';

            const hasChips = Boolean(v.vehicleType || v.licensePlate);
            const hasDates = Boolean(v.licenseExpiryDate || v.insuranceExpiryDate);

            return (
              <div
                key={v.id}
                className={`vehicle-card ${worstStatus}`}
                onClick={() => navigate(`/vehicle/${v.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/vehicle/${v.id}`)}
              >
                <div className="vc-header">
                  <span className="vc-driver">{v.driverName}</span>
                  {v.photo
                    ? <img className="vc-thumb" src={v.photo} alt="" aria-hidden="true" />
                    : <span className="vc-car-icon">🚗</span>}
                </div>

                {/* only render chips section when there's at least one chip */}
                {hasChips && (
                  <div className="vc-chips">
                    {v.vehicleType  && <span className="chip">🚙 {v.vehicleType}</span>}
                    {v.licensePlate && <span className="chip">🔢 {v.licensePlate}</span>}
                  </div>
                )}

                {hasDates && (
                  <div className="vc-dates">
                    {v.licenseExpiryDate && (
                      <div className="date-row">
                        <span className="date-row-label">📋 רישיון:</span>
                        <div className="date-row-right">
                          <span>{formatDate(v.licenseExpiryDate)}</span>
                          <StatusBadge status={ls} dateStr={v.licenseExpiryDate} />
                        </div>
                      </div>
                    )}
                    {v.insuranceExpiryDate && (
                      <div className="date-row">
                        <span className="date-row-label">🛡️ ביטוח:</span>
                        <div className="date-row-right">
                          <span>{formatDate(v.insuranceExpiryDate)}</span>
                          <StatusBadge status={is} dateStr={v.insuranceExpiryDate} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <button
        className="fab fab-floating"
        onClick={() => navigate('/vehicle/new')}
        aria-label="הוסף רכב חדש"
      >
        +
      </button>
    </>
  );
}

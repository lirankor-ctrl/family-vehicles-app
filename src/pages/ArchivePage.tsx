import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { useAccidentStore } from '../store/AccidentContext';
import { formatDate } from '../utils/dateUtils';

export default function ArchivePage() {
  const navigate = useNavigate();
  const { archivedVehicles } = useVehicleStore();
  const { cases: accidentCases } = useAccidentStore();

  // newest archive first
  const sorted = [...archivedVehicles].sort((a, b) =>
    (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''),
  );

  // archivedAt is an ISO datetime — slice the date portion for formatDate
  const formatArchivedDate = (iso: string | undefined) =>
    iso ? formatDate(iso.slice(0, 10)) : '—';

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          <button
            className="back-btn"
            onClick={() => navigate('/')}
            aria-label="חזרה למסך פתיחה"
          >
            →
          </button>
          <img src="/app-logo.png" alt="" className="topbar-logo" aria-hidden="true" />
          <span className="topbar-title">🗄️ ארכיון</span>
          {sorted.length > 0 && (
            <span className="topbar-subtitle">{sorted.length} בארכיון</span>
          )}
        </div>
      </div>

      <div className="content">
        <button className="archive-accidents-card" onClick={() => navigate('/accidents')} aria-label="תאונות">
          <span className="archive-accidents-icon" aria-hidden="true">🚨</span>
          <div className="archive-accidents-body">
            <span className="archive-accidents-title">תאונות</span>
            <span className="archive-accidents-subtitle">
              {accidentCases.length > 0 ? `${accidentCases.length} תיקי תאונה` : 'היסטוריית תאונות'}
            </span>
          </div>
          <span className="archive-accidents-arrow" aria-hidden="true">‹</span>
        </button>

        {sorted.length > 0 && <div className="section-title">🚗 רכבים בארכיון</div>}

        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗄️</div>
            <h2>אין רכבים בארכיון</h2>
            <p>רכבים שתעבירו לארכיון יופיעו כאן ויישמרו עם כל הפרטים — אפשר לשחזר אותם בכל עת.</p>
          </div>
        ) : (
          sorted.map(v => (
            <div
              key={v.id}
              className="vehicle-card archived-card"
              onClick={() => navigate(`/vehicle/${v.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(`/vehicle/${v.id}`)}
            >
              <div className="vc-header">
                <span className="vc-driver">{v.driverName}</span>
                <span className="archived-pill" aria-label="בארכיון">🗄️ בארכיון</span>
              </div>

              {(v.vehicleType || v.licensePlate) && (
                <div className="vc-chips">
                  {v.vehicleType  && <span className="chip">🚙 {v.vehicleType}</span>}
                  {v.licensePlate && <span className="chip">🔢 {v.licensePlate}</span>}
                </div>
              )}

              <div className="vc-dates">
                <div className="date-row">
                  <span className="date-row-label">📅 תאריך ארכוב:</span>
                  <div className="date-row-right">
                    <span>{formatArchivedDate(v.archivedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

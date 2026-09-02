import { useNavigate } from 'react-router-dom';
import { useAccidentStore } from '../store/AccidentContext';
import { formatDate } from '../utils/dateUtils';

export default function AccidentsPage() {
  const navigate = useNavigate();
  const { sortedCases } = useAccidentStore();

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          <button className="back-btn" onClick={() => navigate('/archive')} aria-label="חזרה לארכיון">→</button>
          <img src="/app-logo.png" alt="" className="topbar-logo" aria-hidden="true" />
          <span className="topbar-title">🚨 תאונות</span>
        </div>
      </div>

      <div className="content">
        {sortedCases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h2>אין עדיין תיקי תאונה</h2>
            <p>תיקי תאונה שתפתחו יופיעו כאן, ותוכלו לחזור אליהם בכל שלב.</p>
          </div>
        ) : (
          <div className="accidents-list">
            {sortedCases.map(kase => (
              <button key={kase.id} className="accident-list-card" onClick={() => navigate(`/accident/${kase.id}`)}>
                {kase.vehicleSnapshot?.photo ? (
                  <img src={kase.vehicleSnapshot.photo} alt="" className="vc-thumb" />
                ) : (
                  <div className="vc-thumb accident-list-thumb-fallback">🚗</div>
                )}
                <div className="accident-list-body">
                  <div className="accident-list-date">
                    {kase.accidentDate ? formatDate(kase.accidentDate) : formatDate(kase.createdAt.slice(0, 10))}
                    {kase.accidentTime ? ` · ${kase.accidentTime}` : ''}
                  </div>
                  <div className="accident-list-driver">
                    {kase.vehicleSnapshot?.driverName ?? 'ללא רכב משויך'}
                    {kase.vehicleSnapshot?.licensePlate ? ` · ${kase.vehicleSnapshot.licensePlate}` : ''}
                  </div>
                  {kase.locationText && <div className="accident-list-location">{kase.locationText}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

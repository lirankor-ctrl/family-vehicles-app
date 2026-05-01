import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { formatDate, getDaysUntil, getExpiryStatus } from '../utils/dateUtils';

interface AlertEntry {
  vehicleId: string;
  driverName: string;
  docType: 'license' | 'insurance';
  expiryDate: string;
  days: number;
}

export default function AlertsPage() {
  const navigate = useNavigate();
  const { vehicles } = useVehicleStore();

  const alerts: AlertEntry[] = [];

  for (const v of vehicles) {
    if (v.licenseExpiryDate) {
      const days = getDaysUntil(v.licenseExpiryDate);
      if (days !== null && days <= 30) {
        alerts.push({ vehicleId: v.id, driverName: v.driverName, docType: 'license', expiryDate: v.licenseExpiryDate, days });
      }
    }
    if (v.insuranceExpiryDate) {
      const days = getDaysUntil(v.insuranceExpiryDate);
      if (days !== null && days <= 30) {
        alerts.push({ vehicleId: v.id, driverName: v.driverName, docType: 'insurance', expiryDate: v.insuranceExpiryDate, days });
      }
    }
  }

  // most urgent first (expired items have negative days → they come first)
  alerts.sort((a, b) => a.days - b.days);

  const noVehicles = vehicles.length === 0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          <span className="topbar-title">🔔 התראות</span>
        </div>
      </div>

      <div className="content">
        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{noVehicles ? '🚗' : '✅'}</div>
            <h2>{noVehicles ? 'אין רכבים עדיין' : 'הכל בסדר!'}</h2>
            <p>
              {noVehicles
                ? 'הוסף רכב מהמסך הראשי כדי לעקוב אחר תאריכי תפוגה ולקבל התראות.'
                : 'אין חידושים קרובים ב-30 הימים הקרובים. כל התאריכים בתוקף.'}
            </p>
          </div>
        ) : (
          <>
            <div className="alerts-summary">
              <span className="alerts-summary-count">{alerts.length}</span>
              <span className="alerts-summary-label">
                {alerts.length === 1 ? 'התראה פעילה' : 'התראות פעילות'}
              </span>
            </div>

            <div className="alerts-list">
              {alerts.map(a => {
                const status = getExpiryStatus(a.expiryDate);

                // card border class:
                // expired → default (red border, no extra class)
                // urgent (1–7 days) → warning (orange border)
                // soon (8–30 days) → info (yellow border)
                const cardClass =
                  status === 'expired' ? '' :
                  status === 'urgent'  ? 'warning' : 'info';

                // text color for the days line
                const daysColor =
                  status === 'expired' ? 'red' :
                  status === 'urgent'  ? 'orange' : 'yellow';

                // label: show "פג תוקף" for expired, otherwise "עומד לפוג"
                const typeLabel =
                  a.docType === 'license'
                    ? status === 'expired' ? '📋 רישיון רכב — פג תוקף' : '📋 רישיון רכב עומד לפוג'
                    : status === 'expired' ? '🛡️ ביטוח — פג תוקף'     : '🛡️ ביטוח עומד לפוג';

                const daysLabel =
                  a.days < 0  ? `❌ פג תוקף לפני ${Math.abs(a.days)} ימים (${formatDate(a.expiryDate)})` :
                  a.days === 0 ? `🚨 פג תוקף היום! (${formatDate(a.expiryDate)})` :
                  a.days === 1 ? `⏰ פג תוקף מחר — ${formatDate(a.expiryDate)}` :
                                 `⏰ עוד ${a.days} ימים — ${formatDate(a.expiryDate)}`;

                return (
                  <div
                    key={`${a.vehicleId}-${a.docType}`}   // stable key
                    className={`alert-card ${cardClass}`}
                    onClick={() => navigate(`/vehicle/${a.vehicleId}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/vehicle/${a.vehicleId}`)}
                  >
                    <div className="alert-driver">{a.driverName}</div>
                    <div className="alert-type-label">{typeLabel}</div>
                    <div className={`alert-days ${daysColor}`}>{daysLabel}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

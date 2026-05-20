import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { useNotifications } from '../store/NotificationContext';
import { formatDate, getExpiryStatus } from '../utils/dateUtils';

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
  const { activeAlerts, enabled, setEnabled, markAllSeen } = useNotifications();

  // visiting this page = acknowledging every currently-active alert
  useEffect(() => {
    markAllSeen();
  }, [markAllSeen]);

  // join active-alert items with their vehicle for display
  const vehicleById = new Map(vehicles.map(v => [v.id, v]));
  const alerts: AlertEntry[] = activeAlerts.flatMap(a => {
    const v = vehicleById.get(a.vehicleId);
    if (!v) return [];
    return [{
      vehicleId:  a.vehicleId,
      driverName: v.driverName,
      docType:    a.docType,
      expiryDate: a.expiryDate,
      days:       a.days,
    }];
  });

  // most urgent first (expired items have negative days → they come first)
  alerts.sort((a, b) => a.days - b.days);

  const noVehicles = vehicles.length === 0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          <img src="/logo.png" alt="" className="topbar-logo" aria-hidden="true" />
          <span className="topbar-title">🔔 התראות</span>
        </div>
      </div>

      <div className="content">
        <div className="settings-row">
          <label className="settings-label" htmlFor="notify-toggle">
            <span className="settings-icon" aria-hidden="true">🔔</span>
            <span>הפעל התראות</span>
          </label>
          <button
            id="notify-toggle"
            role="switch"
            aria-checked={enabled}
            aria-label="הפעל התראות"
            className={`switch ${enabled ? 'on' : 'off'}`}
            onClick={() => setEnabled(!enabled)}
          >
            <span className="switch-thumb" aria-hidden="true" />
          </button>
        </div>
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

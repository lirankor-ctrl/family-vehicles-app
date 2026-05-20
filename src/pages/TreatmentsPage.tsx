import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { formatDate } from '../utils/dateUtils';

interface TreatmentEntry {
  vehicleId: string;
  driverName: string;
  vehicleType?: string;
  licensePlate?: string;
  noteId: string;
  date: string;
  title?: string;
  description: string;
}

export default function TreatmentsPage() {
  const navigate = useNavigate();
  const { vehicles } = useVehicleStore();
  const [query, setQuery] = useState('');

  // flatten all treatment notes, newest first
  const all: TreatmentEntry[] = useMemo(() => {
    const list: TreatmentEntry[] = [];
    for (const v of vehicles) {
      for (const n of v.notes) {
        if (n.type !== 'treatment') continue;
        list.push({
          vehicleId:    v.id,
          driverName:   v.driverName,
          vehicleType:  v.vehicleType,
          licensePlate: v.licensePlate,
          noteId:       n.id,
          date:         n.date,
          title:        n.title,
          description:  n.description,
        });
      }
    }
    // ISO date strings compare lexically, newest first
    list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return list;
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(t =>
      t.driverName.toLowerCase().includes(q) ||
      (t.vehicleType?.toLowerCase().includes(q)  ?? false) ||
      (t.licensePlate?.toLowerCase().includes(q) ?? false) ||
      (t.title?.toLowerCase().includes(q)        ?? false) ||
      t.description.toLowerCase().includes(q),
    );
  }, [all, query]);

  const noTreatments = all.length === 0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          {/* RTL: → points toward start (right) = "back to landing" */}
          <button className="back-btn" onClick={() => navigate('/')} aria-label="חזרה למסך פתיחה">→</button>
          <img src="/logo.png" alt="" className="topbar-logo" aria-hidden="true" />
          <span className="topbar-title">🔧 טיפולים</span>
          {all.length > 0 && (
            <span className="topbar-subtitle">{all.length} סה״כ</span>
          )}
        </div>
      </div>

      <div className="content">
        {noTreatments ? (
          <div className="empty-state">
            <div className="empty-icon">🔧</div>
            <h2>אין טיפולים עדיין</h2>
            <p>
              {vehicles.length === 0
                ? 'הוסיפו רכב ולאחר מכן צרפו טיפולים מתוך מסך הרכב — הם יופיעו כאן באופן מאוחד.'
                : 'תוכלו להוסיף טיפולים מתוך מסך כל רכב — הם יופיעו כאן באופן מאוחד.'}
            </p>
          </div>
        ) : (
          <>
            <div className="search-bar">
              <input
                className="form-input search-input"
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="🔍 חיפוש לפי נהג, רכב או תיאור..."
                aria-label="חיפוש טיפולים"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="search-empty">לא נמצאו טיפולים תואמים לחיפוש.</p>
            ) : (
              <div className="treatment-list">
                {filtered.map(t => {
                  const headline = t.title?.trim() || t.description;
                  const hasSecondary = Boolean(t.title?.trim() && t.description);
                  const hasChips = Boolean(t.vehicleType || t.licensePlate);

                  return (
                    <div
                      key={`${t.vehicleId}-${t.noteId}`}
                      className="treatment-card"
                      onClick={() => navigate(`/vehicle/${t.vehicleId}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && navigate(`/vehicle/${t.vehicleId}`)}
                    >
                      <div className="treatment-card-head">
                        <span className="treatment-driver">{t.driverName}</span>
                        <span className="treatment-date">📅 {formatDate(t.date)}</span>
                      </div>

                      <div className="treatment-title">🔧 {headline}</div>

                      {hasSecondary && (
                        <div className="treatment-desc">{t.description}</div>
                      )}

                      {hasChips && (
                        <div className="treatment-chips">
                          {t.vehicleType  && <span className="chip">🚙 {t.vehicleType}</span>}
                          {t.licensePlate && <span className="chip">🔢 {t.licensePlate}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

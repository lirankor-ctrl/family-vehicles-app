import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChecklistStore } from '../store/ChecklistContext';
import { formatDate } from '../utils/dateUtils';

export default function ChecklistsPage() {
  const navigate = useNavigate();
  const { checklists, deleteChecklist } = useChecklistStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // newest update first
  const sorted = [...checklists].sort(
    (a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0),
  );

  const total = checklists.length;

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
          <span className="topbar-title">📋 צ'ק ליסט</span>
          {total > 0 && <span className="topbar-subtitle">{total} סה״כ</span>}
        </div>
      </div>

      <div className="content">
        <div className="checklist-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/checklists/new')}
          >
            + צ'ק ליסט חדש
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/checklists/import')}
          >
            📥 ייבוא מאקסל
          </button>
        </div>

        {total === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>עדיין אין צ'ק ליסטים</h2>
            <p>אפשר ליצור צ'ק ליסט חדש או לייבא מאקסל.</p>
          </div>
        ) : (
          <div className="checklist-list">
            {sorted.map(c => {
              const total      = c.items.length;
              const done       = c.items.filter(it => it.completed).length;
              const pct        = total === 0 ? 0 : Math.round((done / total) * 100);
              const lastUpdate = formatDate(c.updatedAt.slice(0, 10));
              const isConfirming = confirmDeleteId === c.id;

              return (
                <div key={c.id} className="checklist-card">
                  <div
                    className="checklist-card-main"
                    onClick={() => navigate(`/checklists/${c.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/checklists/${c.id}`)}
                  >
                    <div className="checklist-card-head">
                      <span className="checklist-card-name">{c.name}</span>
                      <span className="checklist-card-pct">{pct}%</span>
                    </div>
                    {c.description && (
                      <div className="checklist-card-desc">{c.description}</div>
                    )}
                    <div className="checklist-progress">
                      <div
                        className="checklist-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="checklist-card-meta">
                      <span>{done} מתוך {total} פריטים</span>
                      <span>· עודכן {lastUpdate}</span>
                    </div>
                  </div>

                  {!isConfirming ? (
                    <div className="checklist-card-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/checklists/${c.id}`)}
                      >
                        פתח
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setConfirmDeleteId(c.id)}
                        style={{ color: 'var(--red-500)' }}
                        aria-label={`מחק את ${c.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <div className="checklist-inline-confirm">
                      <span>למחוק את "{c.name}"?</span>
                      <div className="checklist-inline-confirm-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          ביטול
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            deleteChecklist(c.id);
                            setConfirmDeleteId(null);
                          }}
                        >
                          מחק
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

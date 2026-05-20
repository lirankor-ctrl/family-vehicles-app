import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChecklistStore } from '../store/ChecklistContext';

export default function ChecklistFormPage() {
  const navigate = useNavigate();
  const { addChecklist } = useChecklistStore();

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [nameError,   setNameError]   = useState<string | undefined>();

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('שם הצ\'ק ליסט הוא שדה חובה');
      return;
    }
    const id = addChecklist({
      name:        trimmed,
      description: description.trim() || undefined,
    });
    navigate(`/checklists/${id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter in the name field submits; in the textarea Enter adds a newline
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      handleSave();
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
            aria-label="חזרה"
          >
            →
          </button>
          <span className="topbar-title">צ'ק ליסט חדש</span>
        </div>
      </div>

      <div className="content">
        <div className="form-section">
          <div className="section-title">📋 פרטי הצ'ק ליסט</div>

          <div className="form-group">
            <label className="form-label" htmlFor="cl-name">
              <span className="required-star">*</span>שם
            </label>
            <input
              id="cl-name"
              className={`form-input ${nameError ? 'has-error' : ''}`}
              type="text"
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setNameError(undefined); }}
              onKeyDown={onKeyDown}
              placeholder="לדוגמה: חידוש רישוי, רשימת ציוד לטיול..."
            />
            {nameError && <div className="form-error" role="alert">{nameError}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cl-desc">תיאור (אופציונלי)</label>
            <textarea
              id="cl-desc"
              className="form-textarea"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="מטרת הצ'ק ליסט, הקשר או הערות כלליות..."
            />
          </div>
        </div>

        <p className="form-hint" style={{ textAlign: 'center', margin: '10px 0 18px' }}>
          לאחר היצירה תוכלו להוסיף פריטים מתוך מסך הצ'ק ליסט.
        </p>

        <div className="form-actions">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(-1)}>
            ביטול
          </button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
            צור צ'ק ליסט
          </button>
        </div>
      </div>
    </>
  );
}

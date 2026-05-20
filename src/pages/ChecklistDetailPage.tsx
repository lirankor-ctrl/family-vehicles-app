import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChecklistStore } from '../store/ChecklistContext';
import { ChecklistItem } from '../types';

export default function ChecklistDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    getChecklist,
    updateChecklist,
    deleteChecklist,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
  } = useChecklistStore();

  const checklist = id ? getChecklist(id) : undefined;

  // local edit-mode state for the title/description card
  const [editingMeta,    setEditingMeta]    = useState(false);
  const [draftName,      setDraftName]      = useState('');
  const [draftDesc,      setDraftDesc]      = useState('');

  // add-item form state
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [newItemTitle,   setNewItemTitle]   = useState('');
  const [newItemNotes,   setNewItemNotes]   = useState('');

  // permanent-delete confirmation for the whole checklist
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  if (!checklist) {
    return (
      <div className="content" style={{ paddingTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--purple-200)', marginBottom: 20 }}>הצ'ק ליסט לא נמצא</p>
        <button className="btn btn-secondary" onClick={() => navigate('/checklists')}>
          חזרה לרשימה
        </button>
      </div>
    );
  }

  const total = checklist.items.length;
  const done  = checklist.items.filter(it => it.completed).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  const startEditMeta = () => {
    setDraftName(checklist.name);
    setDraftDesc(checklist.description ?? '');
    setEditingMeta(true);
  };

  const saveMeta = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return; // name required — silently no-op
    updateChecklist(checklist.id, {
      name:        trimmed,
      description: draftDesc.trim() || undefined,
    });
    setEditingMeta(false);
  };

  const handleAddItem = () => {
    const t = newItemTitle.trim();
    if (!t) return;
    addItem(checklist.id, {
      title:     t,
      notes:     newItemNotes.trim() || undefined,
      completed: false,
    });
    setNewItemTitle('');
    setNewItemNotes('');
    setShowAddForm(false);
  };

  const handleConfirmedDelete = () => {
    deleteChecklist(checklist.id);
    navigate('/checklists');
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          <button
            className="back-btn"
            onClick={() => navigate('/checklists')}
            aria-label="חזרה לרשימת הצ'ק ליסטים"
          >
            →
          </button>
          <img src="/app-logo.png" alt="" className="topbar-logo" aria-hidden="true" />
          <span className="topbar-title">📋 {checklist.name}</span>
        </div>
        <div className="topbar-end">
          {!editingMeta && (
            <button className="btn btn-ghost btn-sm" onClick={startEditMeta}>
              ✏️ עריכה
            </button>
          )}
        </div>
      </div>

      <div className="content">
        {/* ── Header card: title + description + progress ── */}
        <div className="card">
          {editingMeta ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="cl-edit-name">
                  <span className="required-star">*</span>שם
                </label>
                <input
                  id="cl-edit-name"
                  className="form-input"
                  type="text"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cl-edit-desc">תיאור</label>
                <textarea
                  id="cl-edit-desc"
                  className="form-textarea"
                  rows={3}
                  value={draftDesc}
                  onChange={e => setDraftDesc(e.target.value)}
                />
              </div>
              <div className="form-actions" style={{ paddingBottom: 0 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setEditingMeta(false)}
                >
                  ביטול
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  onClick={saveMeta}
                  disabled={!draftName.trim()}
                >
                  שמור
                </button>
              </div>
            </>
          ) : (
            <>
              {checklist.description && (
                <p className="checklist-description">{checklist.description}</p>
              )}
              <div className="checklist-progress-row">
                <span className="checklist-progress-text">
                  {done} מתוך {total} {total === 1 ? 'פריט' : 'פריטים'}
                </span>
                <span className="checklist-progress-pct">{pct}%</span>
              </div>
              <div className="checklist-progress">
                <div
                  className="checklist-progress-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* ── Items ── */}
        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0 }}>✅ פריטים</div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setShowAddForm(s => !s);
                setNewItemTitle('');
                setNewItemNotes('');
              }}
            >
              {showAddForm ? 'ביטול' : '+ הוסף פריט'}
            </button>
          </div>

          {showAddForm && (
            <div className="add-note-box" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-item-title">
                  <span className="required-star">*</span>כותרת
                </label>
                <input
                  id="new-item-title"
                  className="form-input"
                  type="text"
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  placeholder="מה צריך לעשות?"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-item-notes">הערות (אופציונלי)</label>
                <textarea
                  id="new-item-notes"
                  className="form-textarea"
                  rows={2}
                  value={newItemNotes}
                  onChange={e => setNewItemNotes(e.target.value)}
                  placeholder="פרטים נוספים..."
                />
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={handleAddItem}
                disabled={!newItemTitle.trim()}
              >
                הוסף
              </button>
            </div>
          )}

          {checklist.items.length === 0 && !showAddForm ? (
            <p style={{ color: 'var(--gray-400)', fontSize: '0.88rem', textAlign: 'center', padding: '14px 0' }}>
              אין פריטים עדיין. לחצו "+ הוסף פריט" כדי להתחיל.
            </p>
          ) : (
            <div className="item-stack">
              {checklist.items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(checklist.id, item.id)}
                  onSave={(patch) => updateItem(checklist.id, item.id, patch)}
                  onDelete={() => deleteItem(checklist.id, item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Delete entire checklist ── */}
        {!confirmDelete ? (
          <button
            className="btn btn-danger btn-full"
            onClick={() => setConfirmDelete(true)}
          >
            🗑️ מחק צ'ק ליסט
          </button>
        ) : (
          <div className="delete-confirm-box">
            <p className="delete-confirm-text">
              למחוק את הצ'ק ליסט <strong>{checklist.name}</strong>?<br />
              כל הפריטים יימחקו לצמיתות.
            </p>
            <div className="delete-confirm-actions">
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setConfirmDelete(false)}
              >
                ביטול
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleConfirmedDelete}
              >
                מחק לצמיתות
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Sub-component: a single item row with inline edit ── */

function ItemRow({
  item,
  onToggle,
  onSave,
  onDelete,
}: {
  item:     ChecklistItem;
  onToggle: () => void;
  onSave:   (patch: { title: string; notes?: string }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title,   setTitle]   = useState(item.title);
  const [notes,   setNotes]   = useState(item.notes ?? '');
  const [confirming, setConfirming] = useState(false);

  const startEdit = () => {
    setTitle(item.title);
    setNotes(item.notes ?? '');
    setEditing(true);
  };

  const save = () => {
    const t = title.trim();
    if (!t) return;
    onSave({ title: t, notes: notes.trim() || undefined });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="item-row item-row-editing">
        <div className="form-group">
          <label className="form-label">כותרת</label>
          <input
            className="form-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">הערות</label>
          <textarea
            className="form-textarea"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div className="form-actions" style={{ paddingBottom: 0 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>
            ביטול
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={save}
            disabled={!title.trim()}
          >
            שמור
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`item-row ${item.completed ? 'item-completed' : ''}`}>
      <label className="item-check">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={onToggle}
          aria-label={`סמן ${item.title}`}
        />
        <span className="item-check-box" aria-hidden="true">{item.completed ? '✓' : ''}</span>
      </label>
      <div className="item-body">
        <div className="item-title">{item.title}</div>
        {item.notes && <div className="item-notes">{item.notes}</div>}
      </div>
      <div className="item-actions">
        {!confirming ? (
          <>
            <button
              className="btn btn-ghost btn-sm"
              onClick={startEdit}
              aria-label="ערוך פריט"
              title="ערוך"
            >
              ✏️
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirming(true)}
              style={{ color: 'var(--red-500)' }}
              aria-label="מחק פריט"
              title="מחק"
            >
              🗑️
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirming(false)}
            >
              ביטול
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => { onDelete(); setConfirming(false); }}
            >
              מחק
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { formatDate, getExpiryStatus, todayISO } from '../utils/dateUtils';
import StatusBadge from '../components/StatusBadge';
import { Note, VehicleDocument } from '../types';

type DeleteState = 'idle' | 'choose' | 'permanent';

export default function VehicleDetailPage() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const {
    getVehicle,
    deleteVehicle,
    archiveVehicle,
    restoreVehicle,
    addNote,
    deleteNote,
    addDocument,
    deleteDocument,
  } = useVehicleStore();

  const vehicle = id ? getVehicle(id) : undefined;

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteType,     setNoteType]     = useState<'treatment' | 'general'>('treatment');
  const [noteDate,     setNoteDate]     = useState(todayISO);
  const [noteTitle,    setNoteTitle]    = useState('');
  const [noteText,     setNoteText]     = useState('');
  const [deleteState,  setDeleteState]  = useState<DeleteState>('idle');

  const licFileRef = useRef<HTMLInputElement>(null);
  const insFileRef = useRef<HTMLInputElement>(null);

  if (!vehicle) {
    return (
      <div className="content" style={{ paddingTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--purple-200)', marginBottom: 20 }}>הרכב לא נמצא</p>
        <button className="btn btn-secondary" onClick={() => navigate('/renewals')}>חזרה לרשימה</button>
      </div>
    );
  }

  const isArchived = Boolean(vehicle.archived);

  const handleArchive = () => {
    archiveVehicle(vehicle.id);
    navigate('/renewals');
  };

  const handleRestore = () => {
    restoreVehicle(vehicle.id);
    navigate('/renewals');
  };

  const handleConfirmedDelete = () => {
    // remember pre-delete archived state so we know where to land after
    const wasArchived = isArchived;
    deleteVehicle(vehicle.id);
    navigate(wasArchived ? '/archive' : '/renewals');
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const trimmedTitle = noteTitle.trim();
    addNote(vehicle.id, {
      date:        noteDate,
      description: noteText.trim(),
      type:        noteType,
      ...(noteType === 'treatment' && trimmedTitle ? { title: trimmedTitle } : {}),
    });
    setNoteTitle('');
    setNoteText('');
    setNoteDate(todayISO());
    setShowNoteForm(false);
  };

  const handleFileUpload = (docType: 'license' | 'insurance', file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('הקובץ גדול מדי. גודל מקסימלי: 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      addDocument(vehicle.id, {
        docType,
        fileName: file.name,
        fileData: e.target?.result as string,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const licenseDoc   = vehicle.documents.find(d => d.docType === 'license');
  const insuranceDoc = vehicle.documents.find(d => d.docType === 'insurance');
  const ls = getExpiryStatus(vehicle.licenseExpiryDate);
  const is = getExpiryStatus(vehicle.insuranceExpiryDate);

  const archivedDateLabel = vehicle.archivedAt
    ? formatDate(vehicle.archivedAt.slice(0, 10))
    : '—';

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          {/* RTL: → points toward start (right side) = "go back" */}
          <button
            className="back-btn"
            onClick={() => navigate(isArchived ? '/archive' : '/renewals')}
            aria-label="חזרה לרשימה"
          >
            →
          </button>
          <img src="/app-logo.png" alt="" className="topbar-logo" aria-hidden="true" />
          <span className="topbar-title">{vehicle.driverName}</span>
        </div>
        <div className="topbar-end">
          {/* edit hidden for archived — archived vehicles are read-only */}
          {!isArchived && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/vehicle/${vehicle.id}/edit`)}
            >
              ✏️ עריכה
            </button>
          )}
        </div>
      </div>

      <div className="content">
        {isArchived && (
          <div className="archived-banner" role="status">
            <span className="archived-banner-icon" aria-hidden="true">🗄️</span>
            <div className="archived-banner-body">
              <div className="archived-banner-title">רכב זה נמצא בארכיון</div>
              <div className="archived-banner-subtitle">תאריך ארכוב: {archivedDateLabel} · במצב קריאה בלבד</div>
            </div>
          </div>
        )}

        {/* ── Vehicle Info ── */}
        <div className="card">
          <div className="section-title">🚗 פרטי הרכב</div>

          <div className="detail-field">
            <div className="detail-label">נהג במשפחה</div>
            <div className="detail-value">{vehicle.driverName}</div>
          </div>

          <div className="detail-field">
            <div className="detail-label">סוג הרכב</div>
            <div className={`detail-value ${!vehicle.vehicleType ? 'empty' : ''}`}>
              {vehicle.vehicleType || 'לא צוין'}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-label">מספר לוחית רישוי</div>
            <div className={`detail-value ${!vehicle.licensePlate ? 'empty' : ''}`}>
              {vehicle.licensePlate || 'לא צוין'}
            </div>
          </div>
        </div>

        {/* ── Expiry Dates ── */}
        <div className="card">
          <div className="section-title">📅 תאריכי תפוגה</div>

          <div className="detail-field">
            <div className="detail-row">
              <div>
                <div className="detail-label">רישיון רכב</div>
                <div className={`detail-value ${!vehicle.licenseExpiryDate ? 'empty' : ''}`}>
                  {vehicle.licenseExpiryDate ? formatDate(vehicle.licenseExpiryDate) : 'לא צוין'}
                </div>
              </div>
              {/* status badge intentionally suppressed for archived — alerts
                  shouldn't draw attention to expiries that no longer matter */}
              {!isArchived && <StatusBadge status={ls} dateStr={vehicle.licenseExpiryDate} />}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-row">
              <div>
                <div className="detail-label">ביטוח</div>
                <div className={`detail-value ${!vehicle.insuranceExpiryDate ? 'empty' : ''}`}>
                  {vehicle.insuranceExpiryDate ? formatDate(vehicle.insuranceExpiryDate) : 'לא צוין'}
                </div>
              </div>
              {!isArchived && <StatusBadge status={is} dateStr={vehicle.insuranceExpiryDate} />}
            </div>
          </div>
        </div>

        {/* ── Documents ── */}
        <div className="card">
          <div className="section-title">📄 מסמכים</div>

          <DocSlot
            label="רישיון רכב"
            doc={licenseDoc}
            readOnly={isArchived}
            onUploadClick={() => licFileRef.current?.click()}
            onDelete={() => licenseDoc && deleteDocument(vehicle.id, licenseDoc.id)}
          />
          {!isArchived && (
            <input
              ref={licFileRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload('license', f);
                e.target.value = '';
              }}
            />
          )}

          <div className="divider" />

          <DocSlot
            label="מסמך ביטוח"
            doc={insuranceDoc}
            readOnly={isArchived}
            onUploadClick={() => insFileRef.current?.click()}
            onDelete={() => insuranceDoc && deleteDocument(vehicle.id, insuranceDoc.id)}
          />
          {!isArchived && (
            <input
              ref={insFileRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload('insurance', f);
                e.target.value = '';
              }}
            />
          )}
        </div>

        {/* ── Notes & Treatments ── */}
        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0 }}>📝 טיפולים ורשומות</div>
            {!isArchived && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowNoteForm(f => !f);
                  setNoteText('');
                  setNoteTitle('');
                }}
              >
                {showNoteForm ? 'ביטול' : '+ הוסף'}
              </button>
            )}
          </div>

          {showNoteForm && !isArchived && (
            <div className="add-note-box">
              <div className="note-type-toggle">
                <button
                  className={`note-type-btn ${noteType === 'treatment' ? 'active-treatment' : ''}`}
                  onClick={() => setNoteType('treatment')}
                >
                  🔧 טיפול
                </button>
                <button
                  className={`note-type-btn ${noteType === 'general' ? 'active-general' : ''}`}
                  onClick={() => setNoteType('general')}
                >
                  📝 הערה
                </button>
              </div>

              {noteType === 'treatment' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="noteTitle">כותרת הטיפול</label>
                  <input
                    id="noteTitle"
                    className="form-input"
                    type="text"
                    value={noteTitle}
                    onChange={e => setNoteTitle(e.target.value)}
                    placeholder="לדוגמה: טיפול 10,000 ק&quot;מ, החלפת בלמים..."
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">תאריך</label>
                <input
                  className="form-input"
                  type="date"
                  value={noteDate}
                  onChange={e => setNoteDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {noteType === 'treatment' ? 'תיאור ופרטים' : 'תיאור'}
                </label>
                <textarea
                  className="form-textarea"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder={noteType === 'treatment'
                    ? 'פרטים נוספים — היכן בוצע, חלקים שהוחלפו...'
                    : 'תאר את ההערה...'}
                  rows={3}
                  autoFocus
                />
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleAddNote}
                disabled={!noteText.trim()}
              >
                שמור רשומה
              </button>
            </div>
          )}

          {vehicle.notes.length === 0 && !showNoteForm && (
            <p style={{ color: 'var(--gray-400)', fontSize: '0.88rem', textAlign: 'center', padding: '14px 0' }}>
              {isArchived
                ? 'אין רשומות. ברכב זה לא נשמרו טיפולים או הערות לפני העברה לארכיון.'
                : 'אין רשומות עדיין. לחצו "+ הוסף" כדי להוסיף טיפול או הערה.'}
            </p>
          )}

          {vehicle.notes.length > 0 && (
            <div className="notes-stack">
              {vehicle.notes.map(note => (
                <NoteItem
                  key={note.id}
                  note={note}
                  readOnly={isArchived}
                  onDelete={() => deleteNote(vehicle.id, note.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Action area (depends on archived state + delete sub-state) ── */}
        {isArchived ? (
          deleteState === 'permanent' ? (
            <PermanentConfirmBox
              driverName={vehicle.driverName}
              onCancel={() => setDeleteState('idle')}
              onConfirm={handleConfirmedDelete}
            />
          ) : (
            <div className="action-row">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleRestore}
              >
                ↺ שחזר לרכבים פעילים
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={() => setDeleteState('permanent')}
              >
                🗑️ מחק לצמיתות
              </button>
            </div>
          )
        ) : deleteState === 'idle' ? (
          <button
            className="btn btn-danger btn-full"
            onClick={() => setDeleteState('choose')}
          >
            🗑️ מחק רכב
          </button>
        ) : deleteState === 'choose' ? (
          <div className="delete-confirm-box">
            <p className="delete-confirm-text">
              מה ברצונכם לעשות עם הרכב של <strong>{vehicle.driverName}</strong>?
            </p>
            <div className="choose-actions">
              <button
                className="btn btn-primary"
                onClick={handleArchive}
              >
                🗄️ העבר לארכיון
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setDeleteState('permanent')}
              >
                🗑️ מחק לצמיתות
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteState('idle')}
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <PermanentConfirmBox
            driverName={vehicle.driverName}
            onCancel={() => setDeleteState('idle')}
            onConfirm={handleConfirmedDelete}
          />
        )}
      </div>
    </>
  );
}

/* ── Sub-components ── */

function PermanentConfirmBox({
  driverName,
  onCancel,
  onConfirm,
}: {
  driverName: string;
  onCancel:  () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="delete-confirm-box">
      <p className="delete-confirm-text">
        האם אתם בטוחים? פעולה זו לא ניתנת לשחזור.<br />
        כל הנתונים של הרכב של <strong>{driverName}</strong> — רשומות, מסמכים והגדרות — יימחקו לצמיתות.
      </p>
      <div className="delete-confirm-actions">
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
          ביטול
        </button>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>
          מחק לצמיתות
        </button>
      </div>
    </div>
  );
}

function DocSlot({
  label,
  doc,
  readOnly,
  onUploadClick,
  onDelete,
}: {
  label: string;
  doc: VehicleDocument | undefined;
  readOnly: boolean;
  onUploadClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="detail-label" style={{ marginBottom: 8 }}>{label}</div>
      {doc ? (
        <div className="doc-preview">
          <span style={{ fontSize: '1.7rem', flexShrink: 0 }}>
            {doc.mimeType.startsWith('image/') ? '🖼️' : '📄'}
          </span>
          <div className="doc-preview-info">
            <div className="doc-preview-name">{doc.fileName}</div>
            {doc.mimeType.startsWith('image/') && (
              <img src={doc.fileData} alt={label} />
            )}
            {doc.mimeType === 'application/pdf' && (
              <a
                href={doc.fileData}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 6, display: 'inline-flex' }}
              >
                📂 פתח PDF
              </a>
            )}
          </div>
          {!readOnly && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onDelete}
              style={{ color: 'var(--red-500)', alignSelf: 'flex-start', flexShrink: 0 }}
              aria-label="מחק מסמך"
            >
              🗑️
            </button>
          )}
        </div>
      ) : readOnly ? (
        <div className="doc-empty-readonly">לא הועלה {label}</div>
      ) : (
        <div className="doc-upload-zone" onClick={onUploadClick} role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onUploadClick()}>
          <div className="doc-upload-icon">📎</div>
          <div className="doc-upload-text">לחץ לצילום או העלאת {label}</div>
        </div>
      )}
    </div>
  );
}

function NoteItem({
  note,
  readOnly,
  onDelete,
}: {
  note: Note;
  readOnly: boolean;
  onDelete: () => void;
}) {
  const title = note.title?.trim();
  return (
    <div className="note-item">
      <div className="note-meta">
        <span className="note-date">{formatDate(note.date)}</span>
        <span className={`note-type-tag ${note.type}`}>
          {note.type === 'treatment' ? '🔧 טיפול' : '📝 הערה'}
        </span>
      </div>
      {title && <div className="note-title">{title}</div>}
      {note.description && <div className="note-text">{note.description}</div>}
      {!readOnly && (
        <button
          className="note-del-btn"
          onClick={onDelete}
          aria-label="מחק רשומה"
          title="מחק"
        >
          ✕
        </button>
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChecklistStore } from '../store/ChecklistContext';

/** Truthy strings that should map to `completed: true` when parsing a status
 *  column. Matched case-insensitively, after trim. */
const TRUTHY_TOKENS = new Set([
  'true', '1', 'x', 'v', '✓', '✔', 'yes', 'y',
  'כן', 'בוצע', 'הושלם', 'סיום', 'מוכן',
]);

function coerceCompleted(cell: unknown): boolean {
  if (cell === true) return true;
  if (cell === false) return false;
  if (typeof cell === 'number') return cell !== 0;
  if (typeof cell !== 'string') return false;
  return TRUTHY_TOKENS.has(cell.trim().toLowerCase());
}

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'string') return cell;
  if (typeof cell === 'number' || typeof cell === 'boolean') return String(cell);
  return '';
}

/** First-row detection heuristic: treat as header if first cell is a non-numeric
 *  string under 40 chars (i.e. looks like a label, not data). User can override. */
function looksLikeHeader(row: unknown[]): boolean {
  const first = row[0];
  if (typeof first !== 'string') return false;
  const trimmed = first.trim();
  if (!trimmed || trimmed.length > 40) return false;
  return isNaN(Number(trimmed));
}

export default function ChecklistImportPage() {
  const navigate = useNavigate();
  const { addChecklistWithItems } = useChecklistStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows,        setRows]        = useState<unknown[][] | null>(null);
  const [name,        setName]        = useState('');
  const [hasHeader,   setHasHeader]   = useState(true);
  const [fileName,    setFileName]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);

  const handleFilePick = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('הקובץ גדול מדי. גודל מקסימלי: 5MB.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      // dynamic import keeps the ~700KB xlsx out of the main bundle
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) {
        setErrorMsg('הקובץ לא מכיל גיליונות.');
        setLoading(false);
        return;
      }
      const sheet = wb.Sheets[firstSheetName];
      const parsedRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        blankrows: false,
      });

      // strip rows where every cell is empty/whitespace
      const cleaned = parsedRows.filter(r =>
        r.some(c => cellToString(c).trim() !== ''),
      );

      if (cleaned.length === 0) {
        setErrorMsg('לא נמצאו נתונים בקובץ.');
        setLoading(false);
        return;
      }

      setRows(cleaned);
      setHasHeader(looksLikeHeader(cleaned[0]));
      // default checklist name = filename without extension
      const baseName = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
      setName(baseName);
      setFileName(file.name);
    } catch (err) {
      console.error(err);
      setErrorMsg('נכשל קריאת הקובץ. ודאו שזה קובץ Excel או CSV תקין.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRows(null);
    setName('');
    setFileName('');
    setErrorMsg(null);
  };

  const handleImport = () => {
    if (!rows) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('יש להזין שם לצ\'ק ליסט.');
      return;
    }

    const dataRows = hasHeader ? rows.slice(1) : rows;

    const items = dataRows
      .map(r => ({
        title:     cellToString(r[0]).trim(),
        notes:     cellToString(r[1]).trim() || undefined,
        completed: coerceCompleted(r[2]),
      }))
      .filter(it => it.title);

    if (items.length === 0) {
      setErrorMsg('אין פריטים תקפים לייבוא (העמודה הראשונה ריקה בכל השורות).');
      return;
    }

    const id = addChecklistWithItems({ name: trimmed }, items);
    navigate(`/checklists/${id}`);
  };

  // preview: first 10 rows
  const previewRows = rows ? rows.slice(0, 10) : [];
  const totalRows   = rows?.length ?? 0;
  const dataCount   = rows
    ? rows.slice(hasHeader ? 1 : 0).filter(r => cellToString(r[0]).trim()).length
    : 0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="חזרה">→</button>
          <span className="topbar-title">📥 ייבוא צ'ק ליסט</span>
        </div>
      </div>

      <div className="content">
        {!rows ? (
          <>
            <div className="card">
              <div className="section-title">📥 בחירת קובץ</div>
              <p className="import-help">
                העלו קובץ Excel או CSV. נמפה את התוכן באופן הבא:
              </p>
              <ul className="import-help-list">
                <li><strong>עמודה ראשונה</strong> — כותרת הפריט (חובה)</li>
                <li><strong>עמודה שנייה</strong> — הערות (אופציונלי)</li>
                <li><strong>עמודה שלישית</strong> — האם בוצע (אופציונלי — תאים כמו "כן", "✓", "1" יסומנו כהושלמו)</li>
              </ul>
              <p className="form-hint" style={{ marginTop: 10 }}>
                לפני השמירה תוכלו לראות תצוגה מקדימה ולבחור שם.
              </p>

              <button
                className="btn btn-primary btn-full"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                style={{ marginTop: 14 }}
              >
                {loading ? 'קורא קובץ...' : '📁 בחר קובץ'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFilePick(f);
                  e.target.value = '';
                }}
              />

              {errorMsg && (
                <div className="form-error" role="alert" style={{ marginTop: 12 }}>
                  {errorMsg}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="card">
              <div className="section-title">📋 פרטים</div>

              <div className="form-group">
                <label className="form-label" htmlFor="cl-import-name">
                  <span className="required-star">*</span>שם הצ'ק ליסט
                </label>
                <input
                  id="cl-import-name"
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="שם לצ'ק ליסט המיובא"
                />
                <div className="form-hint">מקור: {fileName}</div>
              </div>

              <label className="settings-row" style={{ marginTop: 4, marginBottom: 0 }}>
                <span className="settings-label" style={{ color: 'var(--gray-700)' }}>
                  <span className="settings-icon" aria-hidden="true">📌</span>
                  <span>השורה הראשונה היא כותרות</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasHeader}
                  className={`switch ${hasHeader ? 'on' : 'off'}`}
                  onClick={() => setHasHeader(h => !h)}
                >
                  <span className="switch-thumb" aria-hidden="true" />
                </button>
              </label>
            </div>

            <div className="card">
              <div className="row-between" style={{ marginBottom: 10 }}>
                <div className="section-title" style={{ margin: 0 }}>👁️ תצוגה מקדימה</div>
                <span className="topbar-subtitle">{dataCount} פריטים · {totalRows} שורות</span>
              </div>

              <div className="preview-table-wrap">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>כותרת</th>
                      <th>הערות</th>
                      <th>בוצע</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, idx) => {
                      const isHeaderRow = hasHeader && idx === 0;
                      return (
                        <tr key={idx} className={isHeaderRow ? 'preview-header-row' : ''}>
                          <td>{isHeaderRow ? '–' : (hasHeader ? idx : idx + 1)}</td>
                          <td>{cellToString(r[0]) || '—'}</td>
                          <td>{cellToString(r[1]) || '—'}</td>
                          <td>{cellToString(r[2]) || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {totalRows > previewRows.length && (
                  <p className="preview-truncated">
                    מוצגות {previewRows.length} שורות ראשונות מתוך {totalRows}.
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="form-error" role="alert" style={{ marginTop: 12 }}>
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleReset}>
                בחר קובץ אחר
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleImport}>
                ייבא {dataCount} פריטים
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

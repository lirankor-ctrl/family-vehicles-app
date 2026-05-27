import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { useChecklistStore } from '../store/ChecklistContext';
import { useNotifications } from '../store/NotificationContext';
import {
  generatePdfBlob,
  downloadBlob,
  emailPdf,
  reportFileName,
} from '../services/pdfExport';

type Busy = 'idle' | 'download' | 'email';

export default function ExportPage() {
  const navigate = useNavigate();
  const { vehicles, activeVehicles, archivedVehicles } = useVehicleStore();
  const { checklists } = useChecklistStore();
  const { activeAlerts } = useNotifications();

  const [busy, setBusy] = useState<Busy>('idle');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const treatmentCount = activeVehicles.reduce(
    (n, v) => n + v.notes.filter(note => note.type === 'treatment').length,
    0,
  );
  const isEmpty = vehicles.length === 0 && checklists.length === 0;

  const run = async (mode: Exclude<Busy, 'idle'>) => {
    if (busy !== 'idle') return;
    setError('');
    setDone('');
    setBusy(mode);
    try {
      const blob = await generatePdfBlob({ vehicles, checklists });
      const filename = reportFileName();
      if (mode === 'download') {
        downloadBlob(blob, filename);
        setDone('הקובץ ירד למכשיר ✅');
      } else {
        const res = await emailPdf(blob, filename);
        if (res === 'shared') setDone('הקובץ נשלח ✅');
        else if (res === 'cancelled') setDone('');
        else setDone('הקובץ ירד — צרפו אותו להודעת המייל שנפתחה ✉️');
      }
    } catch {
      setError('אירעה שגיאה בהפקת ה‑PDF. נסו שוב.');
    } finally {
      setBusy('idle');
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          <button className="back-btn" onClick={() => navigate('/')} aria-label="חזרה למסך פתיחה">→</button>
          <img src="/app-logo.png" alt="" className="topbar-logo" aria-hidden="true" />
          <span className="topbar-title">📄 גיבוי וייצוא</span>
        </div>
      </div>

      <div className="content">
        <div className="card">
          <div className="section-title">📄 ייצוא לקובץ PDF</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            הפיקו מסמך PDF מעוצב הכולל את כל הנתונים שהזנתם — רכבים, תאריכי חידוש,
            טיפולים, מנויים, מסמכים, צ'ק ליסטים והתראות. המסמך מותאם להדפסה ולשמירה.
          </p>

          <div className="export-stats">
            <ExportStat n={activeVehicles.length} label="רכבים פעילים" />
            <ExportStat n={activeAlerts.length}   label="התראות" />
            <ExportStat n={treatmentCount}        label="טיפולים" />
            <ExportStat n={checklists.length}     label="צ'ק ליסטים" />
            <ExportStat n={archivedVehicles.length} label="בארכיון" />
          </div>
        </div>

        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>אין עדיין נתונים לייצוא</h2>
            <p>הוסיפו רכבים או צ'ק ליסטים כדי שתוכלו להפיק קובץ גיבוי.</p>
          </div>
        ) : (
          <>
            <button
              className="btn btn-primary btn-full"
              style={{ marginBottom: 12 }}
              onClick={() => run('download')}
              disabled={busy !== 'idle'}
            >
              {busy === 'download' ? '⏳ מפיק PDF…' : '⬇️ הורד PDF'}
            </button>

            <button
              className="btn btn-secondary btn-full"
              onClick={() => run('email')}
              disabled={busy !== 'idle'}
            >
              {busy === 'email' ? '⏳ מכין…' : '✉️ שלח במייל'}
            </button>

            <p className="export-hint">
              במכשירים ניידים ניתן לצרף את הקובץ ישירות למייל או לוואטסאפ. במחשב הקובץ
              יורד ותיפתח הודעת מייל ריקה — צרפו אליה את הקובץ שהורד.
            </p>
          </>
        )}

        {done && <div className="export-msg ok" role="status">{done}</div>}
        {error && <div className="export-msg err" role="alert">{error}</div>}
      </div>
    </>
  );
}

function ExportStat({ n, label }: { n: number; label: string }) {
  return (
    <div className="export-stat">
      <div className="export-stat-num">{n}</div>
      <div className="export-stat-label">{label}</div>
    </div>
  );
}

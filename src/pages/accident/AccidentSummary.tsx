import { useState } from 'react';
import { AccidentCase } from '../../types';
import { generateAccidentPdfBlob, accidentReportFileName } from '../../services/accidentPdfExport';
import { downloadBlob, emailPdf } from '../../services/pdfExport';
import { formatDate } from '../../utils/dateUtils';

const STEP_LABELS = [
  'בטיחות', 'בחירת רכב', 'פרטי האירוע', 'תיאור קולי', 'תיעוד הזירה',
  'הרכב השני', 'עדים', 'משטרה / גרר', 'לפני שעוזבים',
];

type Busy = 'idle' | 'download' | 'email';

export default function AccidentSummary({
  kase,
  onEditStep,
  onDelete,
  onClose,
}: {
  kase: AccidentCase;
  onEditStep: (step: number) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<Busy>('idle');
  const [msg, setMsg] = useState('');

  const run = async (mode: Exclude<Busy, 'idle'>) => {
    if (busy !== 'idle') return;
    setBusy(mode);
    setMsg('');
    try {
      const blob = await generateAccidentPdfBlob(kase);
      const filename = accidentReportFileName(kase);
      if (mode === 'download') {
        downloadBlob(blob, filename);
        setMsg('הקובץ ירד למכשיר ✅');
      } else {
        const res = await emailPdf(blob, filename, {
          title: 'קצין רכב — דוח תאונה',
          text: 'מצורף דוח תאונה מאפליקציית קצין רכב.',
          mailtoNote: 'מצורף דוח תאונה מאפליקציית קצין רכב.',
        });
        if (res === 'shared') setMsg('הדוח נשלח ✅');
        else if (res === 'cancelled') setMsg('');
        else setMsg('הקובץ ירד — צרפו אותו להודעת המייל שנפתחה ✉️');
      }
    } catch {
      setMsg('אירעה שגיאה בהפקת הדוח. נסו שוב.');
    } finally {
      setBusy('idle');
    }
  };

  return (
    <>
      <div className="accident-header">
        <button className="back-btn" onClick={onClose} aria-label="חזרה לתיקי תאונות">→</button>
        <div className="accident-header-body">
          <div className="accident-step-label">תיק תאונה</div>
        </div>
      </div>

      <div className="content">
        <div className="card">
          <div className="detail-value">
            {kase.accidentDate ? formatDate(kase.accidentDate) : '—'}
            {kase.accidentTime ? ` · ${kase.accidentTime}` : ''}
          </div>
          <div className="detail-label" style={{ marginTop: 4 }}>
            {kase.vehicleSnapshot?.driverName ?? 'ללא רכב משויך'}
            {kase.vehicleSnapshot?.licensePlate ? ` · ${kase.vehicleSnapshot.licensePlate}` : ''}
          </div>
          {kase.locationText && (
            <div className="detail-field">
              <div className="detail-label">מיקום</div>
              <div className="detail-value">{kase.locationText}</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title">עריכת פרטים</div>
          <div className="accident-summary-steps">
            {STEP_LABELS.map((label, i) => (
              <button key={label} className="accident-summary-step-btn" onClick={() => onEditStep(i)}>
                <span>{label}</span>
                <span aria-hidden="true">‹</span>
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={() => run('download')} disabled={busy !== 'idle'}>
          {busy === 'download' ? '⏳ מפיק דוח…' : '📄 צור דוח תאונה'}
        </button>
        <button className="btn btn-secondary btn-full" style={{ marginTop: 12 }} onClick={() => run('email')} disabled={busy !== 'idle'}>
          {busy === 'email' ? '⏳ מכין…' : '✉️ שלח במייל'}
        </button>
        {msg && <p className="export-msg ok">{msg}</p>}

        <button className="btn btn-danger btn-full" style={{ marginTop: 20 }} onClick={onDelete}>
          🗑️ מחק תיק תאונה
        </button>
      </div>
    </>
  );
}

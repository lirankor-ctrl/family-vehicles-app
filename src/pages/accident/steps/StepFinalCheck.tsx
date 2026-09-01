import { useState } from 'react';
import { useAccidentStore } from '../../../store/AccidentContext';
import { AccidentCase, AccidentFinalChecklist } from '../../../types';
import { generateAccidentPdfBlob, accidentReportFileName } from '../../../services/accidentPdfExport';
import { downloadBlob, emailPdf } from '../../../services/pdfExport';

const ITEMS: Array<{ key: keyof AccidentFinalChecklist; label: string }> = [
  { key: 'scenePhotographed', label: 'צילמתי את זירת התאונה' },
  { key: 'ownCarDamagePhotographed', label: 'צילמתי את הנזק לרכב שלי' },
  { key: 'otherCarPhotographed', label: 'צילמתי את הרכב השני' },
  { key: 'otherCarPlatePhotographed', label: 'צילמתי את מספר הרכב השני' },
  { key: 'otherDriverDetailsCollected', label: 'קיבלתי את פרטי הנהג השני' },
  { key: 'documentsPhotographed', label: 'צילמתי מסמכים רלוונטיים' },
  { key: 'witnessDetailsCollected', label: 'לקחתי פרטי עדים, אם היו' },
  { key: 'locationTimeDocumented', label: 'תיעדתי את מקום ושעת התאונה' },
  { key: 'policeTowDocumented', label: 'תיעדתי פרטי משטרה / גרר, אם היו' },
];

type Busy = 'idle' | 'download' | 'email';

export default function StepFinalCheck({ kase, onNext }: { kase: AccidentCase; onNext: () => void }) {
  const { toggleFinalChecklistItem } = useAccidentStore();
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
    <div className="accident-step">
      <h1 className="accident-step-title">לפני שעוזבים את המקום</h1>
      <p className="accident-step-question">רשימת תזכורת — לא חובה לסמן הכל.</p>

      <div className="item-stack">
        {ITEMS.map(it => (
          <label key={it.key} className="item-row">
            <span className="item-check">
              <input
                type="checkbox"
                checked={!!kase.finalChecklist?.[it.key]}
                onChange={() => toggleFinalChecklistItem(kase.id, it.key)}
              />
              <span className="item-check-box">✓</span>
            </span>
            <span className="item-body"><span className="item-title">{it.label}</span></span>
          </label>
        ))}
      </div>

      <div className="accident-report-actions">
        <button className="btn btn-primary btn-full" onClick={() => run('download')} disabled={busy !== 'idle'}>
          {busy === 'download' ? '⏳ מפיק דוח…' : '📄 צור דוח תאונה'}
        </button>
        <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }} onClick={() => run('email')} disabled={busy !== 'idle'}>
          {busy === 'email' ? '⏳ מכין…' : '✉️ שלח במייל'}
        </button>
        {msg && <p className="export-msg ok">{msg}</p>}
      </div>

      <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={onNext}>
        סיום — צפייה בתיק
      </button>
    </div>
  );
}

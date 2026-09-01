import { useEffect } from 'react';
import { useAccidentStore } from '../../../store/AccidentContext';
import { AccidentCase } from '../../../types';
import { todayISO } from '../../../utils/dateUtils';

export default function StepBasics({ kase, onNext }: { kase: AccidentCase; onNext: () => void }) {
  const { updateCaseFields } = useAccidentStore();

  useEffect(() => {
    if (!kase.accidentDate) {
      const now = new Date();
      updateCaseFields(kase.id, {
        accidentDate: todayISO(),
        accidentTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      });
    }
    // seed-once on first mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<AccidentCase>) => updateCaseFields(kase.id, patch);

  return (
    <div className="accident-step">
      <h1 className="accident-step-title">פרטי האירוע</h1>

      <div className="form-group">
        <label className="form-label">תאריך</label>
        <input
          type="date"
          className="form-input"
          value={kase.accidentDate ?? ''}
          onChange={e => set({ accidentDate: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">שעה</label>
        <input
          type="time"
          className="form-input"
          value={kase.accidentTime ?? ''}
          onChange={e => set({ accidentTime: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">מיקום</label>
        <input
          type="text"
          className="form-input"
          placeholder="כתובת / צומת / כביש"
          value={kase.locationText ?? ''}
          onChange={e => set({ locationText: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">מה קרה — תיאור קצר</label>
        <textarea
          className="form-textarea"
          value={kase.description ?? ''}
          onChange={e => set({ description: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">כיוון נסיעה (לא חובה)</label>
        <input
          type="text"
          className="form-input"
          value={kase.directionOfTravel ?? ''}
          onChange={e => set({ directionOfTravel: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">תנאי כביש / מזג אוויר (לא חובה)</label>
        <input
          type="text"
          className="form-input"
          value={kase.roadConditions ?? ''}
          onChange={e => set({ roadConditions: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">הערות נוספות (לא חובה)</label>
        <textarea className="form-textarea" value={kase.notes ?? ''} onChange={e => set({ notes: e.target.value })} />
      </div>

      <button className="btn btn-primary btn-full" onClick={onNext}>המשך</button>
    </div>
  );
}

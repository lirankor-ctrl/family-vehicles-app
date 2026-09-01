import { useAccidentStore } from '../../../store/AccidentContext';
import { AccidentCase, AccidentWitness } from '../../../types';

export default function StepWitnesses({ kase, onNext }: { kase: AccidentCase; onNext: () => void }) {
  const { addWitness, updateWitness, removeWitness } = useAccidentStore();

  return (
    <div className="accident-step">
      <h1 className="accident-step-title">האם יש עדים לתאונה?</h1>
      <p className="accident-step-question">לא חובה. אפשר להוסיף כמה עדים שרוצים.</p>

      {kase.witnesses.map((w, i) => (
        <WitnessCard
          key={w.id}
          index={i}
          witness={w}
          onChange={patch => updateWitness(kase.id, w.id, patch)}
          onRemove={() => removeWitness(kase.id, w.id)}
        />
      ))}

      <button className="btn btn-secondary btn-full" onClick={() => addWitness(kase.id)}>➕ הוסף עד נוסף</button>
      <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={onNext}>המשך</button>
    </div>
  );
}

function WitnessCard({
  index,
  witness,
  onChange,
  onRemove,
}: {
  index: number;
  witness: AccidentWitness;
  onChange: (patch: Partial<Omit<AccidentWitness, 'id'>>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="accident-witness-card">
      <div className="row-between">
        <span className="section-title">עד/ה #{index + 1}</span>
        <button className="btn-ghost" onClick={onRemove} aria-label="הסר">🗑️</button>
      </div>
      <div className="form-group">
        <label className="form-label">שם</label>
        <input type="text" className="form-input" value={witness.name ?? ''} onChange={e => onChange({ name: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">טלפון</label>
        <input type="tel" className="form-input" value={witness.phone ?? ''} onChange={e => onChange({ phone: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">הערה</label>
        <input type="text" className="form-input" value={witness.note ?? ''} onChange={e => onChange({ note: e.target.value })} />
      </div>
    </div>
  );
}

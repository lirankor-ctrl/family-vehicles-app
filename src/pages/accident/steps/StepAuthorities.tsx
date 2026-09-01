import { useAccidentStore } from '../../../store/AccidentContext';
import { AccidentCase } from '../../../types';

export default function StepAuthorities({ kase, onNext }: { kase: AccidentCase; onNext: () => void }) {
  const { updatePoliceInfo, updateAmbulanceInfo, updateTowingInfo } = useAccidentStore();
  const police = kase.policeInfo ?? {};
  const ambulance = kase.ambulanceInfo ?? {};
  const towing = kase.towingInfo ?? {};

  return (
    <div className="accident-step">
      <h1 className="accident-step-title">משטרה / אמבולנס / גרר</h1>
      <p className="accident-step-question">לא חובה למלא — רק אם רלוונטי.</p>

      <div className="card">
        <div className="section-title">🚓 משטרה</div>
        <ToggleRow label="הגיעה משטרה לזירה?" value={!!police.arrived} onChange={v => updatePoliceInfo(kase.id, { arrived: v })} />
        {police.arrived && (
          <div className="form-group">
            <label className="form-label">מספר דו״ח / אירוע</label>
            <input
              type="text"
              className="form-input"
              value={police.reportNumber ?? ''}
              onChange={e => updatePoliceInfo(kase.id, { reportNumber: e.target.value })}
            />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">הערות</label>
          <input type="text" className="form-input" value={police.notes ?? ''} onChange={e => updatePoliceInfo(kase.id, { notes: e.target.value })} />
        </div>
      </div>

      <div className="card">
        <div className="section-title">🚑 אמבולנס</div>
        <ToggleRow label="הגיע אמבולנס לזירה?" value={!!ambulance.arrived} onChange={v => updateAmbulanceInfo(kase.id, { arrived: v })} />
        <div className="form-group">
          <label className="form-label">הערות</label>
          <input
            type="text"
            className="form-input"
            value={ambulance.notes ?? ''}
            onChange={e => updateAmbulanceInfo(kase.id, { notes: e.target.value })}
          />
        </div>
      </div>

      <div className="card">
        <div className="section-title">🚛 גרר</div>
        <ToggleRow label="הוזמן גרר?" value={!!towing.ordered} onChange={v => updateTowingInfo(kase.id, { ordered: v })} />
        {towing.ordered && (
          <>
            <div className="form-group">
              <label className="form-label">חברת גרירה</label>
              <input
                type="text"
                className="form-input"
                value={towing.company ?? ''}
                onChange={e => updateTowingInfo(kase.id, { company: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">טלפון</label>
              <input
                type="tel"
                className="form-input"
                value={towing.phone ?? ''}
                onChange={e => updateTowingInfo(kase.id, { phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">לאן נלקח הרכב</label>
              <input
                type="text"
                className="form-input"
                value={towing.takenTo ?? ''}
                onChange={e => updateTowingInfo(kase.id, { takenTo: e.target.value })}
              />
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">הערות</label>
          <input type="text" className="form-input" value={towing.notes ?? ''} onChange={e => updateTowingInfo(kase.id, { notes: e.target.value })} />
        </div>
      </div>

      <button className="btn btn-primary btn-full" onClick={onNext}>המשך</button>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <button type="button" className={`switch ${value ? 'on' : 'off'}`} onClick={() => onChange(!value)} aria-pressed={value}>
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

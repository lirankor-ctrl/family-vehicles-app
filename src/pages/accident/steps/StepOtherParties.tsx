import { useRef } from 'react';
import { useAccidentStore } from '../../../store/AccidentContext';
import { AccidentCase, AccidentOtherParty } from '../../../types';
import { putMedia } from '../../../services/accidentMediaDb';
import MediaThumb from '../../../components/MediaThumb';

const MAX_DOC_BYTES = 5 * 1024 * 1024;

export default function StepOtherParties({ kase, onNext }: { kase: AccidentCase; onNext: () => void }) {
  const { addOtherParty, updateOtherParty, removeOtherParty, addOtherPartyDocument, removeOtherPartyDocument } =
    useAccidentStore();

  return (
    <div className="accident-step">
      <h1 className="accident-step-title">פרטי הרכב/הנהג השני</h1>
      <p className="accident-step-question">כל השדות אופציונליים. אין צורך לקבוע אשמה — רק לתעד עובדות.</p>

      {kase.otherParties.map((party, i) => (
        <OtherPartyCard
          key={party.id}
          index={i}
          party={party}
          onChange={patch => updateOtherParty(kase.id, party.id, patch)}
          onRemove={() => removeOtherParty(kase.id, party.id)}
          onAddDoc={async file => {
            if (file.size > MAX_DOC_BYTES) { alert('הקובץ גדול מדי. גודל מקסימלי: 5MB'); return; }
            const id = crypto.randomUUID();
            const createdAt = new Date().toISOString();
            try {
              await putMedia({ id, caseId: kase.id, kind: 'document', mimeType: file.type, fileName: file.name, blob: file, createdAt });
              addOtherPartyDocument(kase.id, party.id, { id, kind: 'document', mimeType: file.type, fileName: file.name, createdAt });
            } catch {
              alert('שמירת הקובץ נכשלה.');
            }
          }}
          onRemoveDoc={mediaId => removeOtherPartyDocument(kase.id, party.id, mediaId)}
        />
      ))}

      <button className="btn btn-secondary btn-full" onClick={() => addOtherParty(kase.id)}>➕ הוסף רכב / נהג נוסף</button>
      <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={onNext}>המשך</button>
    </div>
  );
}

function OtherPartyCard({
  index,
  party,
  onChange,
  onRemove,
  onAddDoc,
  onRemoveDoc,
}: {
  index: number;
  party: AccidentOtherParty;
  onChange: (patch: Partial<Omit<AccidentOtherParty, 'id' | 'documents'>>) => void;
  onRemove: () => void;
  onAddDoc: (file: File) => void;
  onRemoveDoc: (mediaId: string) => void;
}) {
  const docInput = useRef<HTMLInputElement>(null);

  return (
    <div className="accident-party-card">
      <div className="row-between">
        <span className="section-title">רכב/נהג נוסף #{index + 1}</span>
        <button className="btn-ghost" onClick={onRemove} aria-label="הסר">🗑️</button>
      </div>

      <div className="form-group">
        <label className="form-label">שם הנהג/ת</label>
        <input type="text" className="form-input" value={party.driverName ?? ''} onChange={e => onChange({ driverName: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">טלפון</label>
        <input type="tel" className="form-input" value={party.phone ?? ''} onChange={e => onChange({ phone: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">תעודת זהות</label>
        <input type="text" className="form-input" value={party.idNumber ?? ''} onChange={e => onChange({ idNumber: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">לוחית רישוי</label>
        <input
          type="text"
          className="form-input"
          value={party.licensePlate ?? ''}
          onChange={e => onChange({ licensePlate: e.target.value.replace(/\D/g, '') })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">סוג/דגם רכב</label>
        <input type="text" className="form-input" value={party.vehicleModel ?? ''} onChange={e => onChange({ vehicleModel: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">חברת ביטוח</label>
        <input type="text" className="form-input" value={party.insuranceCompany ?? ''} onChange={e => onChange({ insuranceCompany: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">מספר פוליסה</label>
        <input type="text" className="form-input" value={party.policyNumber ?? ''} onChange={e => onChange({ policyNumber: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">הערות</label>
        <textarea className="form-textarea" value={party.notes ?? ''} onChange={e => onChange({ notes: e.target.value })} />
      </div>

      {party.documents.length > 0 && (
        <div className="accident-media-strip">
          {party.documents.map(d => (
            <div key={d.id} className="accident-media-strip-item">
              <MediaThumb media={d} className="accident-media-thumb" />
              <button className="accident-media-remove" onClick={() => onRemoveDoc(d.id)} aria-label="הסר">✕</button>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-secondary btn-sm" onClick={() => docInput.current?.click()}>
        📎 צלם/העלה מסמך (רישיון / ביטוח)
      </button>
      <input
        ref={docInput}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) onAddDoc(f); e.target.value = ''; }}
      />
    </div>
  );
}

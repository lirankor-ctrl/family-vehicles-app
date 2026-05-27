import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVehicleStore } from '../store/VehicleContext';
import { resizeImageToDataUrl } from '../utils/image';

interface FormState {
  driverName:          string;
  vehicleType:         string;
  licensePlate:        string;
  licenseExpiryDate:   string;
  insuranceExpiryDate: string;
  photo:               string;   // base64 data URL, '' when none
}

interface FormErrors {
  driverName?:   string;
  licensePlate?: string;
}

export default function VehicleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addVehicle, updateVehicle, getVehicle } = useVehicleStore();

  const existing = id ? getVehicle(id) : undefined;
  const isEdit   = Boolean(existing);

  const [form, setForm] = useState<FormState>({
    driverName:          existing?.driverName          ?? '',
    vehicleType:         existing?.vehicleType         ?? '',
    licensePlate:        existing?.licensePlate         ?? '',
    licenseExpiryDate:   existing?.licenseExpiryDate   ?? '',
    insuranceExpiryDate: existing?.insuranceExpiryDate ?? '',
    photo:               existing?.photo               ?? '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [photoError, setPhotoError] = useState<string>('');
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);

  const handlePhotoPick = async (file: File) => {
    setPhotoError('');
    if (!file.type.startsWith('image/')) {
      setPhotoError('יש לבחור קובץ תמונה');
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setForm(f => ({ ...f, photo: dataUrl }));
    } catch {
      setPhotoError('לא ניתן לטעון את התמונה. נסו תמונה אחרת.');
    }
  };

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
    // always clear the field's error on next keystroke
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.driverName.trim()) {
      e.driverName = 'שם הנהג הוא שדה חובה';
    }
    // licensePlate is digits-only after stripping on input, so this is a safety net
    if (form.licensePlate && !/^\d+$/.test(form.licensePlate)) {
      e.licensePlate = 'מספר לוחית רישוי חייב להכיל ספרות בלבד';
    }
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const data = {
      driverName:          form.driverName.trim(),
      vehicleType:         form.vehicleType.trim()  || undefined,
      licensePlate:        form.licensePlate.trim() || undefined,
      licenseExpiryDate:   form.licenseExpiryDate   || undefined,
      insuranceExpiryDate: form.insuranceExpiryDate || undefined,
      photo:               form.photo               || undefined,
    };

    if (isEdit && existing) {
      updateVehicle(existing.id, data);
      navigate(`/vehicle/${existing.id}`);
    } else {
      const newId = addVehicle(data);
      navigate(`/vehicle/${newId}`);
    }
  };

  // allow Enter to submit from any field
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          {/* RTL: back arrow points → (toward start/right side) */}
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="חזרה">→</button>
          <span className="topbar-title">{isEdit ? 'עריכת רכב' : 'הוספת רכב'}</span>
        </div>
      </div>

      <div className="content">
        <div className="form-section">
          <div className="section-title">🚗 פרטי הרכב</div>

          <div className="form-group">
            <label className="form-label" htmlFor="driverName">
              <span className="required-star">*</span>שם הנהג במשפחה
            </label>
            <input
              id="driverName"
              className={`form-input ${errors.driverName ? 'has-error' : ''}`}
              type="text"
              autoFocus={!isEdit}
              value={form.driverName}
              onChange={e => setField('driverName', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="לדוגמה: אבא, אמא, יעל..."
            />
            {errors.driverName && <div className="form-error" role="alert">{errors.driverName}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="vehicleType">סוג הרכב</label>
            <input
              id="vehicleType"
              className="form-input"
              type="text"
              value={form.vehicleType}
              onChange={e => setField('vehicleType', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="לדוגמה: טויוטה קורולה, מאזדה 3..."
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="licensePlate">מספר לוחית רישוי</label>
            <input
              id="licensePlate"
              className={`form-input ${errors.licensePlate ? 'has-error' : ''}`}
              type="text"
              inputMode="numeric"
              value={form.licensePlate}
              onChange={e => setField('licensePlate', e.target.value.replace(/\D/g, ''))}
              onKeyDown={onKeyDown}
              placeholder="לדוגמה: 1234567"
            />
            {errors.licensePlate
              ? <div className="form-error" role="alert">{errors.licensePlate}</div>
              : <div className="form-hint">ספרות בלבד</div>
            }
          </div>
        </div>

        <div className="form-section">
          <div className="section-title">📷 צילום רכב</div>

          {form.photo ? (
            <div className="photo-edit-preview">
              <img src={form.photo} alt="תצוגה מקדימה של צילום הרכב" />
              <div className="photo-edit-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => galleryRef.current?.click()}
                >
                  🔄 החלף תמונה
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setForm(f => ({ ...f, photo: '' }))}
                >
                  🗑️ הסר
                </button>
              </div>
            </div>
          ) : (
            <div className="photo-pick-row">
              <button
                type="button"
                className="photo-pick-btn"
                onClick={() => galleryRef.current?.click()}
              >
                <span className="photo-pick-icon" aria-hidden="true">🖼️</span>
                <span>בחר מהגלריה</span>
              </button>
              <button
                type="button"
                className="photo-pick-btn"
                onClick={() => cameraRef.current?.click()}
              >
                <span className="photo-pick-icon" aria-hidden="true">📸</span>
                <span>צלם עכשיו</span>
              </button>
            </div>
          )}
          {photoError && <div className="form-error" role="alert">{photoError}</div>}

          {/* gallery picker */}
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handlePhotoPick(f);
              e.target.value = '';
            }}
          />
          {/* camera capture (mobile) */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handlePhotoPick(f);
              e.target.value = '';
            }}
          />
        </div>

        <div className="form-section">
          <div className="section-title">📅 תאריכי תפוגה</div>

          <div className="form-group">
            <label className="form-label" htmlFor="licenseExpiry">תאריך פקיעת רישיון רכב</label>
            <input
              id="licenseExpiry"
              className="form-input"
              type="date"
              value={form.licenseExpiryDate}
              onChange={e => setField('licenseExpiryDate', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="insuranceExpiry">תאריך פקיעת ביטוח</label>
            <input
              id="insuranceExpiry"
              className="form-input"
              type="date"
              value={form.insuranceExpiryDate}
              onChange={e => setField('insuranceExpiryDate', e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(-1)}>
            ביטול
          </button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit}>
            {isEdit ? 'שמור שינויים' : 'הוסף רכב'}
          </button>
        </div>
      </div>
    </>
  );
}

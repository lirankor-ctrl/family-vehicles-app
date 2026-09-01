import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccidentStore } from '../../store/AccidentContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import AccidentSummary from './AccidentSummary';
import StepSafety from './steps/StepSafety';
import StepVehicle from './steps/StepVehicle';
import StepBasics from './steps/StepBasics';
import StepVoice from './steps/StepVoice';
import StepScene from './steps/StepScene';
import StepOtherParties from './steps/StepOtherParties';
import StepWitnesses from './steps/StepWitnesses';
import StepAuthorities from './steps/StepAuthorities';
import StepFinalCheck from './steps/StepFinalCheck';

const STEP_TITLES = [
  'בטיחות', 'בחירת רכב', 'פרטי האירוע', 'תיאור קולי', 'תיעוד הזירה',
  'הרכב השני', 'עדים', 'משטרה / גרר', 'לפני שעוזבים',
];

const STEP_COMPONENTS = [
  StepSafety, StepVehicle, StepBasics, StepVoice, StepScene,
  StepOtherParties, StepWitnesses, StepAuthorities, StepFinalCheck,
];

export default function AccidentWizardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCase, deleteCase, setStep, markWizardCompleted } = useAccidentStore();
  const kase = id ? getCase(id) : undefined;

  const [editing, setEditing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // flash the "נשמר" indicator whenever the case's stored data actually changes
  useEffect(() => {
    if (!kase) return;
    setSavedFlash(true);
    const t = setTimeout(() => setSavedFlash(false), 1200);
    return () => clearTimeout(t);
  }, [kase?.updatedAt]);

  if (!id) return null;

  if (!kase) {
    return (
      <div className="accident-shell">
        <div className="accident-notfound">
          <div className="empty-icon">🚫</div>
          <h2>לא נמצא תיק תאונה</h2>
          <button className="btn btn-primary" onClick={() => navigate('/accidents')}>חזרה לתיקי תאונות</button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    setConfirmDelete(false);
    await deleteCase(kase.id);
    navigate('/accidents');
  };

  const goToStep = (step: number) => {
    setEditing(true);
    setStep(kase.id, step);
  };

  const exitWizard = () => {
    if (kase.currentStep === 0) { navigate('/accidents'); return; }
    setStep(kase.id, kase.currentStep - 1);
  };

  const goNext = () => {
    if (kase.currentStep >= STEP_COMPONENTS.length - 1) {
      markWizardCompleted(kase.id);
      setEditing(false);
      return;
    }
    setStep(kase.id, kase.currentStep + 1);
  };

  const showSummary = kase.wizardCompleted && !editing;

  if (showSummary) {
    return (
      <div className="accident-shell">
        <AccidentSummary
          kase={kase}
          onEditStep={goToStep}
          onDelete={() => setConfirmDelete(true)}
          onClose={() => navigate('/accidents')}
        />
        <ConfirmDialog
          open={confirmDelete}
          title="מחיקת תיק תאונה"
          message={
            'האם אתה בטוח שברצונך למחוק את תיק התאונה?\n' +
            'כל התמונות, הסרטונים, ההקלטות, המסמכים והמידע שבתיק יימחקו ולא ניתן יהיה לשחזר אותם.'
          }
          confirmLabel="מחק לצמיתות"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      </div>
    );
  }

  const stepIndex = Math.min(kase.currentStep, STEP_COMPONENTS.length - 1);
  const StepComponent = STEP_COMPONENTS[stepIndex];
  const progressPct = Math.round(((stepIndex + 1) / STEP_COMPONENTS.length) * 100);

  return (
    <div className="accident-shell">
      <div className="accident-header">
        <button
          className="back-btn"
          onClick={editing ? () => setEditing(false) : exitWizard}
          aria-label="חזרה"
        >
          →
        </button>
        <div className="accident-header-body">
          <div className="accident-step-label">
            שלב {stepIndex + 1} מתוך {STEP_COMPONENTS.length} · {STEP_TITLES[stepIndex]}
          </div>
          <div className="accident-progress-bar">
            <div className="accident-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <span className={`accident-save-indicator ${savedFlash ? 'visible' : ''}`} aria-live="polite">✓ נשמר</span>
      </div>

      <div className="accident-step-body">
        <StepComponent kase={kase} onNext={goNext} />
      </div>
    </div>
  );
}

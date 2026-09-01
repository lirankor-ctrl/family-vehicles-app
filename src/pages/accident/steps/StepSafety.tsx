import { useAccidentStore } from '../../../store/AccidentContext';
import { AccidentCase, InjuryAnswer } from '../../../types';

export default function StepSafety({ kase, onNext }: { kase: AccidentCase; onNext: () => void }) {
  const { updateCaseFields } = useAccidentStore();
  const answer = kase.injuryAnswer;

  const choose = (a: InjuryAnswer) => {
    updateCaseFields(kase.id, { injuryAnswer: a });
    if (a === 'no') onNext();
  };

  return (
    <div className="accident-step">
      <h1 className="accident-step-title">קודם כל בודקים שכולם בסדר</h1>
      <p className="accident-step-question">האם יש נפגעים או חשש לפגיעה?</p>

      <div className="accident-answer-row">
        <button className={`accident-answer-btn ${answer === 'yes' ? 'selected' : ''}`} onClick={() => choose('yes')}>
          כן
        </button>
        <button className={`accident-answer-btn ${answer === 'no' ? 'selected' : ''}`} onClick={() => choose('no')}>
          לא
        </button>
        <button className={`accident-answer-btn ${answer === 'unsure' ? 'selected' : ''}`} onClick={() => choose('unsure')}>
          לא בטוח
        </button>
      </div>

      {(answer === 'yes' || answer === 'unsure') && (
        <div className="accident-emergency-block">
          <p className="accident-emergency-hint">
            קודם כל הביטחון והבטיחות שלך ושל האחרים המעורבים — אם יש צורך, התקשרו עכשיו:
          </p>
          <div className="accident-emergency-row">
            <a className="accident-emergency-btn" href="tel:101">🚑 מד״א 101</a>
            <a className="accident-emergency-btn police" href="tel:100">🚓 משטרה 100</a>
          </div>
          <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={onNext}>
            המשך לתיעוד התאונה
          </button>
        </div>
      )}
    </div>
  );
}

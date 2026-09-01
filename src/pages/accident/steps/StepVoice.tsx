import { useEffect, useRef, useState } from 'react';
import { useAccidentStore } from '../../../store/AccidentContext';
import { AccidentCase } from '../../../types';
import { putMedia } from '../../../services/accidentMediaDb';
import MediaThumb from '../../../components/MediaThumb';

const SUPPORTED =
  typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

export default function StepVoice({ kase, onNext }: { kase: AccidentCase; onNext: () => void }) {
  const { addVoiceRecording, deleteVoiceRecording } = useAccidentStore();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const fileName = 'הקלטה קולית.webm';
        try {
          await putMedia({ id, caseId: kase.id, kind: 'audio', mimeType: blob.type, fileName, blob, createdAt });
          addVoiceRecording(kase.id, { id, kind: 'audio', mimeType: blob.type, fileName, createdAt });
        } catch {
          setError('שמירת ההקלטה נכשלה.');
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('לא ניתן לגשת למיקרופון. יש לוודא שניתנה הרשאה בדפדפן.');
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="accident-step">
      <h1 className="accident-step-title">תיאור קולי (לא חובה)</h1>
      <p className="accident-step-question">אפשר להקליט תיאור קצר בקול של מה שקרה.</p>

      {!SUPPORTED && <p className="form-hint">הקלטה קולית אינה נתמכת בדפדפן זה.</p>}

      {SUPPORTED && (
        <div className="accident-voice-controls">
          {!recording ? (
            <button className="btn btn-primary btn-full" onClick={start}>🎙️ התחל הקלטה</button>
          ) : (
            <button className="btn btn-danger btn-full" onClick={stop}>⏹️ עצור הקלטה</button>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
      )}

      {kase.voiceRecordings.length > 0 && (
        <div className="accident-voice-list">
          {kase.voiceRecordings.map(m => (
            <div key={m.id} className="accident-voice-item">
              <MediaThumb media={m} />
              <button className="btn-ghost" onClick={() => deleteVoiceRecording(kase.id, m.id)} aria-label="מחק הקלטה">
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-secondary btn-full" style={{ marginTop: 16 }} onClick={onNext}>המשך</button>
    </div>
  );
}

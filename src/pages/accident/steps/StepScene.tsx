import { useRef } from 'react';
import { useAccidentStore } from '../../../store/AccidentContext';
import { AccidentCase, AccidentMediaRef, ACCIDENT_SCENE_CATEGORIES, AccidentSceneCategory } from '../../../types';
import { SCENE_CATEGORY_LABELS } from '../../../constants/accidentScene';
import { putMedia } from '../../../services/accidentMediaDb';
import { resizeImageToBlob } from '../../../utils/image';
import MediaThumb from '../../../components/MediaThumb';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export default function StepScene({ kase, onNext }: { kase: AccidentCase; onNext: () => void }) {
  const { addSceneMedia, removeSceneMedia, updateSceneNote } = useAccidentStore();

  const handlePhoto = async (category: AccidentSceneCategory, files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const blob = await resizeImageToBlob(file);
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        await putMedia({ id, caseId: kase.id, kind: 'photo', mimeType: blob.type, fileName: file.name, blob, createdAt });
        addSceneMedia(kase.id, category, { id, kind: 'photo', mimeType: blob.type, fileName: file.name, createdAt });
      } catch {
        // failed to decode/save this file — skip it, others continue
      }
    }
  };

  const handleVideo = async (category: AccidentSceneCategory, files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > MAX_VIDEO_BYTES) {
        alert('הקובץ גדול מדי (מעל 100MB).');
        continue;
      }
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      try {
        await putMedia({ id, caseId: kase.id, kind: 'video', mimeType: file.type, fileName: file.name, blob: file, createdAt });
        addSceneMedia(kase.id, category, { id, kind: 'video', mimeType: file.type, fileName: file.name, createdAt });
      } catch {
        alert('שמירת הווידאו נכשלה.');
      }
    }
  };

  return (
    <div className="accident-step">
      <h1 className="accident-step-title">תיעוד הזירה</h1>
      <p className="accident-step-question">מומלץ לתעד ככל האפשר — אין חובה למלא הכל.</p>

      <div className="accident-scene-list">
        {ACCIDENT_SCENE_CATEGORIES.map(category => {
          const item = kase.sceneMedia.find(sc => sc.category === category);
          const media = item?.media ?? [];
          return (
            <SceneCategoryCard
              key={category}
              label={SCENE_CATEGORY_LABELS[category]}
              media={media}
              note={item?.note}
              onPhoto={files => handlePhoto(category, files)}
              onVideo={files => handleVideo(category, files)}
              onRemove={mediaId => removeSceneMedia(kase.id, category, mediaId)}
              onNoteChange={note => updateSceneNote(kase.id, category, note)}
            />
          );
        })}
      </div>

      <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={onNext}>המשך</button>
    </div>
  );
}

function SceneCategoryCard({
  label,
  media,
  note,
  onPhoto,
  onVideo,
  onRemove,
  onNoteChange,
}: {
  label: string;
  media: AccidentMediaRef[];
  note?: string;
  onPhoto: (files: FileList | null) => void;
  onVideo: (files: FileList | null) => void;
  onRemove: (mediaId: string) => void;
  onNoteChange: (note: string) => void;
}) {
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  return (
    <div className={`accident-scene-category ${media.length > 0 ? 'has-media' : ''}`}>
      <div className="accident-scene-category-head">
        <span className="accident-scene-category-title">{label}</span>
        {media.length > 0 && <span className="accident-scene-category-badge">✓ תועד ({media.length})</span>}
      </div>

      {media.length > 0 && (
        <div className="accident-media-strip">
          {media.map(m => (
            <div key={m.id} className="accident-media-strip-item">
              <MediaThumb media={m} className="accident-media-thumb" />
              <button className="accident-media-remove" onClick={() => onRemove(m.id)} aria-label="הסר">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="accident-scene-actions">
        <button className="btn btn-secondary btn-sm" onClick={() => photoInput.current?.click()}>📷 הוסף תמונה</button>
        <button className="btn btn-secondary btn-sm" onClick={() => videoInput.current?.click()}>🎥 הוסף וידאו</button>
      </div>
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={e => { onPhoto(e.target.files); e.target.value = ''; }}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/*"
        capture="environment"
        hidden
        onChange={e => { onVideo(e.target.files); e.target.value = ''; }}
      />

      <input
        type="text"
        className="form-input accident-scene-note"
        placeholder="הערה (לא חובה)"
        defaultValue={note ?? ''}
        onBlur={e => onNoteChange(e.target.value)}
      />
    </div>
  );
}

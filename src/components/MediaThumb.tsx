import { useEffect, useState } from 'react';
import { AccidentMediaRef } from '../types';
import { getMediaBlob } from '../services/accidentMediaDb';

/**
 * Renders a preview for a media reference whose bytes live in IndexedDB.
 * Loads the blob asynchronously and creates/revokes its own object URL —
 * never assume the blob exists (it can be missing after a failed save or
 * on an old/unsupported browser), so a load failure just renders a
 * placeholder instead of throwing.
 */
export default function MediaThumb({ media, className }: { media: AccidentMediaRef; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    getMediaBlob(media.id)
      .then(blob => {
        if (cancelled) return;
        if (!blob) { setFailed(true); return; }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media.id]);

  if (failed) {
    return <div className={`media-thumb media-thumb-missing ${className ?? ''}`} aria-label="לא ניתן לטעון">⚠️</div>;
  }
  if (!url) {
    return <div className={`media-thumb media-thumb-loading ${className ?? ''}`} aria-hidden="true" />;
  }
  if (media.kind === 'photo') {
    return <img className={`media-thumb ${className ?? ''}`} src={url} alt="" />;
  }
  if (media.kind === 'video') {
    return <video className={`media-thumb ${className ?? ''}`} src={url} controls preload="metadata" />;
  }
  if (media.kind === 'audio') {
    return <audio className={`media-audio ${className ?? ''}`} src={url} controls />;
  }
  // document
  return (
    <a className={`media-thumb media-thumb-doc ${className ?? ''}`} href={url} target="_blank" rel="noreferrer">
      📎 {media.fileName}
    </a>
  );
}

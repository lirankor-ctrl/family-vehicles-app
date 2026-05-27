/**
 * Resize + compress an image File into a small JPEG data URL, so vehicle
 * photos stay tiny inside the localStorage JSON blob (no external storage).
 *
 * Keeps aspect ratio, caps the longest edge at `maxEdge`, and re-encodes as
 * JPEG at `quality`. A ~4000px phone photo becomes a ~50–150 KB data URL.
 */
export function resizeImageToDataUrl(
  file: File,
  maxEdge = 1000,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read-failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode-failed'));
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, maxEdge / Math.max(width, height));
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no-canvas')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

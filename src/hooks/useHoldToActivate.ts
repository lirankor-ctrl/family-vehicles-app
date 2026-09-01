import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  durationMs?: number;
  onActivate: () => void;
}

/**
 * Press-and-hold-for-N-seconds gesture. Uses pointer events (not the
 * deprecated mouse/touch pair) so it works uniformly across mouse, touch and
 * pen input, plus requestAnimationFrame for smooth progress. Releasing,
 * cancelling, or the pointer leaving the element before `durationMs` resets
 * progress to zero and never fires `onActivate`.
 */
export function useHoldToActivate({ durationMs = 3000, onActivate }: Options) {
  const [progress, setProgress] = useState(0); // 0..1
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  const reset = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setHolding(false);
    setProgress(0);
  }, []);

  const tick = useCallback(() => {
    const elapsed = performance.now() - startRef.current;
    const p = Math.min(1, elapsed / durationMs);
    setProgress(p);
    if (p >= 1) {
      onActivate();
      reset();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [durationMs, onActivate, reset]);

  const start = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      startRef.current = performance.now();
      setHolding(true);
      rafRef.current = requestAnimationFrame(tick);
    },
    [tick],
  );

  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); }, []);

  return {
    progress,
    holding,
    handlers: {
      onPointerDown: start,
      onPointerUp: reset,
      onPointerCancel: reset,
      onPointerLeave: reset,
    },
  };
}

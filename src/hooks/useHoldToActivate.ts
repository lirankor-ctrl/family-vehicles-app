import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  durationMs?: number;
  onActivate: () => void;
}

/**
 * Press-and-hold-for-N-seconds gesture, built for mobile reliability.
 *
 * The 3-second completion is driven by a single `setTimeout` (not by
 * polling elapsed time inside a requestAnimationFrame loop) so it fires
 * exactly once, deterministically, regardless of frame timing.
 * `requestAnimationFrame` is used only to animate the visual progress ring
 * — it never gates activation.
 *
 * Only `pointerup`/`pointercancel` cancel a hold in progress. `pointerleave`
 * is intentionally NOT wired to cancel: with pointer capture active, a touch
 * pointer routinely reports itself as having "left" the element's bounds
 * during an otherwise-stationary hold (finger jitter), which was cancelling
 * the timer on mobile well before the 3 seconds completed — release is
 * still reliably detected via pointerup/pointercancel since capture
 * redirects those events to this element regardless of where the pointer
 * physically is.
 */
export function useHoldToActivate({ durationMs = 3000, onActivate }: Options) {
  const [progress, setProgress] = useState(0); // 0..1, drives the visual ring only
  const [holding, setHolding] = useState(false);

  const timeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const hasTriggeredRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Always call the latest onActivate without needing to re-arm the timer on every render.
  const onActivateRef = useRef(onActivate);
  useEffect(() => { onActivateRef.current = onActivate; }, [onActivate]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const animateProgress = useCallback(() => {
    if (hasTriggeredRef.current) return;
    const elapsed = performance.now() - startTimeRef.current;
    setProgress(Math.min(1, elapsed / durationMs));
    if (elapsed < durationMs) {
      rafRef.current = requestAnimationFrame(animateProgress);
    }
  }, [durationMs]);

  const reset = useCallback(() => {
    clearTimers();
    activePointerIdRef.current = null;
    setHolding(false);
    setProgress(0);
  }, [clearTimers]);

  const start = useCallback(
    (e: React.PointerEvent) => {
      // ignore a second pointer touching down while a hold is already in progress
      if (activePointerIdRef.current !== null) return;

      hasTriggeredRef.current = false;
      activePointerIdRef.current = e.pointerId;
      try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* unsupported — hold still works */ }

      startTimeRef.current = performance.now();
      setHolding(true);
      setProgress(0);
      rafRef.current = requestAnimationFrame(animateProgress);

      timeoutRef.current = window.setTimeout(() => {
        if (hasTriggeredRef.current) return;
        hasTriggeredRef.current = true;
        clearTimers();
        activePointerIdRef.current = null;
        setProgress(1);
        setHolding(false);
        onActivateRef.current();
      }, durationMs);
    },
    [animateProgress, clearTimers],
  );

  const cancel = useCallback(
    (e: React.PointerEvent) => {
      // a trailing pointerup/pointercancel that arrives right after a
      // successful activation must never undo it
      if (hasTriggeredRef.current) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
      reset();
    },
    [reset],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    progress,
    holding,
    handlers: {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerCancel: cancel,
    },
  };
}

import { useEffect, useState, RefObject } from 'react';

interface AutoPreviewEntry {
  id: string;
  getElement: () => HTMLElement | null;
  eligible: boolean;
}

const entries = new Map<string, AutoPreviewEntry>();
const listeners = new Set<(winnerId: string | null) => void>();
let currentWinnerId: string | null = null;
let rafId: number | null = null;
let globalListenersAttached = false;

const evaluateTopmostWinner = () => {
  rafId = null;
  if (typeof window === 'undefined') return;

  const vh = window.innerHeight || document.documentElement.clientHeight;
  let bestId: string | null = null;
  let bestTop = Infinity;

  entries.forEach((entry) => {
    if (!entry.eligible) return;
    const el = entry.getElement();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Must be meaningfully visible inside viewport
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, vh);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleRatio = visibleHeight / rect.height;

    if (visibleHeight < 40 || visibleRatio < 0.25) return;

    // Pick the eligible auto-preview container that sits topmost in the screen
    if (rect.top < bestTop) {
      bestTop = rect.top;
      bestId = entry.id;
    }
  });

  if (bestId !== currentWinnerId) {
    currentWinnerId = bestId;
    listeners.forEach((fn) => fn(currentWinnerId));
  }
};

export const scheduleAutoPreviewRecompute = () => {
  if (typeof window === 'undefined') return;
  if (rafId !== null) return;
  rafId = window.requestAnimationFrame(evaluateTopmostWinner);
};

const ensureGlobalListeners = () => {
  if (globalListenersAttached || typeof window === 'undefined') return;
  globalListenersAttached = true;
  window.addEventListener('scroll', scheduleAutoPreviewRecompute, { passive: true, capture: true });
  window.addEventListener('resize', scheduleAutoPreviewRecompute, { passive: true });
  window.addEventListener('orientationchange', scheduleAutoPreviewRecompute, { passive: true });
};

/**
 * Coordinates all auto-preview rows/hero sections across Desktop, Mobile Portrait, and Mobile Landscape.
 * When 2 or more auto-preview sections are simultaneously visible on screen, ONLY the topmost one
 * receives `true` to play its preview.
 */
export const useTopmostAutoPreview = (
  slotId: string,
  elementRef: RefObject<HTMLElement | null>,
  isEligible: boolean
): boolean => {
  const [winnerId, setWinnerId] = useState<string | null>(currentWinnerId);

  useEffect(() => {
    ensureGlobalListeners();
    const listener = (nextWinner: string | null) => {
      setWinnerId(nextWinner);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    entries.set(slotId, {
      id: slotId,
      getElement: () => elementRef.current,
      eligible: isEligible
    });
    evaluateTopmostWinner();

    return () => {
      entries.delete(slotId);
      scheduleAutoPreviewRecompute();
    };
  }, [slotId, elementRef, isEligible]);

  return isEligible && winnerId === slotId;
};

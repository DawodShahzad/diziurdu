import { Show } from '../types';
import { resolveShowShareMeta } from './shareMeta';

/**
 * Triggers subtle native haptic micro-vibration (default 10ms) on supported touch devices.
 * Safely no-ops on desktop or browsers without the Vibration API.
 */
export function triggerHaptic(durationMs = 10): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
  } catch {
    // Ignore vibration errors on restricted platforms
  }
}

/**
 * Attempts to launch the native OS Share Sheet (navigator.share) on mobile devices.
 * Returns true if the native sheet handled the share (including user cancellation),
 * or false if the caller should fall back to the custom ShareModal.
 */
export async function shareShowNative(
  show: Show,
  platformName = 'Dizi Urdu',
  isMobileView = true
): Promise<boolean> {
  if (!isMobileView) return false;
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://diziurdu.com';
  const slug = show.slug || show.id;
  const shareUrl = `${origin}/watch/${slug}`;
  const { shareTitle, shareDescription } = resolveShowShareMeta(show, platformName, isMobileView);

  try {
    triggerHaptic(10);
    await navigator.share({
      title: shareTitle,
      text: shareDescription,
      url: shareUrl
    });
    return true;
  } catch (err: any) {
    // AbortError means user explicitly dismissed the native share sheet — do NOT open fallback modal
    if (err && (err.name === 'AbortError' || err.code === 20)) {
      return true;
    }
    return false;
  }
}
